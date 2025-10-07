<script lang="ts">
    import type { PageProps } from './$types';
    import { authClient } from '$lib/client';
    const session = authClient.useSession();

    let { data }: PageProps = $props();
    let users = $state();
</script>

{JSON.stringify($session)}
///////////////////////////////

<button class="bg-red-500 hover:bg-red-800" onclick={async () => {
    users = await authClient.listAccounts()
}}>List all accounts</button>

{JSON.stringify(users)}