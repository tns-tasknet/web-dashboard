<script lang="ts">
	import type { PageProps } from './$types';
	import { authClient } from '$lib/client';

	let { data }: PageProps = $props();
	const session = authClient.useSession();

	let email = $state('');
	let password = $state('');
</script>

<div>
	{#if $session.data}
		<div>
			<p>
				{$session.data.user.name}
			</p>
			<button
				onclick={async () => {
					await authClient.signOut();
				}}
			>
				Sign Out
			</button>
		</div>
	{:else}
		<input class="bg-red-500 outline-8 outline-black" placeholder="email" bind:value={email} />
		<input class="bg-yellow-800" placeholder="password" bind:value={password} />
		<button
			onclick={async () => {
				await authClient.signIn.email({
					email: email,
					password: password
				});
			}}
		>
			Continue with GitHub
		</button>
	{/if}
</div>
