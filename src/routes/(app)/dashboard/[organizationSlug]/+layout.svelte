<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

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
				<div class="items-center text-xl font-semibold">
					Dashboard - Need to change the name of this somehow i will figure it out later
				</div>

				<div class="flex flex-1 justify-end gap-x-4 rounded-3xl p-2">
					<div class="h-10 w-10">
						<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
							><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
								id="SVGRepo_tracerCarrier"
								stroke-linecap="round"
								stroke-linejoin="round"
							></g><g id="SVGRepo_iconCarrier">
								<g clip-path="url(#clip0_15_159)">
									<rect width="24" height="24" fill="white"></rect>
									<path
										d="M9.5 19C8.89555 19 7.01237 19 5.61714 19C4.87375 19 4.39116 18.2177 4.72361 17.5528L5.57771 15.8446C5.85542 15.2892 6 14.6774 6 14.0564C6 13.2867 6 12.1434 6 11C6 9 7 5 12 5C17 5 18 9 18 11C18 12.1434 18 13.2867 18 14.0564C18 14.6774 18.1446 15.2892 18.4223 15.8446L19.2764 17.5528C19.6088 18.2177 19.1253 19 18.382 19H14.5M9.5 19C9.5 21 10.5 22 12 22C13.5 22 14.5 21 14.5 19M9.5 19C11.0621 19 14.5 19 14.5 19"
										stroke="#000000"
										stroke-linejoin="round"
									></path>
									<path
										d="M12 5V3"
										stroke="#000000"
										stroke-linecap="round"
										stroke-linejoin="round"
									></path>
								</g>
								<defs>
									<clipPath id="clip0_15_159">
										<rect width="24" height="24" fill="white"></rect>
									</clipPath>
								</defs>
							</g></svg
						>
					</div>

					<div class="avatar">
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
