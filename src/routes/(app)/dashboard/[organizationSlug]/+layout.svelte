<script lang="ts">
	import icon from '$lib/assets/icon-tasknet.jpg';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Bell, ClipboardCheck, ClipboardList, LayoutDashboard, UserPen } from 'lucide-svelte';
	import { authClient } from '$lib/client';

	let { data, children } = $props();

	const session = authClient.useSession();
	const fallbackAvatar = 'https://img.daisyui.com/images/profile/demo/yellingcat@192.webp';
	const fallbackLogo = 'https://img.daisyui.com/images/profile/demo/yellingcat@192.webp';

	const org = $derived(data.organization);
	const orgSlug = $derived(page.params.organizationSlug);
	const orgName = $derived(org?.name ?? '—');
	const orgLogo = $derived(
		org?.logo && typeof org.logo === 'string' && org.logo.trim() !== ''
			? org.logo
			: fallbackLogo
	);

	async function handleSignOut() {
		await authClient.signOut();
		goto('/login');
	}
</script>

<svelte:head>
	<link rel="icon" href={icon} />
</svelte:head>

<div class="drawer lg:drawer-open">
	<input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content flex flex-1 flex-col">
		<label for="my-drawer-3" class="drawer-button btn lg:hidden"> Open drawer </label>

		<div class="flex flex-1 flex-col bg-gray-200">
			<div class="flex items-center bg-base-200 p-2 shadow-2xs">
				<div class="items-center text-xl font-semibold">Dashboard</div>

				<div class="flex flex-1 items-center justify-end gap-x-4 rounded-3xl p-2">
					<Bell
						class="h-8 w-8 rounded-full p-1 transition-all hover:cursor-pointer hover:bg-gray-200"
					/>

					{#if $session.data?.user}
						<div class="dropdown dropdown-end">
							<button
								class="btn avatar btn-circle btn-ghost"
								aria-label="Abrir menú de perfil"
							>
								<div class="h-10 w-10 rounded-full">
									<img
										src={$session.data.user.image ?? fallbackAvatar}
										alt={$session.data.user.name ?? 'Usuario'}
										referrerpolicy="no-referrer"
									/>
								</div>
							</button>

							<ul
								class="dropdown-content menu z-[100] mt-3 w-56 menu-sm rounded-box bg-base-100 p-2 shadow"
								tabindex="-1"
							>
								<li class="menu-title px-2 py-1">
									<span class="text-xs opacity-60">
										{$session.data.user.name ?? $session.data.user.email}
									</span>
								</li>
								<li><a href="/profile">Perfil</a></li>
								<li><button disabled>Preferencias</button></li>
								<li class="mt-1 mb-1"><div class="divider my-1"></div></li>
								<li><button onclick={handleSignOut}>Cerrar sesión</button></li>
							</ul>
						</div>
					{/if}
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
			<div class="mb-4 flex items-center justify-center gap-x-4 p-2 text-4xl font-extrabold">
				TaskNet
			</div>

			<div class="flex items-center gap-x-4 rounded-lg bg-gray-200 p-2">
				<div class="w-10 rounded-full">
					<img src={orgLogo} alt={orgName} referrerpolicy="no-referrer" />
				</div>
				<div class="flex flex-col">
					<div class="font-bold">{orgName}</div>
					<div class="text-sm font-light opacity-70">{orgSlug}</div>
				</div>
			</div>

			<li
				class="mt-4 rounded-l-sm rounded-r-lg {page.route.id ===
				'/(app)/dashboard/[organizationSlug]'
					? 'border-l-4 bg-gray-300 font-bold'
					: ''}"
			>
				<a href="/dashboard/{orgSlug}">
					<LayoutDashboard class="h-6 w-6" /> Dashboard
				</a>
			</li>

			<li
				class="rounded-l-sm rounded-r-lg {page.route.id ===
				'/(app)/dashboard/[organizationSlug]/orders'
					? 'border-l-4 bg-gray-300 font-bold'
					: ''}"
			>
				<a href="/dashboard/{orgSlug}/orders">
					<ClipboardList class="h-6 w-6" /> Órdenes
				</a>
			</li>

			<li
				class="rounded-l-sm rounded-r-lg {page.route.id ===
				'/(app)/dashboard/[organizationSlug]/reports'
					? 'border-l-4 bg-gray-300 font-bold'
					: ''}"
			>
				<a href="/dashboard/{orgSlug}/reports">
					<ClipboardCheck class="h-6 w-6" /> Reportes
				</a>
			</li>

			<li
				class="rounded-l-sm rounded-r-lg {page.route.id ===
				'/(app)/dashboard/[organizationSlug]/technicians'
					? 'border-l-4 bg-gray-300 font-bold'
					: ''}"
			>
				<a href="/dashboard/{orgSlug}/technicians">
					<UserPen class="h-6 w-6" /> Técnicos
				</a>
			</li>
		</ul>
	</div>
</div>
