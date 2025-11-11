import { auth } from '$lib/auth';
import { error, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});
	if (!session) redirect(307, '/login');

	const organizationSlug = event.params.organizationSlug;

	await auth.api.setActiveOrganization({
		body: { organizationSlug },
		headers: event.request.headers
	});

	const member = await auth.api.getActiveMember({
		headers: event.request.headers
	});

	const idParam = event.params.reportId;
	const reportId = Number(idParam);
	if (!Number.isFinite(reportId)) error(400, 'Parámetro inválido: reportId');

	const report = await prisma.report.findFirst({
		where: { organization: { slug: organizationSlug }, id: reportId },
		include: {
			assignee: {
				include: {
					user: { select: { id: true, name: true, email: true, image: true, role: true } }
				}
			}
		}
	});

	if (!report) error(404, 'Orden no encontrada');

	const isOwnerOrAdmin = member?.role === 'owner' || member?.role === 'admin';
	if (!isOwnerOrAdmin && report.memberId !== member?.id) error(403, 'Forbidden');

	// Traer rectificaciones desde la API (no Prisma directo desde la página)
	const res = await event.fetch(
		`/api/v1/${encodeURIComponent(organizationSlug)}/corrections?reportId=${reportId}`
	);
	if (!res.ok) {
		// Propaga el error de la API para mantener coherencia
		throw error(res.status, await res.text());
	}
	const { corrections } = await res.json();

	return { report, corrections };
}) satisfies PageServerLoad;
