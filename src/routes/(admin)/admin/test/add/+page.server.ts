import { auth } from '$lib/auth';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');
	if (session.user.role !== 'admin') return error(403, 'No permission');

	await auth.api.addMember({
		body: {
			userId: 'user-id',
			role: ['member'],
			organizationId: event.url.searchParams.get('organizationId')!
		}
	});

	return {};
}) satisfies PageServerLoad;
