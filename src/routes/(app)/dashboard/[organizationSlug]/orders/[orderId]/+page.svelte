<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';

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

	// Opciones traídas desde el load (API /technicians)
	const technicianOptions = $derived<Option[]>(data.technicianOptions ?? []);

	// Datos derivados para asegurar que el técnico actual se muestre aunque no venga en la lista
	const currentAssigneeId = $derived(report?.assignee?.id ?? '');
	const currentAssigneeOpt = $derived<Option | null>(
	currentAssigneeId &&
	!technicianOptions.some(o => o.value === currentAssigneeId)
		? {
			value: currentAssigneeId,
			label:
			`${report?.assignee?.user?.name ||
				report?.assignee?.user?.email ||
				currentAssigneeId} (actual)`
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
							class="select select-bordered w-full"
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
				<h2 class="card-title">Mensajes</h2>
				<p class="opacity-80">
					(Chat contextual con participantes de la orden con soporte para etiquetas por
					mensaje)
				</p>
			</div>
		</div>
	{/if}
</div>
