import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { auth } from '$lib/auth';
import { error, redirect } from '@sveltejs/kit';

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

	if (role !== 'owner' && role !== 'admin') error(403);

	const reports = await prisma.report.findMany({
		where: {
			organization: {
				slug: event.params.organizationSlug
			}
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	return {
		reports
	};
}) satisfies PageServerLoad;
