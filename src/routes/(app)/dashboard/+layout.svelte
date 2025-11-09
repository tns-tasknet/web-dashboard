<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { data, children } = $props();

	const slug = $derived(page.params.organizationSlug);
	const base = $derived(`/dashboard/${slug}`);

	function isActive(path: string) {
		const p = page.url.pathname;
		return p === path || p.startsWith(path + '/');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Barra superior -->
<div class="navbar bg-base-100 border-b">
	<div class="navbar-start">
		<a class="btn btn-ghost text-xl" href={base}>TaskNet</a>
	</div>

	<div class="navbar-center">
		<div class="tabs tabs-boxed">
			<a href={base} class={"tab " + (isActive(base) ? "tab-active" : "")}>Resumen</a>
			<a href={`${base}/orders`} class={"tab " + (isActive(`${base}/orders`) ? "tab-active" : "")}>Órdenes</a>
			<a href={`${base}/technicians`} class={"tab " + (isActive(`${base}/technicians`) ? "tab-active" : "")}>Técnicos</a>
			<a href={`${base}/reports`} class={"tab " + (isActive(`${base}/reports`) ? "tab-active" : "")}>Reportes</a>
		</div>
	</div>

	<div class="navbar-end pr-4">
		{#if data?.session?.user}
			<div class="flex items-center gap-3">
				<span class="text-sm opacity-80">{data.session.user.name}</span>
				<!-- TODO: dropdown de cuenta -->
			</div>
		{:else}
			<a class="btn btn-sm btn-primary" href="/login">Iniciar sesión</a>
		{/if}
	</div>
</div>

<!-- Contenido -->
<div class="p-4">
	{@render children?.()}
</div>

