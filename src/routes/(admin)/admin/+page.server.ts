import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { auth } from '$lib/auth';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');
	if (session.user.role !== 'admin') return error(403, 'No permission');

	return {};
}) satisfies PageServerLoad;
