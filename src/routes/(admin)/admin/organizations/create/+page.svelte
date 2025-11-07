<script lang="ts">
	import { authClient } from '$lib/client';
	import type { PageProps } from './$types';
	const session = authClient.useSession();

	let { data }: PageProps = $props();

	let orgName = $state('');
	let orgSlug = $derived(orgName.replaceAll(' ', '-').toLocaleLowerCase());
</script>

<h1 class="text-3xl">Create Organization</h1>

<fieldset class="fieldset">
	<legend class="fieldset-legend">Organization Name</legend>
	<input type="text" placeholder="Type here" class="input" bind:value={orgName} />
</fieldset>

<fieldset class="fieldset">
	<legend class="fieldset-legend">Organization Name</legend>
	<input type="text" placeholder="Type here" class="input" bind:value={orgSlug} />
</fieldset>

<button
	class="btn btn-primary"
	onclick={async () => {
		const { data, error } = await authClient.organization.create({
			name: orgName, // required
			slug: orgSlug, // required
			keepCurrentActiveOrganization: false
		});

		console.log('DATA');
		console.log(data);
		console.log('ERROR');
		console.log(error);
	}}
>
	Create that
</button>
