import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { auth } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');

	await auth.api.setActiveOrganization({
		body: {
			organizationSlug: event.params.organizationSlug
		},
		headers: event.request.headers
	});

	const { role } = await auth.api.getActiveMemberRole({
		// This endpoint requires session cookies.
		headers: event.request.headers
	});

	// TODO: Restrict who can access this route

	const selfReports = await prisma.report.findMany({
		where: {
			assignee: {
				userId: session.user.id
			},
			organization: {
				slug: event.params.organizationSlug
			}
		}
	});

	return {
		selfReports
	};
}) satisfies PageServerLoad;
