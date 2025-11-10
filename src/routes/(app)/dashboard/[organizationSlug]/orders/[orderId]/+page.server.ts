import { auth } from '$lib/auth';
import { error, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
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

function mustBeOwnerAdminOrAuthor(
	member: { role?: string; id?: string } | null,
	report: { memberId: string | null }
) {
	const role = member?.role;
	const isOwnerOrAdmin = role === 'owner' || role === 'admin';
	const isAuthor = report.memberId === member?.id;
	if (!isOwnerOrAdmin && !isAuthor) throw error(403, 'Forbidden');
}

function nextValidStatus(current: ReportProgress, incomingRaw: string): ReportProgress {
	const candidate = (incomingRaw || current) as ReportProgress;
	if (!ALLOWED_STATUS.has(candidate)) throw error(400, 'Estado no válido.');
	return candidate;
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
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const id = parseOrderId(event);

	const report = await prisma.report.findFirst({
		where: { organization: { slug: organizationSlug }, id },
		include: {
			assignee: {
				include: {
					user: { select: { id: true, name: true, email: true, image: true, role: true } }
				}
			}
		}
	});

	if (!report) throw error(404, 'Orden no encontrada');
	mustBeOwnerAdminOrAuthor(member, report);

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
		const assigneeId = (fd.get('assigneeId') ?? '').toString().trim();

		if (!title) throw error(400, 'El título es requerido.');

		const current = await prisma.report.findFirst({
			where: { id, organization: { slug: organizationSlug } }
		});
		if (!current) throw error(404, 'Orden no encontrada');

		mustBeOwnerAdminOrAuthor(member, current);

		const isOwnerOrAdmin = member?.role === 'owner' || member?.role === 'admin';
		if (current.status === 'COMPLETED' && !isOwnerOrAdmin) {
			throw error(400, 'La orden completada no admite cambios.');
		}

		const nextStatus = nextValidStatus(current.status as ReportProgress, statusRaw);

		await prisma.report.update({
			where: { id },
			data: {
				title,
				content,
				status: nextStatus,
				memberId: assigneeId || null
			}
		});

		throw redirect(303, event.url.pathname);
	}
};
