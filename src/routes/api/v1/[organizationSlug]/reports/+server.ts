import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { prisma } from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) return new Response(null, { status: 401 });

	const data = await auth.api.setActiveOrganization({
		body: {
			organizationSlug: event.params.organizationSlug
		},
		headers: event.request.headers
	});

	const member = await auth.api.getActiveMember({
		headers: event.request.headers
	});

	const reports = await prisma.report.findMany({
		where: {
			organization: {
				slug: event.params.organizationSlug
			},
			memberId: member?.id
		}
	});

	return json(reports);
};
