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

	const paginated = event.url.searchParams.get('paginated');
	if (paginated === 'true' && (member?.role === 'owner' || member?.role === 'admin')) {
		// Pagination API
		const limit = event.url.searchParams.get('limit');
		const offset = event.url.searchParams.get('offset');

		// Validate skip and limit or set default values
		let real_offset = Number(offset);
		let real_take = Number(limit);

		if (isNaN(Number(offset)) || !offset) {
			real_offset = 0;
		}

		if (isNaN(Number(limit)) || !limit) {
			real_take = 30;
		}

		const reports = await prisma.report.findMany({
			where: {
				organization: {
					slug: event.params.organizationSlug
				}
			},
			orderBy: {
				createdAt: 'desc'
			},
			skip: real_offset,
			take: real_take
		});

		const report_count = await prisma.report.count();

		return json({
			reports: reports,
			total: report_count,
			limit: real_take,
			offset: real_offset
		});
	}

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
