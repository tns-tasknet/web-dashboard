import { auth } from '$lib/auth';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');
	if (session.user.role !== 'admin') return error(403, 'No permission')

	const users = await auth.api.listUserAccounts({
		query: {
			query: {
				searchValue: '',
				searchOperator: 'contains'
			}
		},
		headers: event.request.headers
	});
	return {
		users
	};
}) satisfies PageServerLoad;
