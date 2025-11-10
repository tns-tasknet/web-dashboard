<script lang="ts">
	import type { PageProps } from './$types';
	import { authClient } from '$lib/client';

	let { data }: PageProps = $props();
	const organizations = authClient.useListOrganizations();
</script>

<h1>Your Organizations</h1>

{#if $organizations.isPending}
	<p>Loading...</p>
{:else if !$organizations.data?.length}
	<p>No organizations found.</p>
{:else}
	<ul class="list rounded-box bg-base-100 shadow-md">
		{#each $organizations.data as organization}
			<li class="list-row">
				<div>
					<div
						class="flex size-10 items-center justify-center rounded-box text-lg font-bold capitalize"
					>
						ORG
					</div>
				</div>
				<div>
					<div>{organization.name}</div>
					<div class="text-xs font-semibold opacity-60">{organization.slug}</div>
				</div>
				<!-- svelte-ignore a11y_consider_explicit_label -->
				<a href="/dashboard/{organization.slug}" class="btn btn-square btn-ghost">
					<svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
						><g
							stroke-linejoin="round"
							stroke-linecap="round"
							stroke-width="2"
							fill="none"
							stroke="currentColor"><path d="M6 3L20 12 6 21 6 3z"></path></g
						></svg
					>
				</a>
				<!-- svelte-ignore a11y_consider_explicit_label -->
				<button class="btn btn-square btn-ghost">
					<svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
						><g
							stroke-linejoin="round"
							stroke-linecap="round"
							stroke-width="2"
							fill="none"
							stroke="currentColor"
							><path
								d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
							></path></g
						></svg
					>
				</button>
			</li>
		{/each}
	</ul>
{/if}
