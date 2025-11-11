import { auth } from '$lib/auth';
import { error, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

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

	const member = await auth.api.getActiveMember({
		headers: event.request.headers
	});

	const idParam = event.params.reportId;
	if (isNaN(Number(idParam))) error(400, 'Parámetro inválido: reportId');

	const report = await prisma.report.findFirst({
		where: {
			organization: { slug: event.params.organizationSlug },
			id: Number(idParam)
		},
		include: {
			assignee: {
				include: {
					user: {
						select: { id: true, name: true, email: true, image: true, role: true }
					}
				}
			}
		}
	});

	if (!report) error(404, 'Orden no encontrada');

	const isOwnerOrAdmin = member?.role === 'owner' || member?.role === 'admin';
	if (!isOwnerOrAdmin && report?.memberId !== member?.id) error(403, 'Forbidden');

	return { report };
}) satisfies PageServerLoad;
