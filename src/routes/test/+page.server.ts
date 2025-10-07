import { auth } from '$lib/auth';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
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
