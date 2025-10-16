<script lang="ts">
    import type { PageProps } from './$types';
    import { authClient } from '$lib/client';
    
    const session = authClient.useSession();
    let { data }: PageProps = $props();
</script>

{JSON.stringify($session)}
<br>
<div class="btn btn-error">hello</div>
TODO:
Admin Dashboard
- List all users
- Manage Users
- List all organizations
- Manage organizations
- Sessions
<br>

