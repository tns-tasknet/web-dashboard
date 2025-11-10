import { auth } from '$lib/auth';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');

	const organizationData = await auth.api.getFullOrganization({
		query: {
			organizationSlug: event.params.organizationSlug,
			membersLimit: 100
		},
		headers: event.request.headers
	});

	const data = await auth.api.setActiveOrganization({
		body: {
			organizationSlug: event.params.organizationSlug
		},
		headers: event.request.headers
	});

	const { role } = await auth.api.getActiveMemberRole({
		// This endpoint requires session cookies.
		headers: event.request.headers
	});

	const member = await auth.api.getActiveMember({
		// This endpoint requires session cookies.
		headers: event.request.headers
	});

	return {
		organizationData
	};
}) satisfies PageServerLoad;
