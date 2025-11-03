<script lang="ts">
	import type { PageProps } from './$types';
	import { authClient } from '$lib/client';
	import { page } from '$app/state';

	let { data }: PageProps = $props();
</script>

<!-- TODO: STATS -->
<h1>STATS GO HERE</h1>
<a href="/dashboard/{page.params.organizationSlug}/reports" class="btn btn-primary">
	Go to reports
</a>
<pre>{JSON.stringify(data, null, 4)}</pre>
