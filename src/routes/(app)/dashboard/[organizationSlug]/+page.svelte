<script lang="ts">
    import type { PageProps } from './$types';
	import { authClient } from '$lib/client';

    let { data }: PageProps = $props();
</script>

<pre>{JSON.stringify(data, null, 4)}</pre>
