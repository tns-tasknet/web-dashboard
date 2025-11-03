<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<!-- TODO: REPORT

Able to modify
All actions are logged
Send notification check
Signature Field + Files field
Able to see
Assign it to an user

-->

<h1>REPORT DETAILS</h1>
<pre>{JSON.stringify(data, null, 4)}</pre>
