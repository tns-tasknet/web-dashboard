import { auth } from '$lib/auth';
import { error, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');
	if (session.user.role !== 'admin') return error(403, 'No permission');

	const fullOrganzation = await auth.api.getFullOrganization({
		query: {
			organizationSlug: event.params.organizationSlug
		},
		headers: event.request.headers
	});

	const users = await auth.api.listUsers({
		query: {
			searchValue: ''
		},
		headers: event.request.headers
	});
	const members = await auth.api.listMembers({
		query: {
			organizationId: fullOrganzation?.id
		},
		headers: event.request.headers
	});

	return {
		users,
		members,
		fullOrganzation
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const userid = data.get('userid')?.toString();

		const org = await auth.api.getFullOrganization({
			query: {
				organizationSlug: event.params.organizationSlug
			},
			headers: event.request.headers
		});

		await auth.api.addMember({
			body: {
				userId: userid!,
				role: ['member'],
				organizationId: org?.id
			}
		});
	}
};
