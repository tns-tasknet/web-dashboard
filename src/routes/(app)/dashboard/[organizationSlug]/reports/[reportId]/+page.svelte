<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	type Correction = {
		id: string;
		content: string;
		reportId: number;
		memberId: string;
		createdAt: string | Date;
		author: { name: string; role: string };
	};

	let { data }: PageProps = $props();

	let preview: Evidence | null = $state(null);
	let modalEl: HTMLDialogElement | null = $state(null);

	function openPreview(item: Evidence) {
		preview = item;
		modalEl?.showModal();
	}

	type TabKey = 'details' | 'evidence' | 'signatures' | 'rectifications' | 'history';
	type Evidence = { id: string | number; url: string; name?: string };

	type EventType = 'CREATED' | 'ASSIGNED' | 'REASSIGNED' | 'STATE_CHANGED' | 'NOTE' | 'CLOSED';
	type HistoryEvent = {
		id: string | number;
		timestamp: string | Date;
		type: EventType;
		payload?: Record<string, unknown>;
		description?: string;
	};

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

	function displayStatus(code?: string | null) {
		return code ? (STATUS_LABEL[code as keyof typeof STATUS_LABEL] ?? code) : '—';
	}

	function describe(e: HistoryEvent) {
		if (e.description) return e.description;
		switch (e.type) {
			case 'STATE_CHANGED':
				return `Estado: ${e.payload?.from ?? '—'} → ${e.payload?.to ?? '—'}.`;
			default:
				return '';
		}
	}

	// Datos base
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

	// ===== Helpers: binarios/base64 -> data URL (solo imágenes) =====
	function toUint8(x: unknown): Uint8Array | null {
		if (x instanceof Uint8Array) return x;
		if (x instanceof ArrayBuffer) return new Uint8Array(x);
		if (Array.isArray(x)) return new Uint8Array(x as number[]);
		// { type:'Buffer', data:number[] }
		if (
			x &&
			typeof x === 'object' &&
			(x as any).type === 'Buffer' &&
			Array.isArray((x as any).data)
		) {
			return new Uint8Array((x as any).data);
		}
		return null;
	}

	function u8ToBase64(u8: Uint8Array): string {
		let bin = '';
		for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
		return btoa(bin);
	}

	// Detecta MIME por magic numbers (PNG/JPEG/WEBP). Sin PDF.
	function guessImageMimeFromBase64(b64: string): string {
		if (!b64) return 'image/png';
		let head = '';
		try {
			head = atob(b64.slice(0, 128));
		} catch {
			return 'image/png';
		}
		if (head.startsWith('\x89PNG\r\n\x1a\n')) return 'image/png';
		if (head.startsWith('\xFF\xD8\xFF')) return 'image/jpeg';
		if (head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP') return 'image/webp';
		return 'image/png';
	}

	// Acepta: base64 | data URL | http(s) | Uint8Array | ArrayBuffer | number[] | Buffer-like
	function toDataUrl(b: unknown): string {
		if (!b) return '';
		if (typeof b === 'string') {
			if (b.startsWith('data:') || b.startsWith('http')) return b;
			const mime = guessImageMimeFromBase64(b);
			return `data:${mime};base64,${b}`;
		}
		const u8 = toUint8(b);
		if (!u8) return '';
		const b64 = u8ToBase64(u8);
		const mime = guessImageMimeFromBase64(b64);
		return `data:${mime};base64,${b64}`;
	}

	// Construcción de evidencias y firma (el load manda base64/string)
	function buildEvidences(r: any) {
		const arr = (r?.evidence ?? []) as unknown[];
		const out: { id: number; url: string; name: string }[] = [];
		for (let i = 0; i < arr.length; i++) {
			const url = toDataUrl(arr[i]);
			if (url) out.push({ id: i + 1, url, name: `Evidencia ${i + 1}` });
		}
		return out;
	}

	const evidences = $derived(buildEvidences(report));
	const signatureUrl = $derived(report?.signature ? toDataUrl((report as any).signature) : '');

	// Construcción del historial
	function makeHistoryFromReport(r: any): HistoryEvent[] {
		if (!r) return [];
		let id = 1;
		const ev: HistoryEvent[] = [];

		if (r.createdAt) {
			ev.push({
				id: id++,
				timestamp: r.createdAt,
				type: 'CREATED',
				description: 'Orden creada.'
			});
		}

		if (r.scheduledAt) {
			ev.push({
				id: id++,
				timestamp: r.scheduledAt,
				type: 'STATE_CHANGED',
				payload: { from: displayStatus('PENDING'), to: displayStatus('SCHEDULED') }
			});
		}

		if (r.startedAt) {
			const fromLbl = r.scheduledAt ? displayStatus('SCHEDULED') : displayStatus('PENDING');
			ev.push({
				id: id++,
				timestamp: r.startedAt,
				type: 'STATE_CHANGED',
				payload: { from: fromLbl, to: displayStatus('IN_PROGRESS') }
			});
		}

		if (r.completedAt) {
			ev.push({
				id: id++,
				timestamp: r.completedAt,
				type: 'STATE_CHANGED',
				payload: { from: displayStatus('IN_PROGRESS'), to: displayStatus('COMPLETED') }
			});
			ev.push({
				id: id++,
				timestamp: r.completedAt,
				type: 'CLOSED',
				description: 'Orden cerrada.'
			});
		}

		ev.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
		return ev;
	}

	const events: HistoryEvent[] = $derived(makeHistoryFromReport(report));
	const ordered = $derived(events);

	// Rectificaciones
	let rectifications = $state<Correction[]>(data.corrections ?? []);

	let creating = $state(false);
	let errorMsg = $state<string | null>(null);
	let draft = $state('');

	async function submitCorrection() {
		errorMsg = null;
		const content = draft.trim();
		if (!content) {
			errorMsg = 'Escribe el contenido de la rectificación.';
			return;
		}
		if (!report?.id || !slug) {
			errorMsg = 'Contexto de reporte no disponible.';
			return;
		}

		creating = true;
		try {
			const res = await fetch(
				`/api/v1/${encodeURIComponent(slug)}/reports/${report.id}/corrections`,
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ content })
				}
			);
			if (!res.ok) {
				errorMsg = await res.text();
				return;
			}
			const { correction } = (await res.json()) as { correction: Correction };
			rectifications = [...rectifications, correction];
			draft = '';
		} catch (e: any) {
			errorMsg = e?.message ?? 'Error desconocido';
		} finally {
			creating = false;
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
					<div class="opacity-60">Creación</div>
					<div class="font-medium">{createdAtText}</div>
				</div>
				<div>
					<div class="opacity-60">Finalización</div>
					<div class="font-medium">{updatedAtText}</div>
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
			class={'tab ' + (tab === 'details' ? 'tab-active' : '')}
			onclick={() => (tab = 'details')}
		>
			Detalles
		</button>
		<button
			class={'tab ' + (tab === 'evidence' ? 'tab-active' : '')}
			onclick={() => (tab = 'evidence')}
		>
			Evidencia
		</button>
		<button
			class={'tab ' + (tab === 'signatures' ? 'tab-active' : '')}
			onclick={() => (tab = 'signatures')}
		>
			Firmas
		</button>
		<button
			class={'tab ' + (tab === 'rectifications' ? 'tab-active' : '')}
			onclick={() => (tab = 'rectifications')}
		>
			Rectificaciones
		</button>
		<button
			class={'tab ' + (tab === 'history' ? 'tab-active' : '')}
			onclick={() => (tab = 'history')}
		>
			Historial
		</button>
	</div>

	<!-- Detalles -->
	{#if tab === 'details'}
		<div class="card mt-4 border bg-base-100">
			<div class="card-body gap-4">
				<div class="flex items-start justify-between">
					<h2 class="card-title">Detalles del reporte</h2>
					<div class="join">
						<button class="btn join-item btn-ghost btn-sm" disabled>Exportar CSV</button
						>
						<button class="btn join-item btn-ghost btn-sm" disabled>Exportar PDF</button
						>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
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
					<div class="text-sm opacity-60">Descripción final</div>
					<p class="leading-relaxed">{report?.content}</p>
				</div>

				<div class="divider"></div>

				<div class="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<div class="mb-1 text-sm opacity-60">Actividades realizadas</div>
						{#if report?.activities?.length}
							<ul class="ml-5 list-disc space-y-1 text-sm">
								{#each report.activities as activity}
									<li>{activity}</li>
								{/each}
							</ul>
						{:else}
							<div class="text-sm opacity-60">No registradas.</div>
						{/if}
					</div>

					<div>
						<div class="mb-1 text-sm opacity-60">Materiales usados</div>
						{#if report?.materials?.length}
							<ul class="ml-5 list-disc space-y-1 text-sm">
								{#each report.materials as material}
									<li>{material}</li>
								{/each}
							</ul>
						{:else}
							<div class="text-sm opacity-60">No registrados.</div>
						{/if}
					</div>
				</div>

				<div class="divider"></div>

				<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
					<div>
						<div class="opacity-60">Coordenadas</div>
						<div class="font-medium">
							{#if report?.latitude && report?.longitude}
								{report.latitude}, {report.longitude}
							{:else}
								—
							{/if}
						</div>
					</div>
					<div>
						<div class="opacity-60">ID dispositivo</div>
						<div class="font-medium">{report?.deviceId ?? '—'}</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Evidencias -->
	{#if tab === 'evidence'}
		<div class="card mt-4 border bg-base-100">
			<div class="card-body">
				<h2 class="card-title">Evidencia</h2>
				<p class="mb-3 text-sm opacity-70">Galería de archivos adjuntos.</p>

				{#if evidences.length === 0}
					<div class="p-6 text-center opacity-60">Sin evidencias.</div>
				{:else}
					<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
						{#each evidences as e}
							<button
								type="button"
								class="group image-full card aspect-square overflow-hidden bg-base-200 focus:outline-offset-2"
								onclick={() => openPreview(e)}
								aria-label={`Ampliar ${e.name ?? 'evidencia'}`}
							>
								<figure class="h-full w-full">
									<img
										src={e.url}
										alt={e.name ?? 'Evidencia'}
										loading="lazy"
										class="h-full w-full object-cover transition group-hover:scale-105"
									/>
								</figure>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Modal de vista previa -->
		<dialog class="modal" bind:this={modalEl}>
			<div class="modal-box max-w-5xl">
				<h3 class="mb-2 text-lg font-bold">{preview?.name ?? 'Vista previa'}</h3>
				<div class="w-full">
					{#if preview}
						<img
							src={preview.url}
							alt={preview.name ?? 'Evidencia'}
							class="h-auto w-full rounded object-contain"
						/>
					{/if}
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

	<!-- Firma -->
	{#if tab === 'signatures'}
		<div class="card mt-4 border bg-base-100">
			<div class="card-body">
				<h2 class="card-title">Firmas</h2>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<div class="space-y-2">
						<div class="text-sm opacity-60">Técnico</div>

						<div
							class="flex h-32 items-center justify-center rounded border bg-base-200 p-3"
						>
							{#if signatureUrl}
								<div class="relative h-full w-full rounded bg-base-100">
									<img
										src={signatureUrl}
										alt="Firma del técnico"
										class="absolute inset-0 h-full w-full rounded object-contain"
										decoding="async"
									/>
								</div>
							{:else}
								<span class="opacity-60">Sin firma</span>
							{/if}
						</div>

						<div class="text-xs opacity-70">
							<strong>Firmado por:</strong>
							{report?.assignee?.user?.name ?? '—'}<br />
							<strong>Timestamp:</strong>
							{fmt(report?.completedAt ?? report?.updatedAt ?? new Date())}<br />
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Rectificaciones -->
	{#if tab === 'rectifications'}
		<div class="card mt-4 border bg-base-100">
			<div class="card-body space-y-4">
				<h2 class="card-title">Rectificaciones</h2>

				<!-- Lista de rectificaciones -->
				<div class="space-y-3">
					{#if rectifications.length === 0}
						<div class="text-sm opacity-60">Sin rectificaciones aún.</div>
					{:else}
						{#each rectifications as r (r.id)}
							<div class="rounded border p-3">
								<div class="mb-1 text-sm opacity-60">
									{fmt(r.createdAt)} — por {r.author.role} - {r.author.name}
								</div>
								<p class="text-sm whitespace-pre-wrap">{r.content}</p>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Formulario nueva rectificación -->
				<div class="rounded border p-4">
					<div class="form-control">
						<textarea
							id="rectification"
							class="textarea-bordered textarea min-h-[8rem] w-full"
							placeholder="Nueva rectificación"
							bind:value={draft}
						></textarea>
					</div>
					<div class="mt-3 flex items-center gap-2">
						<button
							class="btn btn-sm btn-primary"
							type="button"
							disabled={creating || !draft.trim()}
							onclick={submitCorrection}
						>
							{#if creating}<span class="loading loading-xs loading-spinner"
								></span>{/if}
							<span>Agregar</span>
						</button>
						{#if errorMsg}
							<span class="text-sm text-error">{errorMsg}</span>
						{/if}
					</div>
				</div>
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

				<div class="space-y-2" role="list">
					{#if ordered.length === 0}
						<div class="p-6 text-center opacity-70">Sin eventos aún.</div>
					{:else}
						{#each ordered as e, i (e.id)}
							<div
								class="flex flex-col items-center rounded px-2 py-3 text-center hover:bg-base-200/50"
								role="listitem"
							>
								<div class="text-sm opacity-70">{fmt(e.timestamp)}</div>

								<div class="mt-1">
									<span
										class={BADGE_CLASS[e.type]}
										aria-label={EVENT_LABEL[e.type]}
										title={e.payload?.from && e.payload?.to
											? `${e.payload.from} → ${e.payload.to}`
											: undefined}
									>
										{EVENT_LABEL[e.type]}
									</span>
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

							{#if i < ordered.length - 1}
								<div class="divider my-0"></div>
							{/if}
						{/each}
					{/if}
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
</div>
