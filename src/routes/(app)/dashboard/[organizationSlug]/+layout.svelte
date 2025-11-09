<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { Bell, ClipboardCheck, ClipboardList, LayoutDashboard, UserPen } from 'lucide-svelte';

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
		<ul class="menu min-h-full w-80 gap-y-1 bg-base-200 p-4">
			<!-- Sidebar content here -->

			<div class="mb-4 flex items-center justify-center gap-x-4 p-2 text-4xl font-extrabold">
				TNS TaskNet
			</div>

			<div class="flex items-center gap-x-4 rounded-lg bg-gray-200 p-2">
				<div class="rounded-lg bg-purple-600 p-2 font-extrabold text-white">ON</div>

				<div class="flex flex-col">
					<div class="font-bold">Organization Name</div>
					<div class="font-light">Organization slug</div>
				</div>
			</div>

			<li
				class="mt-4 rounded-l-sm rounded-r-lg {page.route.id ===
				'/(app)/dashboard/[organizationSlug]'
					? 'border-l-4 bg-gray-300 font-bold'
					: ''}"
			>
				<a href="/dashboard/{page.params.organizationSlug}">
					<LayoutDashboard class="h-6 w-6" /> Dashboard
				</a>
			</li>

			<li
				class="rounded-l-sm rounded-r-lg {page.route.id ===
				'/(app)/dashboard/[organizationSlug]/orders'
					? 'border-l-4 bg-gray-300 font-bold'
					: ''}"
			>
				<a href="/dashboard/{page.params.organizationSlug}/orders">
					<ClipboardList class="h-6 w-6" /> Orders
				</a>
			</li>

			<li
				class="rounded-l-sm rounded-r-lg {page.route.id ===
				'/(app)/dashboard/[organizationSlug]/reports'
					? 'border-l-4 bg-gray-300 font-bold'
					: ''}"
			>
				<a href="/dashboard/{page.params.organizationSlug}/reports">
					<ClipboardCheck class="h-6 w-6" /> Reportes
				</a>
			</li>

			<li
				class="rounded-l-sm rounded-r-lg {page.route.id ===
				'/(app)/dashboard/[organizationSlug]/technicians'
					? 'border-l-4 bg-gray-300 font-bold'
					: ''}"
			>
				<a href="/dashboard/{page.params.organizationSlug}/technicians">
					<UserPen class="h-6 w-6" /> Technicians
				</a>
			</li>
		</ul>
	</div>
</div>
