<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';

	let { data }: PageProps = $props();
	const report = $derived(data.report);
	const slug = $derived(page.params.organizationSlug);

	const STATUS_LABEL: Record<string, string> = {
		PENDING: 'Pendiente',
		SCHEDULED: 'Agendada',
		IN_PROGRESS: 'En progreso',
		COMPLETED: 'Completada'
	};
	const STATUS_BADGE: Record<string, string> = {
		PENDING: 'badge-warning',
		SCHEDULED: 'badge-info',
		IN_PROGRESS: 'badge-primary',
		COMPLETED: 'badge-ghost'
	};
	const STATUS_OPTIONS = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as const;

	type TabKey = 'details' | 'history' | 'messages';
	type Option = { value: string; label: string };

	type EventType = 'CREATED' | 'ASSIGNED' | 'REASSIGNED' | 'STATE_CHANGED' | 'NOTE' | 'CLOSED';

	type HistoryEvent = {
		id: string | number;
		timestamp: string | Date;
		type: EventType;
		actor?: string;
		payload?: {
			from?: string;
			to?: string;
			note?: string;
			[k: string]: any;
		};
		description?: string;
	};

	let tab = $state<TabKey>('details');

	let form = $state({
		title: '',
		content: '',
		status: 'PENDING' as string,
		assigneeId: ''
	});

	$effect(() => {
		if (report) {
			form.title = report.title ?? '';
			form.content = report.content ?? '';
			form.status = (report.status as string) ?? 'PENDING';
			form.assigneeId = report.assignee?.id ?? '';
		}
	});

	const isCompleted = $derived(form.status === 'COMPLETED');

	const initial = $derived({
		title: report?.title ?? '',
		content: report?.content ?? '',
		status: (report?.status as string) ?? 'PENDING',
		assigneeId: report?.assignee?.id ?? ''
	});

	const isDirty = $derived(
		form.title !== initial.title ||
			form.content !== initial.content ||
			form.status !== initial.status ||
			form.assigneeId !== initial.assigneeId
	);

	const technicianOptions = $derived<Option[]>(data.technicianOptions ?? []);

	const currentAssigneeId = $derived(report?.assignee?.id ?? '');
	const currentAssigneeOpt = $derived<Option | null>(
		currentAssigneeId && !technicianOptions.some((o) => o.value === currentAssigneeId)
			? {
					value: currentAssigneeId,
					label: `${report?.assignee?.user?.name || report?.assignee?.user?.email || currentAssigneeId} (actual)`
				}
			: null
	);

	const techOptionsForRender: Option[] = $derived([
		...(currentAssigneeOpt ? [currentAssigneeOpt] : []),
		...technicianOptions
	]);

	const createdAtText = $derived(
		report?.createdAt
			? new Date(report.createdAt as any).toLocaleString('es-CL', {
					dateStyle: 'short',
					timeStyle: 'short'
				})
			: '—'
	);

	const assignedName = $derived(
		report?.assignee?.user?.name ?? report?.assignee?.user?.email ?? '—'
	);

	const LABEL: Record<EventType, string> = {
		CREATED: 'Creación',
		ASSIGNED: 'Asignación',
		REASSIGNED: 'Reasignación',
		STATE_CHANGED: 'Cambio de estado',
		NOTE: 'Nota',
		CLOSED: 'Cierre'
	};

	const BADGE_CLASS: Record<EventType, string> = {
		CREATED: 'badge badge-success',
		ASSIGNED: 'badge badge-info',
		REASSIGNED: 'badge badge-warning',
		STATE_CHANGED: 'badge badge-primary',
		NOTE: 'badge badge-neutral',
		CLOSED: 'badge badge-success'
	};

	function fmt(ts: string | Date) {
		const d = new Date(ts);
		if (isNaN(d.getTime())) return '—';
		return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
	}

	function describe(e: HistoryEvent) {
		if (e.description) return e.description;
		switch (e.type) {
			case 'CREATED':
				return `Orden creada${e.actor ? ` por ${e.actor}` : ''}.`;
			case 'ASSIGNED':
				return `Asignada a ${e.payload?.to ?? '—'}${e.actor ? ` por ${e.actor}` : ''}.`;
			case 'REASSIGNED':
				return `Reasignada a ${e.payload?.to ?? '—'}${e.actor ? ` por ${e.actor}` : ''}.`;
			case 'STATE_CHANGED':
				return `Estado: ${e.payload?.from ?? '—'} → ${e.payload?.to ?? '—'}${e.actor ? ` (por ${e.actor})` : ''}.`;
			case 'NOTE':
				return `Nota${e.actor ? ` de ${e.actor}` : ''}.`;
			case 'CLOSED':
				return `Orden cerrada${e.actor ? ` por ${e.actor}` : ''}.`;
			default:
				return '';
		}
	}

	const events: HistoryEvent[] = (data as any)?.report?.history ?? [
		{ id: 1, timestamp: '2025-10-24T14:31:00Z', type: 'CREATED', actor: 'Coordinador' }
	];

	const ordered = $derived(
		[...events].sort(
			(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
		)
	);

	// [SIMULACIÓN – MENSAJERÍA] Tipos/estado locales para el chat.
	// Se pueden reutilizar los tipos y la estructura de estado; si conectas a tu API, reemplaza el array y los flujos marcados abajo.
	type Role = 'Técnico' | 'Coordinador';
	type Message = {
		id: string;
		text: string;
		createdAt: Date;
		tags: string[];
		author: { name: string; role: Role; avatarUrl?: string | null };
		mine: boolean; // true si lo envió el usuario actual (Coordinador)
	};

	// [SIMULACIÓN – MENSAJERÍA]
	// Quitar al añadir IDs con backend
	const uid = () => Math.random().toString(36).slice(2, 10);

	// [SIMULACIÓN – MENSAJERÍA]
	// Estado de UI del chat
	let msgLoading = $state(true); // spinner/skeleton mientras "carga"
	let msgSending = $state(false); // botón enviar en progreso
	let msgError = $state<string | null>(null);

	// [SIMULACIÓN – MENSAJERÍA]
	// Cargar el catálogo de equitetas desde el backend tras definirlo
	const msgAvailableTags = [
		'#avance',
		'#pregunta',
		'#bloqueo',
		'#riesgo',
		'#materiales',
		'#coordinación'
	];
	let msgSelectedTags = $state<string[]>(['#coordinación']);

	// [SIMULACIÓN – MENSAJERÍA]
	// Datos simulados a sustituir por el fetch
	let messages = $state<Message[]>([
		{
			id: uid(),
			text: 'Buenos días. Iniciamos intervención en sitio a las 09:10. Verificación eléctrica OK.',
			createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
			tags: ['#avance'],
			author: { name: 'Alonso Leones', role: 'Técnico', avatarUrl: null },
			mine: false
		},
		{
			id: uid(),
			text: 'Queda pendiente confirmar número de serie del equipo secundario (foto borrosa).',
			createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4 + 1000 * 60 * 12),
			tags: ['#pregunta', '#bloqueo'],
			author: { name: 'Alonso Leones', role: 'Técnico', avatarUrl: null },
			mine: false
		},
		{
			id: uid(),
			text: 'Recibido. ¿Puedes reenviar foto enfocada a la placa para validar contra inventario?',
			createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3 + 1000 * 60 * 25),
			tags: ['#coordinación'],
			author: { name: 'María Soto', role: 'Coordinador', avatarUrl: null },
			mine: false
		}
	]);

	// [SIMULACIÓN – MENSAJERÍA]
	// Composer
	let msgDraft = $state('');
	let msgListRef = $state<HTMLDivElement | null>(null);

	// [SIMULACIÓN – MENSAJERÍA]
	// Carga artificial a reemplazar por el fetch
	onMount(async () => {
		await new Promise((r) => setTimeout(r, 650));
		msgLoading = false;
		await tick();
		scrollMessagesToBottom();
	});

	function toggleMsgTag(tag: string) {
		msgSelectedTags = msgSelectedTags.includes(tag)
			? msgSelectedTags.filter((t) => t !== tag)
			: [...msgSelectedTags, tag];
	}

	function scrollMessagesToBottom() {
		if (!msgListRef) return;
		msgListRef.scrollTop = msgListRef.scrollHeight;
	}

	// [SIMULACIÓN – MENSAJERÍA]
	// Envío de mensajes optimista
	// Incluir HOOK API adentro para persistencia real.
	async function sendMessage() {
		if (!msgDraft.trim() || msgSending) return;
		msgSending = true;
		msgError = null;

		const optimistic: Message = {
			id: uid(),
			text: msgDraft.trim(),
			createdAt: new Date(),
			tags: [...msgSelectedTags],
			author: { name: 'Coordinador — Tú', role: 'Coordinador' },
			mine: true
		};
		messages.push(optimistic);
		msgDraft = '';
		await tick();
		scrollMessagesToBottom();

		try {
			// === HOOK API para persistencia real ===
			const res = await fetch(
				`/api/v1/${page.params.organizationSlug}/orders/${report?.id}/messages`,
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ text: optimistic.text, tags: optimistic.tags })
				}
			);
			if (!res.ok) throw new Error('Error al enviar mensaje');
			const saved = await res.json(); // { id, text, createdAt, tags, author, mine }
			messages = messages.map((m) => (m.id === optimistic.id ? saved : m));
		} catch (e) {
			msgError = 'No se pudo enviar el mensaje. Intenta nuevamente.';
			// === Para revertir el mensaje optimista ===
			messages = messages.filter((m) => m.id !== optimistic.id);
		} finally {
			msgSending = false;
		}
	}

	function onComposerKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<div class="mx-auto max-w-5xl space-y-6 py-6">
	<div class="card border bg-base-100">
		<div class="card-body gap-3">
			<div class="flex items-start justify-between gap-4">
				<div class="space-y-1">
					<h1 class="text-2xl font-bold">
						{report?.title ?? 'Sin título'}
					</h1>
					<p class="max-w-prose opacity-70">
						{report?.content ?? '—'}
					</p>
				</div>
				<div class="space-y-2 text-right">
					<div class="badge {STATUS_BADGE[report?.status ?? 'PENDING']}">
						{STATUS_LABEL[report?.status ?? 'PENDING']}
					</div>
					<div class="text-xs opacity-60">ID: {report?.id}</div>
				</div>
			</div>

			<div class="divider my-2"></div>

			<div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
				<div>
					<div class="opacity-60">Creada</div>
					<div class="font-medium">{createdAtText}</div>
				</div>
				<div>
					<div class="opacity-60">Técnico asignado</div>
					<div class="font-medium">{assignedName}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Tabs -->
	<div class="tabs-boxed tabs w-full">
		<button
			class="tab {tab === 'details' ? 'tab-active' : ''}"
			onclick={() => (tab = 'details')}
		>
			Detalles
		</button>
		<button
			class="tab {tab === 'history' ? 'tab-active' : ''}"
			onclick={() => (tab = 'history')}
		>
			Historial
		</button>
		<button
			class="tab {tab === 'messages' ? 'tab-active' : ''}"
			onclick={() => (tab = 'messages')}
		>
			Mensajes
		</button>
	</div>

	<!-- Detalles -->
	{#if tab === 'details'}
		<div class="card border bg-base-100">
			<div class="card-body gap-6">
				<h2 class="card-title">Detalles</h2>

				{#if isCompleted}
					<div class="alert text-sm alert-info">
						<span
							>La orden está <b>Completada</b>. Los campos permanecen de solo lectura.</span
						>
					</div>
				{/if}

				<form method="POST" class="space-y-4">
					<input type="hidden" name="intent" value="update" />

					<div class="form-control">
						<label class="label" for="title"
							><span class="label-text">Título</span></label
						>
						<input
							id="title"
							class="input-bordered input w-full"
							placeholder="Título de la orden"
							name="title"
							bind:value={form.title}
							disabled={isCompleted}
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="content"
							><span class="label-text">Descripción</span></label
						>
						<textarea
							id="content"
							class="textarea-bordered textarea min-h-[10rem] w-full"
							placeholder="Describe el trabajo a realizar…"
							name="content"
							bind:value={form.content}
							disabled={isCompleted}
						></textarea>
					</div>

					<div class="form-control">
						<label class="label" for="assigneeId">
							<span class="label-text">Técnico asignado</span>
						</label>

						<select
							id="assigneeId"
							class="select-bordered select w-full"
							name="assigneeId"
							bind:value={form.assigneeId}
							disabled={isCompleted}
							aria-label="Seleccionar técnico asignado"
						>
							{#if !report?.assignee?.id}
								<option value="" disabled selected hidden></option>
							{/if}

							{#each technicianOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>

						{#if !report?.assignee?.id && form.assigneeId === ''}
							<span class="mt-1 text-xs opacity-60">Sin técnico asignado</span>
						{/if}
					</div>

					<div class="divider my-4"></div>

					<div class="flex flex-wrap items-center gap-3">
						<button
							class="btn btn-primary"
							type="submit"
							disabled={!isDirty || isCompleted}
						>
							Guardar cambios
						</button>
						{#if isDirty}
							<span class="badge badge-warning">Cambios sin guardar</span>
						{:else}
							<span class="badge badge-ghost">Sin cambios</span>
						{/if}
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Historial -->
	{#if tab === 'history'}
		<div class="card mt-4 border bg-base-100">
			<div class="card-body">
				<h2 class="card-title">Historial</h2>
				<p class="mb-3 text-sm opacity-70">
					Secuencia de eventos relevantes hasta el cierre.
				</p>

				<div class="space-y-2">
					{#each ordered as e (e.id)}
						<div
							class="flex flex-col items-center rounded px-2 py-3 text-center hover:bg-base-200/50"
						>
							<div class="text-sm opacity-70">{fmt(e.timestamp)}</div>
							<div class="mt-1">
								<span class={BADGE_CLASS[e.type]}>{LABEL[e.type]}</span>
							</div>
							<div class="mt-2 timeline-box">
								{describe(e)}
								{#if e.type === 'STATE_CHANGED' && e.payload?.note}
									<div class="mt-1 text-xs opacity-70">
										Nota: {e.payload.note}
									</div>
								{/if}
							</div>
						</div>
						<div class="divider my-0"></div>
					{/each}
				</div>

				<style>
					@media (max-width: 640px) {
						:global(.grid.grid-cols-\[12rem, 10rem, 1fr\]) {
							grid-template-columns: 1fr;
						}
					}
				</style>
			</div>
		</div>
	{/if}

	<!-- Mensajería -->
	{#if tab === 'messages'}
		<div class="card border bg-base-100">
			<div class="card-body gap-4">
				<div class="flex items-start justify-between">
					<div>
						<h2 class="card-title">Mensajes</h2>
						<p class="text-sm opacity-80">
							Chat contextual entre participantes de la orden. Cada mensaje puede
							llevar etiquetas.
						</p>
					</div>
				</div>

				<!-- Lista de mensajes -->
				<div class="rounded-box border bg-base-200/40">
					{#if msgLoading}
						<!-- Skeleton de carga a reemplazar cuando se implemente el fetch real -->
						<div class="space-y-3 p-4">
							<div class="h-14 w-full skeleton"></div>
							<div class="h-14 w-5/6 skeleton"></div>
							<div class="h-14 w-4/5 skeleton"></div>
						</div>
					{:else}
						<div
							class="max-h-[28rem] space-y-3 overflow-y-auto p-3"
							bind:this={msgListRef}
						>
							{#if messages.length === 0}
								<div class="p-6 text-center opacity-70">
									Aún no hay mensajes en esta orden.
								</div>
							{:else}
								{#each messages as m (m.id)}
									<div class="chat {m.mine ? 'chat-end' : 'chat-start'}">
										<div class="avatar chat-image">
											<div class="w-8 rounded-full">
												{#if m.author.avatarUrl}
													<img
														src={m.author.avatarUrl}
														alt={m.author.name}
													/>
												{:else}
													<div
														class="grid h-8 w-8 place-items-center rounded-full bg-neutral text-xs text-neutral-content"
													>
														{m.author.name.slice(0, 1).toUpperCase()}
													</div>
												{/if}
											</div>
										</div>

										<div class="chat-header text-xs opacity-70">
											{m.author.name}
											<span class="ml-1">• {fmt(m.createdAt)}</span>
										</div>

										<div class="chat-bubble whitespace-pre-wrap">{m.text}</div>

										{#if m.tags.length}
											<div class="chat-footer mt-1 flex flex-wrap gap-1">
												{#each m.tags as t}
													<span class="badge badge-ghost badge-sm"
														>{t}</span
													>
												{/each}
											</div>
										{/if}
									</div>
								{/each}
							{/if}
						</div>
					{/if}
				</div>

				{#if msgError}
					<!-- Sustituir por el manejo de error del fetch -->
					<div class="alert text-sm alert-error"><span>{msgError}</span></div>
				{/if}

				<!-- Composer -->
				<div class="rounded-box border">
					<div class="border-b p-3">
						<div class="mb-2 text-sm opacity-70">Etiquetas</div>
						<div class="flex flex-wrap gap-2">
							{#each msgAvailableTags as tag}
								<button
									type="button"
									class="btn btn-xs {msgSelectedTags.includes(tag)
										? 'btn-primary'
										: 'btn-outline'}"
									onclick={() => toggleMsgTag(tag)}
									aria-pressed={msgSelectedTags.includes(tag)}
								>
									{tag}
								</button>
							{/each}
						</div>
					</div>

					<div class="space-y-3 p-3">
						<div class="form-control">
							<label class="label" for="msg">
								<span class="label-text">Escribe un mensaje</span>
								<span class="label-text-alt">Ctrl/Cmd + Enter para enviar</span>
							</label>
							<textarea
								id="msg"
								class="textarea-bordered textarea min-h-28 w-full"
								placeholder="Actualiza el estado, realiza una consulta o deja un comentario…"
								bind:value={msgDraft}
								onkeydown={onComposerKeydown}
							></textarea>
						</div>

						<div class="flex items-center justify-between">
							<div class="text-xs opacity-70">Enviar como <b>Coordinador</b></div>
							<div class="join">
								<button
									class="btn join-item btn-ghost btn-sm"
									type="button"
									onclick={() =>
										(msgDraft =
											msgDraft +
											(msgDraft.endsWith('\n') || msgDraft.length === 0
												? ''
												: '\n') +
											'#avance ')}
									title="Insertar etiqueta #avance"
								>
								</button>
								<button
									class="btn join-item btn-sm btn-primary"
									type="button"
									onclick={sendMessage}
									disabled={msgSending || !msgDraft.trim()}
								>
									{msgSending ? 'Enviando…' : 'Enviar'}
								</button>
							</div>
						</div>
					</div>
				</div>

				<div class="text-xs opacity-60">
					Sugerencia: usa etiquetas para facilitar el filtrado (#pregunta, #avance,
					#bloqueo, #riesgo, #materiales).
				</div>
			</div>
		</div>
	{/if}
</div>
