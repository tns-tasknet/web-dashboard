<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { Report as PrismaReport } from '@prisma/client';
	import { onDestroy } from 'svelte';

	type ReportRow = PrismaReport & {
		assignee?: {
			user?: { id?: string; name?: string | null; email?: string | null } | null;
		} | null;
	};
	type SortKey = 'id' | 'title' | 'memberName' | 'closedAt' | 'createdAt';
	type LoadParams = {
		q: string;
		index: number;
		size: number;
		sort: SortKey;
		dir: 'asc' | 'desc';
	};

	const org = page.params.organizationSlug;
	const DEBOUNCE_MS = 200;

	let search = $state('');
	let committedSearch = $state('');
	let pageIndex = $state(0);
	let pageSize = $state(10);
	let sortKey = $state<SortKey>('closedAt');
	let sortDir = $state<'asc' | 'desc'>('desc');

	let reports = $state<ReportRow[]>([]);
	let total = $state(0);
	let loading = $state(false);
	let errorMsg = $state<string | null>(null);

	let qInput: HTMLInputElement | null = null;
	let controller: AbortController | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const hasPrev = $derived(pageIndex > 0);
	const hasNext = $derived(pageIndex + 1 < totalPages);

	$effect(() => {
		loadReports({
			q: committedSearch,
			index: pageIndex,
			size: pageSize,
			sort: sortKey,
			dir: sortDir
		});
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

	function onSearchInput(val: string) {
		search = val;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			committedSearch = search;
			pageIndex = 0;
		}, DEBOUNCE_MS);
	}
	function onSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !(e as any).isComposing) {
			e.preventDefault();
			applySearch();
		}
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
	function clearAndFocus() {
		clearSearch();
		queueMicrotask(() => qInput?.focus());
	}

	function toggleSort(k: SortKey) {
		if (sortKey === k) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortKey = k;
			sortDir = 'asc';
		}
		pageIndex = 0;
	}
	function sortIcon(k: SortKey) {
		return sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : '';
	}

	async function loadReports(params: LoadParams) {
		if (controller) controller.abort();
		controller = new AbortController();

		loading = true;
		errorMsg = null;

		const usp = new URLSearchParams();
		usp.set('paginated', 'true');
		usp.set('limit', String(params.size));
		usp.set('offset', String(params.index * params.size));
		usp.set('sort', params.sort);
		usp.set('dir', params.dir);
		if (params.q.trim()) usp.set('q', params.q.trim());

		try {
			const res = await fetch(`/api/v1/${org}/reports?${usp.toString()}`, {
				signal: controller.signal
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			reports = (json.reports ?? []) as ReportRow[];
			total = Number(json.total ?? 0);
		} catch (err: any) {
			if (err?.name === 'AbortError') return;
			errorMsg = 'No se pudieron cargar los reportes.';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function gotoPrev() {
		if (hasPrev) pageIndex -= 1;
	}
	function gotoNext() {
		if (hasNext) pageIndex += 1;
	}
	function gotoPage(i: number) {
		if (i >= 0 && i < totalPages) pageIndex = i;
	}

	function fmtDate(d?: Date | string | null) {
		if (!d) return '—';
		const dd = typeof d === 'string' ? new Date(d) : d;
		return isNaN(dd?.getTime() ?? NaN) ? '—' : dd.toLocaleString();
	}

	onDestroy(() => {
		if (debounceTimer) clearTimeout(debounceTimer);
		if (controller) controller.abort();
	});
</script>

<!-- Controles -->
<div class="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
	<div class="w-full md:max-w-2xl">
		<label class="label" for="q"><span class="label-text">Buscar</span></label>
		<label class="input-bordered input flex items-center gap-2">
			<span class="opacity-60">🔎</span>
			<input
				id="q"
				bind:this={qInput}
				type="text"
				class="grow"
				placeholder="Buscar por título o contenido"
				value={search}
				oninput={(e) => onSearchInput((e.target as HTMLInputElement).value)}
				onkeydown={onSearchKeydown}
				aria-label="Buscar reportes"
			/>
			{#if search}
				<button
					type="button"
					class="btn btn-ghost btn-xs"
					title="Limpiar búsqueda"
					onclick={clearAndFocus}
					aria-label="Limpiar búsqueda">✕</button
				>
			{/if}
		</label>
	</div>

	<div class="flex w-full items-end justify-between gap-3 md:w-auto">
		<div class="form-control">
			<label class="label" for="size"><span class="label-text">Tamaño</span></label>
			<select id="size" class="select-bordered select min-w-28" bind:value={pageSize}>
				<option value={5}>5</option>
				<option value={10}>10</option>
				<option value={20}>20</option>
				<option value={50}>50</option>
			</select>
		</div>
	</div>
</div>

<!-- Tabla -->
<div class="overflow-x-auto rounded-box border border-base-300">
	<table class="table w-full border-separate border-spacing-y-1 table-zebra">
		<thead class="bg-base-200/70">
			<tr class="border-b">
				{#key `${sortKey}-${sortDir}`}
					<th
						class="w-24 select-none"
						aria-sort={sortKey === 'id'
							? sortDir === 'asc'
								? 'ascending'
								: 'descending'
							: 'none'}
					>
						<button
							class="flex w-full cursor-pointer items-center justify-between px-2 py-1 focus:outline-none focus-visible:ring"
							onclick={() => toggleSort('id')}
						>
							<span>ID</span><span class="opacity-70">{sortIcon('id')}</span>
						</button>
					</th>

					<th
						class="select-none"
						aria-sort={sortKey === 'title'
							? sortDir === 'asc'
								? 'ascending'
								: 'descending'
							: 'none'}
					>
						<button
							class="flex w-full cursor-pointer items-center justify-between px-2 py-1 focus:outline-none focus-visible:ring"
							onclick={() => toggleSort('title')}
						>
							<span>Título</span><span class="opacity-70">{sortIcon('title')}</span>
						</button>
					</th>

					<th
						class="w-56 select-none"
						aria-sort={sortKey === 'memberName'
							? sortDir === 'asc'
								? 'ascending'
								: 'descending'
							: 'none'}
					>
						<button
							class="flex w-full cursor-pointer items-center justify-between px-2 py-1 focus:outline-none focus-visible:ring"
							onclick={() => toggleSort('memberName')}
						>
							<span>Técnico asignado</span><span class="opacity-70"
								>{sortIcon('memberName')}</span
							>
						</button>
					</th>

					<th
						class="w-44 select-none"
						aria-sort={sortKey === 'createdAt'
							? sortDir === 'asc'
								? 'ascending'
								: 'descending'
							: 'none'}
					>
						<button
							class="flex w-full cursor-pointer items-center justify-between px-2 py-1 focus:outline-none focus-visible:ring"
							onclick={() => toggleSort('createdAt')}
						>
							<span>Fecha de creación</span><span class="opacity-70"
								>{sortIcon('createdAt')}</span
							>
						</button>
					</th>

					<th
						class="w-44 select-none"
						aria-sort={sortKey === 'closedAt'
							? sortDir === 'asc'
								? 'ascending'
								: 'descending'
							: 'none'}
					>
						<button
							class="flex w-full cursor-pointer items-center justify-between px-2 py-1 focus:outline-none focus-visible:ring"
							onclick={() => toggleSort('closedAt')}
						>
							<span>Fecha de cierre</span><span class="opacity-70"
								>{sortIcon('closedAt')}</span
							>
						</button>
					</th>
				{/key}
			</tr>
		</thead>

		{#if loading}
			<tbody>
				{#each Array.from({ length: Math.min(pageSize, 5) }) as _}
					<tr class="bg-base-100">
						<td><div class="h-4 w-16 skeleton"></div></td>
						<td><div class="h-4 w-64 skeleton"></div></td>
						<td><div class="h-4 w-40 skeleton"></div></td>
						<td><div class="h-4 w-24 skeleton"></div></td>
						<td><div class="h-4 w-24 skeleton"></div></td>
					</tr>
				{/each}
			</tbody>
		{:else if errorMsg}
			<tbody
				><tr><td colspan="5"><div class="alert alert-error">{errorMsg}</div></td></tr
				></tbody
			>
		{:else if reports.length === 0}
			<tbody
				><tr
					><td colspan="5"
						><div class="p-6 text-center opacity-70">Sin resultados.</div></td
					></tr
				></tbody
			>
		{:else}
			<tbody>
				{#each reports as r}
					<tr
						class="bg-base-100 transition-colors hover:bg-base-100/70"
						ondblclick={() =>
							goto(`/dashboard/${page.params.organizationSlug}/reports/${r.id}`)}
						title="Doble click para abrir"
					>
						<td class="py-3 align-middle font-mono">{String(r.id)}</td>
						<td class="py-3">{r.title ?? '—'}</td>
						<td class="py-3">{r.assignee?.user?.name ?? '—'}</td>
						<td class="py-3">{fmtDate(r.createdAt)}</td>
						<td class="py-3">{fmtDate((r as any).updatedAt)}</td>
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
		<button class="btn join-item btn-sm" disabled={!hasPrev} onclick={gotoPrev}>«</button>

		{#each Array.from({ length: Math.min(totalPages, 7) }) as _, idx (idx)}
			{#key pageIndex}
				<button
					class="btn join-item btn-sm {idx === pageIndex % 7 ? 'btn-active' : ''}"
					onclick={() => gotoPage(Math.floor(pageIndex / 7) * 7 + idx)}
					disabled={Math.floor(pageIndex / 7) * 7 + idx >= totalPages}
				>
					{Math.floor(pageIndex / 7) * 7 + idx + 1}
				</button>
			{/key}
		{/each}

		<button class="btn join-item btn-sm" disabled={!hasNext} onclick={gotoNext}>»</button>
	</div>
</div>
