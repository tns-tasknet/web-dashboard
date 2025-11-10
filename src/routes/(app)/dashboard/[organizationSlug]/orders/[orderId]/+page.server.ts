import { auth } from '$lib/auth';
import { error, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ReportProgress } from '@prisma/client';

type TechnicianOption = { value: string; label: string };

type EventLike = {
	request: Request;
	params: Record<string, string | undefined>;
	fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const ALLOWED_STATUS = new Set<ReportProgress>([
	'PENDING',
	'SCHEDULED',
	'IN_PROGRESS',
	'COMPLETED'
]);

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

function parseOrderId(event: { params: Record<string, string | undefined> }) {
	const id = Number(event.params.orderId);
	if (!Number.isFinite(id)) throw error(400, 'Parámetro inválido: orderId');
	return id;
}

async function fetchTechnicianOptions(event: EventLike, org: string) {
	const usp = new URLSearchParams({
		paginated: 'true',
		limit: '500',
		offset: '0',
		sort: 'createdAt',
		dir: 'asc'
	});

	try {
		const res = await event.fetch(`/api/v1/${org}/technicians?${usp.toString()}`);
		if (!res.ok) return [] as TechnicianOption[];

		const json = await res.json();
		const rows = (json.technicians ?? []) as Array<{
			id: string;
			user?: { name?: string | null; email?: string | null } | null;
		}>;

		return rows.map((t) => ({
			value: t.id,
			label: t.user?.name || t.user?.email || t.id
		}));
	} catch {
		return [] as TechnicianOption[];
	}
}

export const load = (async (event) => {
	const { organizationSlug } = await ensureSessionAndOrg(event);
	const id = parseOrderId(event);

	const res = await event.fetch(`/api/v1/${organizationSlug}/orders/${id}`);
	if (res.status === 404) throw error(404, 'Orden no encontrada');
	if (!res.ok) throw error(res.status, 'No fue posible cargar la orden');

	const { report } = await res.json();

	const technicianOptions = await fetchTechnicianOptions(event, organizationSlug);

	return { report, technicianOptions };
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async (event) => {
		const { organizationSlug, member } = await ensureSessionAndOrg(event);
		const id = parseOrderId(event);

		const fd = await event.request.formData();
		const intent = (fd.get('intent') ?? '').toString();
		if (intent !== 'update') throw error(400, 'Intent no reconocido');

		const title = (fd.get('title') ?? '').toString().trim();
		const content = (fd.get('content') ?? '').toString().trim();
		const statusRaw = (fd.get('status') ?? '').toString().trim();
		const assigneeIdRaw = (fd.get('assigneeId') ?? '').toString().trim();

		if (!title) throw error(400, 'El título es requerido.');


		const payload: {
			title?: string;
			content?: string;
			status?: string;
			assigneeId?: string | null;
		} = {};

		payload.title = title;   
		payload.content = content;        
		if (statusRaw) payload.status = statusRaw;

		if (assigneeIdRaw === '__UNASSIGN__') {
		payload.assigneeId = null;
		} else if (assigneeIdRaw !== '') {
		payload.assigneeId = assigneeIdRaw;
		}

		const resPatch = await event.fetch(`/api/v1/${organizationSlug}/orders/${id}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
		});

		if (resPatch.status === 404) throw error(404, 'Orden no encontrada');
		if (!resPatch.ok) {
		let msg = 'No fue posible actualizar la orden';
		try {
			const j = await resPatch.json();
			if (j?.error) msg = j.error;
		} catch {}
		throw error(resPatch.status, msg);
		}

		throw redirect(303, event.url.pathname);
	}
};