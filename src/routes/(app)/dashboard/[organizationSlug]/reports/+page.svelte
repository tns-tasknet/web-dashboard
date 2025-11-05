<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	// import { writable, type Writable } from 'svelte/store';
	// import type { Report as ReportType } from '@prisma/client';
	// import { onMount } from 'svelte';

	let { data }: PageProps = $props();

	/* TODO: Add svelte-headless-table here
	let isMounted = false;

	$effect(() => {
		if (isMounted) updateQuery($pageIndex)
	})

	const reports: Writable<ReportType[]> = writable([]);
	const reportCount: Writable<number> = writable(0);
		
	let controller = new AbortController();
	let loading = false;

	async function updateQuery(offset: any) {
		// Cancel the previous fetch request
		if (controller) controller.abort();
		loading = true;

		// Create a new AbortController for the new fetch request
		controller = new AbortController();

		const q = new URLSearchParams();
		q.set('options', 'paginated');
		q.set('limit', String($pageSize));
		q.set('skip', String($pageSize * $pageIndex));

		try {
			const res = await fetch(`/api/v1/reports?${q}`, { signal: controller.signal });
			const reports_res = await res.json();
			reports.set(reports_res.reports);
			reportCount.set(reports_res.total);
			loading = false;
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				loading = false;
			} else {
				console.log('error');
				loading = false;
				console.error(error)
			}
		}
	}

	onMount(() => {
		isMounted = true;
	});
	*/
</script>

<!-- TODO: REPORTS - LOGIC:

Able to create a report
Able to modify reports
All actions are logged and stored
Able to see all reports unique to this organization
Make it look nicer

Pagination API Implementation goes here
-->
<h1>REPORTS GO HERE</h1>
<a href="/dashboard/{page.params.organizationSlug}/reports/create" class="btn btn-primary">
	CREATE REPORT
</a>
<pre>{JSON.stringify(data, null, 4)}</pre>
