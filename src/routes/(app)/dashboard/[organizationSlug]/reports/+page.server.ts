import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { auth } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');

	const organization = await auth.api.getFullOrganization({
		query: {
			organizationSlug: event.params.organizationSlug
		},
		headers: event.request.headers
	});

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
