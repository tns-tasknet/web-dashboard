import { auth } from '$lib/auth';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');

	const member = await auth.api.getActiveMember({
		headers: event.request.headers
	});

	if (isNaN(Number(event.params.reportId))) error(400, 'Hello World');

	const report = await prisma.report.findFirst({
		where: {
			organization: {
				slug: event.params.organizationSlug
			},
			id: Number(event.params.reportId)
		}
	});

	if (member?.role !== 'owner' && report?.memberId !== member?.id) error(403, 'Forbidden');
	if (!report) error(404, 'Not found');

	return {
		report
	};
}) satisfies PageServerLoad;
