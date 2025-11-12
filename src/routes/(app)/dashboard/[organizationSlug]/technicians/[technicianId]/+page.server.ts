// +page.server.ts
import { auth } from '$lib/auth';
import { error, redirect, type ServerLoad } from '@sveltejs/kit';

type EventLike = {
	request: Request;
	params: Record<string, string | undefined>;
	fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

async function ensureSessionAndOrg(event: EventLike) {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session) throw redirect(307, '/login');

	const organizationSlug = event.params.organizationSlug!;
	await auth.api.setActiveOrganization({
		body: { organizationSlug },
		headers: event.request.headers
	});

	const member = await auth.api.getActiveMember({ headers: event.request.headers });
	return { organizationSlug, member };
}

function parseTechnicianId(event: { params: Record<string, string | undefined> }) {
	const id = event.params.technicianId;
	if (!id || typeof id !== 'string') throw error(400, 'Parámetro inválido: technicianId');
	return id;
}

export const load = (async (event) => {
	const { organizationSlug } = await ensureSessionAndOrg(event);
	const technicianId = parseTechnicianId(event);

	const res = await event.fetch(
		`/api/v1/${encodeURIComponent(organizationSlug)}/technicians/${encodeURIComponent(technicianId)}`
	);
	if (res.status === 404) throw error(404, 'Técnico no encontrado');
	if (!res.ok) {
		let msg = 'No fue posible cargar el técnico';
		try {
			const j = await res.json();
			if (j?.error) msg = j.error;
		} catch {}
		throw error(res.status, msg);
	}

	const { technician, openHistory, closedHistory } = await res.json();
	return { technician, openHistory, closedHistory, organizationSlug };
}) satisfies ServerLoad;
