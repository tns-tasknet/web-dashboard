<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	// Types - Revisar cuando se implemente la base de datos
	type TabKey = 'details' | 'evidence' | 'signatures' | 'rectifications' | 'history' | 'metadata';

	type Evidence = {
		id: string | number;
		url: string;
		name?: string;
	};

	type EventType = 'CREATED' | 'ASSIGNED' | 'REASSIGNED' | 'STATE_CHANGED' | 'NOTE' | 'CLOSED';

	type HistoryEvent = {
		id: string | number;
		timestamp: string | Date;
		type: EventType;
		actor?: string;
		payload?: Record<string, unknown>;
		description?: string;
	};

	type RectRole = 'COORDINATOR' | 'TECHNICIAN';
	type Rectification = {
		id: string;
		createdAt: string; // ISO
		authorRole: RectRole;
		authorName: string;
		note: string;
	};

	let { data }: PageProps = $props();

	// Constantes UI - Revisar cuando se implemente la base de datos
	const STATUS_LABEL: Record<string, string> = {
		PENDING: 'Pendiente',
		SCHEDULED: 'Agendada',
		IN_PROGRESS: 'En progreso',
		COMPLETED: 'Orden cerrada'
	};

	const STATUS_BADGE: Record<string, string> = {
		PENDING: 'badge-warning',
		SCHEDULED: 'badge-info',
		IN_PROGRESS: 'badge-primary',
		COMPLETED: 'badge-ghost'
	};

	const TAB_LABEL: Record<TabKey, string> = {
		details: 'Detalles',
		evidence: 'Evidencia',
		signatures: 'Firmas',
		rectifications: 'Rectificaciones',
		history: 'Historial',
		metadata: 'Metadatos'
	};

	const ROLE_LABEL: Record<RectRole, string> = {
		COORDINATOR: 'Coordinador',
		TECHNICIAN: 'Técnico'
	};

	const BADGE_CLASS: Record<EventType, string> = {
		CREATED: 'badge badge-success',
		ASSIGNED: 'badge badge-info',
		REASSIGNED: 'badge badge-warning',
		STATE_CHANGED: 'badge badge-primary',
		NOTE: 'badge badge-neutral',
		CLOSED: 'badge badge-success'
	};

	const EVENT_LABEL: Record<EventType, string> = {
		CREATED: 'Creación',
		ASSIGNED: 'Asignación',
		REASSIGNED: 'Reasignación',
		STATE_CHANGED: 'Cambio de estado',
		NOTE: 'Nota',
		CLOSED: 'Cierre'
	};

	// Helpers 
	function formatDate(value: unknown) {
		if (!value) return '—';
		const d = new Date(value as any);
		if (isNaN(d.getTime())) return '—';
		return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
	}

	function formatDuration(ms: number) {
		if (!isFinite(ms)) return '—';
		ms = Math.max(0, ms);
		const d = Math.floor(ms / 86_400_000);
		const h = Math.floor((ms / 3_600_000) % 24);
		const m = Math.floor((ms / 60_000) % 60);
		if (d > 0) return `${d} d ${h} h ${m} min`;
		if (h > 0) return `${h} h ${m} min`;
		return `${m} min`;
	}

	function fmt(ts: string | Date) {
		return formatDate(ts);
	}

	// Revisar cuando se implemente la base de datos
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
				return `Estado: ${e.payload?.from ?? '—'} → ${e.payload?.to ?? '—'}${
					e.actor ? ` (por ${e.actor})` : ''
				}.`;
			case 'NOTE':
				return `Nota${e.actor ? ` de ${e.actor}` : ''}.`;
			case 'CLOSED':
				return `Orden cerrada${e.actor ? ` por ${e.actor}` : ''}.`;
			default:
				return '';
		}
	}

	const report = $derived(data.report);
	const slug = $derived(page.params.organizationSlug);

	const createdAtText = $derived(formatDate(report?.createdAt));
	const updatedAtText = $derived(formatDate(report?.updatedAt));
	const durationText = $derived(
		report?.createdAt && report?.updatedAt
			? formatDuration(
					new Date(report.updatedAt as any).getTime() -
						new Date(report.createdAt as any).getTime()
			  )
			: '—'
	);
	const assignedName = $derived(
		report?.assignee?.user?.name ?? report?.assignee?.user?.email ?? '—'
	);

	let tab = $state<TabKey>('details');

	// Evidencias (preview con modal)
	// Reemplazar por data real: const evidences: Evidence[] = $derived(data.report.evidences ?? []);
	const evidences: Evidence[] = [
		{ id: 1, url: 'https://picsum.photos/400', name: 'Foto A' },
		{ id: 2, url: 'https://picsum.photos/401', name: 'Foto B' }
	];

	let preview: Evidence | null = $state(null);
	let modalEl = $state<HTMLDialogElement | null>(null);

	function openPreview(item: Evidence) {
		preview = item;
		modalEl?.showModal();
	}

	// Historial (timeline en grilla)
	// Reemplazar por data real: const events = $derived(data.report.history ?? []);
	const events: HistoryEvent[] = [
		{ id: 1, timestamp: '2025-10-24T14:31:00Z', type: 'CREATED', actor: 'Coordinador' },
		{
			id: 2,
			timestamp: '2025-10-24T16:05:00Z',
			type: 'ASSIGNED',
			actor: 'Coordinador',
			payload: { to: 'Juan Pérez' }
		},
		{
			id: 3,
			timestamp: '2025-10-24T18:12:00Z',
			type: 'STATE_CHANGED',
			actor: 'Juan Pérez',
			payload: { from: 'IN_PROGRESS', to: 'COMPLETED' }
		},
		{ id: 4, timestamp: '2025-10-25T18:12:00Z', type: 'CLOSED', actor: 'Coordinador' }
	];

	const ordered = [...events].sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
	);

	// Rectificaciones (placeholder + fetch)
	// Reemplazar por data real: onMount(() => { if (report?.id && slug) fetchRectifications(report.id, slug); });
	const EXAMPLE_RECTS: Rectification[] = [
		{
			id: 'r1',
			createdAt: '2025-10-26T09:12:00-03:00',
			authorRole: 'COORDINATOR',
			authorName: 'Alonso Leones',
			note: 'Se corrige número de serie en la foto 2 (era SN-XYZ-002).'
		},
		{
			id: 'r2',
			createdAt: '2025-10-26T15:22:00-03:00',
			authorRole: 'TECHNICIAN',
			authorName: 'Juan Pérez',
			note: 'Se añade nota: se reemplazó también el patch panel #3.'
		}
	];

	let rectifications = $state<Rectification[]>(EXAMPLE_RECTS);

	async function fetchRectifications(reportId: number | string, orgSlug: string) {
		const res = await fetch(`/${orgSlug}/reports/${reportId}/api/rectifications`);
		if (!res.ok) throw new Error('No fue posible cargar rectificaciones');
		const data: Rectification[] = await res.json();
		rectifications = data.sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	}
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
		<button class={"tab " + (tab === 'details' ? 'tab-active' : '')} onclick={() => (tab = 'details')}>
			Detalles
		</button>
		<button class={"tab " + (tab === 'evidence' ? 'tab-active' : '')} onclick={() => (tab = 'evidence')}>
			Evidencia
		</button>
		<button class={"tab " + (tab === 'signatures' ? 'tab-active' : '')} onclick={() => (tab = 'signatures')}>
			Firmas
		</button>
		<button class={"tab " + (tab === 'rectifications' ? 'tab-active' : '')} onclick={() => (tab = 'rectifications')}>
			Rectificaciones
		</button>
		<button class={"tab " + (tab === 'history' ? 'tab-active' : '')} onclick={() => (tab = 'history')}>
			Historial
		</button>
		<button class={"tab " + (tab === 'metadata' ? 'tab-active' : '')} onclick={() => (tab = 'metadata')}>
			Metadatos
		</button>
	</div>

	<!-- Detalles -->
	{#if tab === 'details'}
	<div class="card bg-base-100 border mt-4">
		<div class="card-body gap-4">
			<div class="flex items-start justify-between">
				<h2 class="card-title">Detalles del reporte</h2>
				<div class="join">
					<button class="btn btn-sm join-item btn-ghost" disabled>Exportar CSV</button>
					<button class="btn btn-sm join-item btn-ghost" disabled>Exportar PDF</button>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
				<div>
					<div class="opacity-60">ID</div>
					<div class="font-medium">{report?.id ?? '—'}</div>
				</div>		
				<div>
					<div class="opacity-60">Título</div>
					<div class="font-medium">{report?.title ?? '—'}</div>
				</div>
				<div>
					<div class="opacity-60">Técnico responsable</div>
					<div class="font-medium">{report?.assignee?.user?.name ?? '—'}</div>
				</div>
				<div>
				<div class="opacity-60">Creación</div>
				<div class="font-medium">{createdAtText}</div>
				</div>
				<div>
				<div class="opacity-60">Finalización</div>
				<div class="font-medium">{updatedAtText}</div>
				</div>
				<div>
				<div class="opacity-60">Duración</div>
				<div class="font-medium">{durationText}</div>
				</div>
			</div>

			<div class="divider"></div>

			<div class="space-y-1">
				<div class="opacity-60 text-sm">Descripción final</div>
				<p class="leading-relaxed">
					{report?.content}
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
				<div>
					<div class="opacity-60 text-sm mb-1">Actividades realizadas</div>
					<ul class="list-disc ml-5 space-y-1 text-sm">
						<li>Diagnóstico de red</li>
						<li>Reemplazo de patch cord</li>
						<li>Pruebas de conectividad</li>
					</ul>
				</div>
				<div>
					<div class="opacity-60 text-sm mb-1">Materiales usados</div>
					<ul class="list-disc ml-5 space-y-1 text-sm">
						<li>Patch cord Cat6 x2</li>
						<li>Bridas plásticas</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
	{/if}

	<!-- Evidencias -->
	{#if tab === 'evidence'}
	<div class="card bg-base-100 border mt-4">
		<div class="card-body">
			<h2 class="card-title">Evidencia</h2>
			<p class="opacity-70 text-sm mb-3">Galería de archivos adjuntos.</p>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
				{#each evidences as e}
					<button
						type="button"
						class="card bg-base-200 image-full aspect-square overflow-hidden group focus:outline-offset-2"
						onclick={() => openPreview(e)}
						aria-label={`Ampliar ${e.name ?? 'evidencia'}`}
					>
						<figure class="w-full h-full">
							<img
								src={e.url}
								alt={e.name ?? 'Evidencia'}
								loading="lazy"
								class="w-full h-full object-cover transition group-hover:scale-105"
							/>
						</figure>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Modal de vista previa -->
	<dialog class="modal" bind:this={modalEl}>
		<div class="modal-box max-w-5xl">
			<h3 class="font-bold text-lg mb-2">{preview?.name ?? 'Vista previa'}</h3>
			<div class="w-full">
				<img
					src={preview?.url}
					alt={preview?.name ?? 'Evidencia'}
					class="w-full h-auto object-contain rounded"
				/>
			</div>
			<div class="modal-action">
				<form method="dialog">
					<button class="btn">Cerrar</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button aria-label="Cerrar">close</button>
		</form>
	</dialog>
	{/if}

	<!-- Firmas -->
	{#if tab === 'signatures'}
	<div class="card bg-base-100 border mt-4">
		<div class="card-body">
			<h2 class="card-title">Firmas</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="space-y-2">
					<div class="opacity-60 text-sm">Técnico</div>
					<div class="p-3 border rounded bg-base-200 h-32 flex items-center justify-center">
						<span class="opacity-60">Imagen/Vector de la firma</span>
					</div>
					<div class="text-xs opacity-70">
						<strong>Firmado por:</strong> Juan Pérez<br/>
						<strong>Timestamp:</strong> 2025-10-25 18:10<br/>
						<strong>Hash:</strong> abcdef123… (para verificación)
					</div>
				</div>
			</div>
		</div>
	</div>
	{/if}

	<!-- Rectificaciones -->
	{#if tab === 'rectifications'}
	<div class="card bg-base-100 border mt-4">
		<div class="card-body space-y-4">
			<h2 class="card-title">Rectificaciones</h2>

			<div class="space-y-3">
				{#if rectifications.length === 0}
				<div class="text-sm opacity-60">Sin rectificaciones aún.</div>
				{:else}
				{#each rectifications as r (r.id)}
					<div class="p-3 rounded border">
					<div class="text-sm opacity-60 mb-1">
						{fmt(r.createdAt)} — por {ROLE_LABEL[r.authorRole]} - {r.authorName}
					</div>
					<p class="text-sm">{r.note}</p>
					</div>
				{/each}
				{/if}
			</div>

			<form method="POST" class="mt-2">
				<input type="hidden" name="intent" value="add_rectification" />
				<div class="form-control">
					<h3 class="text-sm font-semibold mb-2">Nueva rectificación</h3>
					<textarea id="rectification" class="textarea textarea-bordered w-full h-32" placeholder="Describe la rectificación..."></textarea>
				</div>
				<div class="mt-3">
					<button class="btn btn-primary btn-sm" type="submit" disabled>Agregar</button>
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
					<span class={BADGE_CLASS[e.type]}>{EVENT_LABEL[e.type]}</span>
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

	<!-- Metadatos -->
	{#if tab === 'metadata'}
	<div class="card bg-base-100 border mt-4">
		<div class="card-body">
			<h2 class="card-title">Metadatos</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
				<div>
					<div class="opacity-60">Coordenadas</div>
					<div class="font-medium">-36.826, -73.049</div>
				</div>
				<div>
					<div class="opacity-60">ID dispositivo</div>
					<div class="font-medium">device-abc-123</div>
				</div>
				<div>
					<div class="opacity-60">Versión app</div>
					<div class="font-medium">1.0.3 (build 42)</div>
				</div>
				<div>
					<div class="opacity-60">Hash evidencia</div>
					<div class="font-medium">sha256: 89fe…c12</div>
				</div>
				<div>
					<div class="opacity-60">IP cierre</div>
					<div class="font-medium">10.0.0.5</div>
				</div>
				<div>
					<div class="opacity-60">User-Agent</div>
					<div class="font-medium">Android 14; Expo 6.x</div>
				</div>
			</div>
		</div>
	</div>
	{/if}
</div>
