<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex items-center space-x-4 border-b p-4">
	<div class="flex space-x-4 px-4">
		<!-- TODO: MODIFY THESE VALUES & ADD CONDITIONAL FOR ORGANIZATION -->
		<a
			href="/"
			class="font-medium"
			class:text-muted-foreground={page.route.id != '/' && page.route.id != '/(app)'}
			>Resumen</a
		>
		<a
			href="/reports"
			class="font-medium"
			class:text-muted-foreground={!page.route.id?.includes('reports')}>Reportes</a
		>
		<a
			href="/"
			class="font-medium"
			class:text-muted-foreground={!page.route.id?.includes('trabajadores')}>Trabajadores</a
		>
	</div>

	<div class="flex flex-1 justify-end space-x-5 px-4">
		{#if data.session.user}
			<p>{data.session.user.name}</p>
			<!-- TODO: DROPDOWN HERE -->
		{:else}
			<p>Sign In</p>
			<!-- TODO: SIGN IN BUTTON HERE -->
		{/if}
	</div>
</div>

{@render children?.()}
