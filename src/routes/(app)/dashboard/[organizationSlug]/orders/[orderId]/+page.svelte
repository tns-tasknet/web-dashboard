<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';

	let { data }: PageProps = $props();

	const report = $derived(data.report);
	const slug = $derived(page.params.organizationSlug);

	const createdAtText = $derived(
		report?.createdAt ? new Date(report.createdAt as any).toLocaleString() : '—'
	);
	const assignedName = $derived(
		report?.assignee?.user?.name ?? report?.assignee?.user?.email ?? '—'
	);

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

	type TabKey = 'details' | 'history' | 'messages';
	const TAB_LABEL: Record<TabKey, string> = {
		details: 'Detalles',
		history: 'Historial',
		messages: 'Mensajería'
	};
	let tab = $state<TabKey>('details');

	// Historial
	// Reemplazar por data real: $derived(data.report.history ?? []))
	type EventType =
		| 'CREATED'
		| 'ASSIGNED'
		| 'REASSIGNED'
		| 'STATE_CHANGED'
		| 'NOTE'
		| 'CLOSED';

	type HistoryEvent = {
		id: string | number;
		timestamp: string | Date;
		type: EventType;
		actor?: string;
		payload?: Record<string, any>;
		description?: string;
	};

	const events: HistoryEvent[] = [
		{ id: 1, timestamp: '2025-10-24T14:31:00Z', type: 'CREATED', actor: 'Coordinador' }
	];

	const BADGE_CLASS: Record<EventType, string> = {
		CREATED: 'badge badge-success',
		ASSIGNED: 'badge badge-info',
		REASSIGNED: 'badge badge-warning',
		STATE_CHANGED: 'badge badge-primary',
		NOTE: 'badge badge-neutral',
		CLOSED: 'badge badge-success'
	};
	const LABEL: Record<EventType, string> = {
		CREATED: 'Creación',
		ASSIGNED: 'Asignación',
		REASSIGNED: 'Reasignación',
		STATE_CHANGED: 'Cambio de estado',
		NOTE: 'Nota',
		CLOSED: 'Cierre'
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

	const ordered = [...events].sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
	);

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

	const STATUS_OPTIONS = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as const;

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

	// Técnicos seleccionables
	type Option = { value: string; label: string };
	const technicianOptions = $derived<Option[]>(
		report?.assignee?.id ? [{ value: report.assignee.id, label: assignedName }] : []
	);
</script>

<div class="max-w-5xl mx-auto py-6 space-y-6">
	<div class="card bg-base-100 border">
		<div class="card-body gap-3">
			<div class="flex items-start justify-between gap-4">
				<div class="space-y-1">
					<h1 class="text-2xl font-bold">
						{report?.title ?? 'Sin título'}
					</h1>
					<p class="opacity-70 max-w-prose">
						{report?.content ?? '—'}
					</p>
				</div>
				<div class="text-right space-y-2">
					<div class="badge {STATUS_BADGE[report?.status ?? 'PENDING']}">
						{STATUS_LABEL[report?.status ?? 'PENDING']}
					</div>
					<div class="text-xs opacity-60">ID: {report?.id}</div>
				</div>
			</div>

			<div class="divider my-2"></div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
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
	<div class="tabs tabs-boxed w-full">
		<button class="tab {tab === 'details' ? 'tab-active' : ''}" onclick={() => (tab = 'details')}>
			Resumen
		</button>
		<button class="tab {tab === 'history' ? 'tab-active' : ''}" onclick={() => (tab = 'history')}>
			Historial
		</button>
		<button class="tab {tab === 'messages' ? 'tab-active' : ''}" onclick={() => (tab = 'messages')}>
			Mensajes
		</button>
	</div>

	<!-- Detalles -->
	{#if tab === 'details'}
	<div class="card bg-base-100 border">
		<div class="card-body gap-6">
			<h2 class="card-title">Detalles</h2>

			{#if isCompleted}
			<div class="alert alert-info text-sm">
				<span>La orden está <b>Completada</b>. Los campos permanecen de solo lectura.</span>
			</div>
			{/if}

			<form method="POST" class="space-y-4">
				<input type="hidden" name="intent" value="update" />

				<div class="form-control">
					<label class="label" for="title"><span class="label-text">Título</span></label>
					<input
						id="title"
						class="input input-bordered w-full"
						placeholder="Título de la orden"
						name="title"
						bind:value={form.title}
						disabled={isCompleted}
						required
					/>
				</div>

				<div class="form-control">
					<label class="label" for="content"><span class="label-text">Descripción</span></label>
					<textarea
						id="content"
						class="textarea textarea-bordered w-full min-h-[10rem]"
						placeholder="Describe el trabajo a realizar…"
						name="content"
						bind:value={form.content}
						disabled={isCompleted}
					></textarea>
				</div>

				<div class="form-control">
					<label class="label" for="status"><span class="label-text">Estado</span></label>
					<select
						id="status"
						class="select select-bordered w-full"
						name="status"
						bind:value={form.status}
						disabled={isCompleted}
					>
						{#each STATUS_OPTIONS as st}
							<option value={st}>{STATUS_LABEL[st]}</option>
						{/each}
					</select>
				</div>

				<div class="form-control">
					<label class="label" for="assigneeId"><span class="label-text">Técnico asignado</span></label>
					<select
						id="assigneeId"
						class="select select-bordered w-full"
						name="assigneeId"
						bind:value={form.assigneeId}
						disabled={isCompleted}
					>
						<option value="" disabled selected hidden>
							{assignedName !== '—' ? assignedName : 'Selecciona técnico'}
						</option>
						{#each technicianOptions as opt}
						<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
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
	<div class="card bg-base-100 border mt-4">
		<div class="card-body">
			<h2 class="card-title">Historial</h2>
			<p class="opacity-70 text-sm mb-3">Secuencia de eventos relevantes hasta el cierre.</p>
			<div class="space-y-2">
				{#each ordered as e (e.id)}
				<div class="flex flex-col items-center text-center px-2 py-3 rounded hover:bg-base-200/50">
					<div class="text-sm opacity-70">{fmt(e.timestamp)}</div>
					<div class="mt-1">
					<span class={BADGE_CLASS[e.type]}>{LABEL[e.type]}</span>
					</div>
					<div class="timeline-box mt-2">
					{describe(e)}
					{#if e.type === 'STATE_CHANGED' && e.payload?.note}
						<div class="mt-1 text-xs opacity-70">Nota: {e.payload.note}</div>
					{/if}
					</div>
				</div>
				<div class="divider my-0"></div>
				{/each}
			</div>

			<style>
				@media (max-width: 640px) {
					:global(.grid.grid-cols-\[12rem,10rem,1fr\]) {
						grid-template-columns: 1fr;
					}
				}
			</style>
		</div>
	</div>
	{/if}

	<!-- Mensajería -->
	{#if tab === 'messages'}
		<div class="card bg-base-100 border">
			<div class="card-body gap-4">
				<h2 class="card-title">Mensajes</h2>
				<p class="opacity-80">
					(Chat contextual con participantes de la orden con soporte para etiquetas por mensaje)
				</p>
			</div>
		</div>
	{/if}

</div>
