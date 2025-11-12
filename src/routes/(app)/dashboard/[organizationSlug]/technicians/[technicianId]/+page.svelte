<!-- +page.svelte -->
<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();

	const slug = $derived(page.params.organizationSlug);
	const technician = $derived(data.technician);
	const openHistory = $derived(data.openHistory ?? []);
	const closedHistory = $derived(data.closedHistory ?? []);

	// Tabs: Detalles (incluye activas) | Historial (cerradas)
	type TabKey = 'details' | 'history';
	let tab = $state<TabKey>('details');

	// Formato de fecha
	function fmt(ts: string | Date | null | undefined) {
		if (!ts) return '—';
		const d = new Date(ts);
		if (isNaN(d.getTime())) return '—';
		return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
	}

	// Estados
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
		COMPLETED: 'badge-success'
	};

	// Roles para badge
	const ROLE_LABEL: Record<string, string> = {
		owner: 'Propietario',
		admin: 'Administrador',
		member: 'Técnico'
	};
	const ROLE_BADGE: Record<string, string> = {
		owner: 'badge-primary',
		admin: 'badge-info',
		member: 'badge-outline'
	};

	const totalOrders = $derived((openHistory?.length ?? 0) + (closedHistory?.length ?? 0));

	const techName = $derived(technician.user?.name ?? 'Sin nombre');
	const techEmail = $derived(technician.user?.email ?? '—');
	const techImage = $derived(
		technician.user?.image ?? 'https://img.daisyui.com/images/profile/demo/yellingcat@192.webp'
	);
	const techRoleKey = $derived(
		(technician.user?.role ?? technician.role ?? 'member').toLowerCase()
	);
	const techRoleLabel = $derived(
		ROLE_LABEL[techRoleKey] ?? technician.user?.role ?? technician.role ?? '—'
	);
	const techRoleBadge = $derived(ROLE_BADGE[techRoleKey] ?? 'badge-outline');

	// Navegación a orden/reporte
	function goToOrder(r: { id: number; status: string }) {
		const base = r.status === 'COMPLETED' ? 'reports' : 'orders';
		goto(`/dashboard/${slug}/${base}/${r.id}`);
	}
</script>

<div class="mx-auto max-w-5xl space-y-6 py-6">
	<!-- Encabezado con foto -->
	<div class="card border bg-base-100">
		<div class="card-body gap-4">
			<div class="flex items-start justify-between gap-4">
				<div class="flex items-start gap-4">
					<div class="avatar">
						<div
							class="w-16 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:w-20"
						>
							<img src={techImage} alt="Foto del técnico" />
						</div>
					</div>
					<div class="space-y-1">
						<h1 class="text-2xl font-bold">{techName}</h1>
						<p class="max-w-prose opacity-70">{techEmail}</p>
					</div>
				</div>
				<div class="space-y-2 text-right">
					<div class="badge {techRoleBadge}">{techRoleLabel}</div>
					<div class="text-xs opacity-60">ID: {technician.id}</div>
				</div>
			</div>

			<div class="divider my-2"></div>

			<!-- Solo conteos de órdenes -->
			<div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
				<div>
					<div class="opacity-60">Órdenes asignadas</div>
					<div class="font-medium">{totalOrders}</div>
				</div>
				<div>
					<div class="opacity-60">Órdenes activas</div>
					<div class="font-medium">{openHistory.length}</div>
				</div>
				<div>
					<div class="opacity-60">Órdenes cerradas</div>
					<div class="font-medium">{closedHistory.length}</div>
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
	</div>

	<!-- Detalles (incluye órdenes activas) -->
	{#if tab === 'details'}
		<div class="card border bg-base-100">
			<div class="card-body gap-4">
				<h2 class="card-title">Detalles del técnico</h2>

				<div class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
					<div>
						<div class="opacity-60">ID</div>
						<div class="font-medium break-all">{technician.id}</div>
					</div>

					<div>
						<div class="opacity-60">Nombre</div>
						<div class="font-medium">{techName}</div>
					</div>

					<div>
						<div class="opacity-60">Correo</div>
						<div class="font-medium">{techEmail}</div>
					</div>

					<div>
						<div class="opacity-60">Rol</div>
						<div class="font-medium">
							<span class="badge {techRoleBadge}">{techRoleLabel}</span>
						</div>
					</div>

					<div>
						<div class="opacity-60">Fecha de ingreso</div>
						<div class="font-medium">{fmt(technician.createdAt)}</div>
					</div>
				</div>

				<div class="divider my-2"></div>

				<h3 class="font-semibold">Órdenes activas</h3>
				<p class="-mt-2 text-sm opacity-70">
					Asignadas y aún abiertas (pendientes, agendadas o en progreso).
				</p>

				{#if openHistory.length === 0}
					<div class="text-sm opacity-60">Sin órdenes activas.</div>
				{:else}
					<div class="overflow-x-auto rounded-box border border-base-300">
						<table
							class="table w-full table-fixed border-separate border-spacing-y-1 text-sm"
						>
							<thead class="bg-base-200/70">
								<tr class="border-b">
									<th class="w-16">ID</th>
									<th>Título</th>
									<th>Estado</th>
									<th>Creada</th>
									<th>Últ. actualización</th>
								</tr>
							</thead>
							<tbody>
								{#each openHistory as r (r.id)}
									<tr
										class="bg-base-100 transition-colors hover:bg-base-300/70"
										ondblclick={() => goToOrder(r)}
										title="Doble clic para abrir"
									>
										<td class="py-3">{r.id}</td>
										<td class="truncate py-3 font-medium">{r.title}</td>
										<td class="py-3">
											<div class="badge {STATUS_BADGE[r.status]}">
												{STATUS_LABEL[r.status]}
											</div>
										</td>
										<td class="py-3">{fmt(r.createdAt)}</td>
										<td class="py-3">{fmt(r.updatedAt)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Historial -->
	{#if tab === 'history'}
		<div class="card mt-4 border bg-base-100">
			<div class="card-body">
				<h2 class="card-title">Historial</h2>
				<p class="mb-3 text-sm opacity-70">
					Órdenes completadas por este técnico desde su incorporación.
				</p>

				{#if closedHistory.length === 0}
					<div class="text-sm opacity-60">Sin órdenes cerradas.</div>
				{:else}
					<div class="overflow-x-auto rounded-box border border-base-300">
						<table
							class="table w-full table-fixed border-separate border-spacing-y-1 text-sm"
						>
							<thead class="bg-base-200/70">
								<tr class="border-b">
									<th class="w-16">ID</th>
									<th>Título</th>
									<th>Estado</th>
									<th>Creada</th>
									<th>Cerrada</th>
								</tr>
							</thead>
							<tbody>
								{#each closedHistory as r (r.id)}
									<tr
										class="bg-base-100 transition-colors hover:bg-base-300/70"
										ondblclick={() => goToOrder(r)}
										title="Doble clic para abrir"
									>
										<td class="py-3">{r.id}</td>
										<td class="truncate py-3 font-medium">{r.title}</td>
										<td class="py-3">
											<div class="badge {STATUS_BADGE[r.status]}">
												{STATUS_LABEL[r.status]}
											</div>
										</td>
										<td class="py-3">{fmt(r.createdAt)}</td>
										<td class="py-3">{fmt(r.closedAt)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
