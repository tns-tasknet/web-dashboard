<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>hi</h1>
<pre>{JSON.stringify(data, null, 4)}</pre>
