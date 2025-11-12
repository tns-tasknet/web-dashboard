import { auth } from '$lib/auth';
import { error, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	// 1) Sesión y org activa (para consistencia general de la app)
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session) redirect(307, '/login');

	const organizationSlug = event.params.organizationSlug!;
	await auth.api.setActiveOrganization({
		body: { organizationSlug },
		headers: event.request.headers
	});

	// 2) Validar y parsear reportId
	const idParam = event.params.reportId;
	const reportId = Number(idParam);
	if (!Number.isFinite(reportId)) {
		throw error(400, 'Parámetro inválido: reportId');
	}

	// 3) Obtener el reporte desde la API centralizada (ya serializa base64 y valida permisos)
	const reportRes = await event.fetch(
		`/api/v1/${encodeURIComponent(organizationSlug)}/reports/${reportId}`,
		{ headers: event.request.headers }
	);
	if (!reportRes.ok) {
		// Propaga el error de la API (404, 403, etc.)
		throw error(reportRes.status, await reportRes.text());
	}
	const { report } = await reportRes.json();

	// 4) Obtener correcciones (como ya lo hacías)
	const corrRes = await event.fetch(
		`/api/v1/${encodeURIComponent(organizationSlug)}/reports/${reportId}/corrections`,
		{ headers: event.request.headers }
	);
	if (!corrRes.ok) {
		throw error(corrRes.status, await corrRes.text());
	}
	const { corrections } = await corrRes.json();

	// 5) Retornar datos listos para el front (report ya viene con evidence/signature en base64 strings)
	return { report, corrections };
}) satisfies PageServerLoad;
