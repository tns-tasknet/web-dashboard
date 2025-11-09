<script lang="ts">
	import { authClient } from '$lib/client';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1 class="text-3xl">Create Report</h1>

<form method="POST">
	<fieldset class="fieldset">
		<legend class="fieldset-legend">Report title</legend>
		<input type="text" placeholder="Type here" class="input" name="title" />
	</fieldset>

	<fieldset class="fieldset">
		<legend class="fieldset-legend">Report content</legend>
		<input type="text" placeholder="Type here" class="input" name="content" />
	</fieldset>

	<select class="select select-primary" name="status">
		<option disabled selected>Pick a status</option>
		<option>PENDING</option>
		<option>SCHEDULED</option>
		<option>IN_PROGRESS</option>
		<option>COMPLETED</option>
	</select>

	<button type="submit" class="btn btn-primary">Create report</button>
</form>

<!-- TODO: A lot of stuff -->
