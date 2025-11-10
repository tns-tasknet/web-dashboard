import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session) redirect(307, '/login');

	await auth.api.setActiveOrganization({
		body: { organizationSlug: event.params.organizationSlug },
		headers: event.request.headers
	});

	const technicians = await prisma.member.findMany({
		where: {
			organization: { slug: event.params.organizationSlug },
			role: 'user'
		},
		include: {
			user: { select: { id: true, name: true, email: true } }
		},
		orderBy: [{ user: { name: 'asc' } }]
	});

	return { technicians };
};

export const actions: Actions = {
	default: async (event) => {
		const session = await auth.api.getSession({ headers: event.request.headers });
		if (!session) return fail(401, { message: 'No autorizado' });

		await auth.api.setActiveOrganization({
			body: { organizationSlug: event.params.organizationSlug },
			headers: event.request.headers
		});

		const data = await event.request.formData();
		const title = (data.get('title') ?? '').toString().trim();
		const content = (data.get('content') ?? '').toString().trim();
		const assigneeId = (data.get('assigneeId') ?? '').toString().trim() || null;

		if (!title || !content) {
			return fail(400, {
				message: 'Completa título y descripción.',
				values: { title, content, assigneeId }
			});
		}

		const created = await prisma.report.create({
			data: {
				title,
				content,
				organization: { connect: { slug: event.params.organizationSlug } },
				...(assigneeId ? { assignee: { connect: { id: assigneeId } } } : {})
			},
			select: { id: true }
		});

		throw redirect(303, `/dashboard/${event.params.organizationSlug}/orders`);
	}
};
