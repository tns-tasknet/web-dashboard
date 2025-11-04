<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<!-- TODO: REPORTS - LOGIC:

Able to create a report
Able to modify reports
All actions are logged and stored
Able to see all reports unique to this organization
Make it look nicer

-->
<h1>REPORTS GO HERE</h1>
<a href="/dashboard/{page.params.organizationSlug}/reports/create" class="btn btn-primary">
	CREATE REPORT
</a>
<pre>{JSON.stringify(data, null, 4)}</pre>
