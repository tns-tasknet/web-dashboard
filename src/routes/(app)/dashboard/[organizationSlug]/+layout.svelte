<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { Bell } from 'lucide-svelte';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="drawer lg:drawer-open">
	<input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content flex flex-1 flex-col">
		<!-- Page content here -->
		<label for="my-drawer-3" class="drawer-button btn lg:hidden"> Open drawer </label>

		<div class="flex flex-1 flex-col bg-gray-200">
			<div class="flex items-center bg-base-200 p-2 shadow-2xs">
				<div class="items-center text-xl font-semibold">Dashboard</div>

				<div class="flex flex-1 items-center justify-end gap-x-4 rounded-3xl p-2">
					<Bell
						class="h-8 w-8 rounded-full p-1 transition-all hover:cursor-pointer hover:bg-gray-200"
					/>

					<div class="avatar hover:cursor-pointer">
						<div class="h-10 w-10 rounded-full">
							<img
								src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"
								alt="cat"
							/>
						</div>
					</div>
				</div>
			</div>

			<div class="p-4">
				{@render children?.()}
			</div>
		</div>
	</div>
	<div class="drawer-side">
		<label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"></label>
		<ul class="menu min-h-full w-80 bg-base-200 p-4">
			<!-- Sidebar content here -->
			<div>ORG NAME</div>
			<li
				class=" rounded-r-lg {page.route.id === '/(app)/dashboard/[organizationSlug]'
					? 'border-l-2 bg-gray-300'
					: ''}"
			>
				<a href="/dashboard/{page.params.organizationSlug}">Dashboard</a>
			</li>

			<li><a href="/dashboard/{page.params.organizationSlug}/reports">Orders</a></li>

			<li
				class=" rounded-r-lg {page.route.id ===
				'/(app)/dashboard/[organizationSlug]/reports'
					? 'border-l-2 bg-gray-300'
					: ''}"
			>
				<a href="/dashboard/{page.params.organizationSlug}/reports">Reports</a>
			</li>

			<li><a href="/dashboard/{page.params.organizationSlug}/reports">Technicians</a></li>
			{page.route.id}
		</ul>
	</div>
</div>
