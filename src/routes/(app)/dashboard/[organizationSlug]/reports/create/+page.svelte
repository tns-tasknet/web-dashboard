<script lang="ts">
	import { authClient } from '$lib/client';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let title = $state('');
	let content = $state('');
	let status = $state();
</script>

<h1 class="text-3xl">Create Report</h1>

<fieldset class="fieldset">
	<legend class="fieldset-legend">Report title</legend>
	<input type="text" placeholder="Type here" class="input" bind:value={title} />
</fieldset>

<fieldset class="fieldset">
	<legend class="fieldset-legend">Report content</legend>
	<input type="text" placeholder="Type here" class="input" bind:value={content} />
</fieldset>

<select class="select" bind:value={status}>
	<option disabled selected>Pick a status</option>
	<option>PENDING</option>
	<option>SCHEDULED</option>
	<option>IN_PROGRESS</option>
	<option>COMPLETED</option>
</select>

{$inspect(status)}
