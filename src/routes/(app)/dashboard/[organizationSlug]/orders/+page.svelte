<script lang="ts">
	import { page } from '$app/state';
	import type { Report as PrismaReport } from '@prisma/client';
	import { onDestroy } from 'svelte';

	let search = $state('');
	let committedSearch = $state('');
	let pageIndex = $state(0);
	let pageSize = $state(10);

	let reports = $state<PrismaReport[]>([]);
	let total = $state(0);
	let loading = $state(false);
	let errorMsg = $state<string | null>(null);

	const org = page.params.organizationSlug;

	let controller: AbortController | null = null;

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	const DEBOUNCE_MS = 800;

	function onSearchInput(val: string) {
		search = val;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			committedSearch = search;
			pageIndex = 0;
		}, DEBOUNCE_MS);
	}

	function applySearch() {
		if (debounceTimer) clearTimeout(debounceTimer);
		committedSearch = search;
		pageIndex = 0;
	}

	function clearSearch() {
		if (debounceTimer) clearTimeout(debounceTimer);
		search = '';
		committedSearch = '';
		pageIndex = 0;
	}

	$effect(() => {
		loadReports({ q: committedSearch, index: pageIndex, size: pageSize });
	});

	$effect(() => {
		pageSize;
		pageIndex = 0;
	});

	$effect(() => {
		total;
		pageSize;
		const tp = Math.max(1, Math.ceil(total / pageSize));
		if (pageIndex >= tp) pageIndex = tp - 1;
	});

	type LoadParams = { q: string; index: number; size: number };

	async function loadReports(params: LoadParams) {
		if (controller) controller.abort();
		controller = new AbortController();

		loading = true;
		errorMsg = null;

		const usp = new URLSearchParams();
		usp.set('paginated', 'true');
		usp.set('limit', String(params.size));
		usp.set('offset', String(params.index * params.size));
		if (params.q.trim()) usp.set('q', params.q.trim());

		try {
			const res = await fetch(`/api/v1/${org}/orders?${usp.toString()}`, {
				signal: controller.signal
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			reports = json.reports ?? [];
			total = Number(json.total ?? 0);
		} catch (err: any) {
			if (err?.name === 'AbortError') return;
			errorMsg = 'No se pudieron cargar las órdenes.';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function fmtDate(d?: Date | string) {
		if (!d) return '—';
		const dd = typeof d === 'string' ? new Date(d) : d;
		return dd.toLocaleString();
	}

	const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const hasPrev = $derived(pageIndex > 0);
	const hasNext = $derived(pageIndex + 1 < totalPages);

	function gotoPrev() {
		if (hasPrev) pageIndex -= 1;
	}
	function gotoNext() {
		if (hasNext) pageIndex += 1;
	}
	function gotoPage(i: number) {
		if (i >= 0 && i < totalPages) pageIndex = i;
	}

	onDestroy(() => {
		if (debounceTimer) clearTimeout(debounceTimer);
		if (controller) controller.abort();
	});
</script>

<!-- Controles -->
<div class="mb-4 grid gap-3 md:grid-cols-4">
	<div class="form-control md:col-span-2">
		<label class="label" for="q"><span class="label-text">Buscar</span></label>
		<input
			id="q"
			type="text"
			class="input-bordered input"
			value={search}
			oninput={(e) => onSearchInput((e.target as HTMLInputElement).value)}
		/>
		<div class="mt-2 flex gap-2">
			<button class="btn btn-sm btn-primary" onclick={applySearch}>Buscar</button>
			<button class="btn btn-ghost btn-sm" onclick={clearSearch}>Limpiar</button>
			<span class="label-text-alt ml-auto">
				{#if search !== committedSearch}Esperando {DEBOUNCE_MS} ms…{/if}
			</span>
		</div>
	</div>

	<div class="form-control">
		<label class="label" for="size"><span class="label-text">Tamaño</span></label>
		<select id="size" class="select-bordered select" bind:value={pageSize}>
			<option value={5}>5</option>
			<option value={10}>10</option>
			<option value={20}>20</option>
			<option value={50}>50</option>
		</select>
	</div>

	<div class="flex items-end justify-end md:col-span-1">
		<a class="btn btn-primary" href={`/dashboard/${org}/orders/create`}> Crear orden </a>
	</div>
</div>

<!-- Tabla -->
<div class="overflow-x-auto rounded-box border border-base-300">
	<table class="table">
		<thead>
			<tr>
				<th class="w-24">ID</th>
				<th>Título</th>
				<th class="w-40">Estado</th>
				<th class="w-48">Creado</th>
				<th class="w-28 text-right">Acciones</th>
			</tr>
		</thead>

		{#if loading}
			<tbody>
				{#each Array.from({ length: Math.min(pageSize, 5) }) as _}
					<tr>
						<td><div class="h-4 w-16 skeleton"></div></td>
						<td><div class="h-4 w-64 skeleton"></div></td>
						<td><div class="h-4 w-24 skeleton"></div></td>
						<td><div class="h-4 w-32 skeleton"></div></td>
						<td class="text-right"><div class="ml-auto h-8 w-16 skeleton"></div></td>
					</tr>
				{/each}
			</tbody>
		{:else if errorMsg}
			<tbody>
				<tr>
					<td colspan="5"><div class="alert alert-error">{errorMsg}</div></td>
				</tr>
			</tbody>
		{:else if reports.length === 0}
			<tbody>
				<tr>
					<td colspan="5"
						><div class="p-6 text-center opacity-70">Sin resultados.</div></td
					>
				</tr>
			</tbody>
		{:else}
			<tbody>
				{#each reports as r}
					<tr>
						<td class="font-mono">{String(r.id)}</td>
						<td>{r.title ?? '—'}</td>
						<td><div class="badge badge-outline">{r.status}</div></td>
						<td>{fmtDate(r.createdAt)}</td>
						<td class="text-right">
							<a
								class="btn btn-ghost btn-sm"
								href={`/dashboard/${page.params.organizationSlug}/orders/${r.id}`}
								>Ver</a
							>
						</td>
					</tr>
				{/each}
			</tbody>
		{/if}
	</table>
</div>

<!-- Paginación -->
<div class="mt-4 flex items-center justify-between">
	<div class="text-sm opacity-70">
		Página {pageIndex + 1} de {totalPages} · {total} resultados
		{#if committedSearch}<span class="ml-2">· Búsqueda: “{committedSearch}”</span>{/if}
	</div>

	<div class="join">
		<button class="btn join-item" disabled={!hasPrev} onclick={gotoPrev}>«</button>

		{#each Array.from({ length: Math.min(totalPages, 7) }) as _, idx (idx)}
			{#key pageIndex}
				<button
					class="btn join-item {idx === pageIndex % 7 ? 'btn-active' : ''}"
					onclick={() => gotoPage(Math.floor(pageIndex / 7) * 7 + idx)}
					disabled={Math.floor(pageIndex / 7) * 7 + idx >= totalPages}
				>
					{Math.floor(pageIndex / 7) * 7 + idx + 1}
				</button>
			{/key}
		{/each}

		<button class="btn join-item" disabled={!hasNext} onclick={gotoNext}>»</button>
	</div>
</div>
