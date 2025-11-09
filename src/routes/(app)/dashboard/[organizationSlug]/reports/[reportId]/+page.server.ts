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
			// Mensajería en pausa: habilitar cuando retomemos chat
			/*
			messages: {
				include: {
					sender: {
						include: {
							user: {
								select: { id: true, name: true, email: true, image: true, role: true }
							}
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			},
			*/
			assignee: {
				include: {
					user: {
						select: { id: true, name: true, email: true, image: true, role: true }
					}
				}
			}
			// FUTURO (si se soportan múltiples técnicos):
			// technicians: {
			//   include: { user: { select: { id: true, name: true, email: true, image: true } } }
			// }
		}
	});

	if (!report) error(404, 'Orden no encontrada');

	// Autorización simple: dueño/admin o miembro asignado
	if (member?.role !== 'owner' && report?.memberId !== member?.id) error(403, 'Forbidden');

	return { report };
}) satisfies PageServerLoad;

// Mensajería pausada: comentamos 'actions' para evitar POSTs al chat
/*
export const actions: Actions = {
	default: async (event) => {
		const session = await auth.api.getSession({ headers: event.request.headers });
		if (!session) redirect(307, '/login');

		await auth.api.setActiveOrganization({
			body: { organizationSlug: event.params.organizationSlug },
			headers: event.request.headers
		});

		const member = await auth.api.getActiveMember({ headers: event.request.headers });

		const idParam = event.params.reportId;
		if (isNaN(Number(idParam))) error(400, 'Parámetro inválido: reportId');

		const report = await prisma.report.findFirst({ where: { id: Number(idParam) } });
		if (!report) error(404);

		// TODO: Validación con zod/superforms
		const form = await event.request.formData();
		const content = form.get('message')?.toString().trim();
		if (!content) error(400, 'Mensaje vacío');

		await prisma.message.create({
			data: { content, memberId: member!.id, reportId: report.id }
		});
		return {};
	}
};
*/
