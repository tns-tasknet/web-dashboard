import { auth } from '$lib/auth';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) return new Response(null, { status: 401 });

	const member = await auth.api.getActiveMember({
		headers: event.request.headers
	});

	if (isNaN(Number(event.params.reportId))) return new Response(null, { status: 400 });

	const report = await prisma.report.findFirst({
		where: {
			organization: {
				slug: event.params.organizationSlug
			},
			id: Number(event.params.reportId)
		}
	});

	if (member?.role !== 'owner' && report?.memberId !== member?.id)
		return new Response(null, { status: 403 });
	if (!report) return new Response(null, { status: 404 });

	return json(report);
};

export const PATCH: RequestHandler = async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) return new Response(null, { status: 401 });

	const member = await auth.api.getActiveMember({
		headers: event.request.headers
	});

	if (isNaN(Number(event.params.reportId))) return new Response(null, { status: 400 });

	const report = await prisma.report.findFirst({
		where: {
			organization: {
				slug: event.params.organizationSlug
			},
			id: Number(event.params.reportId)
		}
	});

	if (member?.role !== 'owner' && report?.memberId !== member?.id)
		return new Response(null, { status: 403 });
	if (!report) return new Response(null, { status: 404 });

	const { response, status } = await event.request.json();

	const updatedReport = await prisma.report.update({
		where: {
			organization: {
				slug: event.params.organizationSlug
			},
			id: Number(event.params.reportId)
		},
		data: {
			response,
			status
		}
	});

	return json(updatedReport);
};
