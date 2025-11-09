import type { PageServerLoad } from './$types';
import { auth } from '$lib/auth';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) redirect(307, '/login');

    await auth.api.setActiveOrganization({
        body: { organizationSlug: event.params.organizationSlug },
        headers: event.request.headers
    });

    const { role } = await auth.api.getActiveMemberRole({ headers: event.request.headers });
    if (role !== 'owner' && role !== 'admin') error(403);

    return {};
};
