import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { prisma } from '$lib/server/prisma';
import { json, error } from '@sveltejs/kit';

async function ensureSessionAndOrg(event: Parameters<RequestHandler>[0]) {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session) throw error(401, 'Unauthorized');

	const organizationSlug = event.params.organizationSlug!;
	await auth.api.setActiveOrganization({
		body: { organizationSlug },
		headers: event.request.headers
	});

	const member = await auth.api.getActiveMember({ headers: event.request.headers });
	return { organizationSlug, member };
}

function parseReportIdFromPath(event: Parameters<RequestHandler>[0]) {
	const reportId = Number(event.params.reportId);
	if (!Number.isFinite(reportId)) throw error(400, 'Parámetro inválido: reportId');
	return reportId;
}

function mustBeOwnerAdminOrAuthor(
	member: { role?: string; id?: string } | null,
	report: { assignee?: { id: string } | null; memberId?: string | null }
) {
	const isOwnerOrAdmin = member?.role === 'owner' || member?.role === 'admin';
	const assignedId: string | null = report.assignee?.id ?? report.memberId ?? null;
	const isAuthor = assignedId != null && assignedId === member?.id;
	if (!isOwnerOrAdmin && !isAuthor) throw error(403, 'Forbidden');
}

function roleLabel(memberRole?: string | null) {
	return memberRole === 'owner' || memberRole === 'admin' ? 'Coordinador' : 'Técnico';
}

// GET /api/v1/[organizationSlug]/reports/[reportId]/corrections
export const GET: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const reportId = parseReportIdFromPath(event);

	const report = await prisma.report.findFirst({
		where: { id: reportId, organization: { slug: organizationSlug } },
		include: { assignee: true }
	});
	if (!report) throw error(404, 'Reporte no encontrado');

	mustBeOwnerAdminOrAuthor(member, report);

	const items = await prisma.corrections.findMany({
		where: { reportId },
		orderBy: { createdAt: 'asc' },
		include: {
			author: {
				select: {
					role: true,
					user: { select: { id: true, name: true, email: true, image: true } }
				}
			}
		}
	});

	const corrections = items.map((c) => ({
		id: c.id,
		content: c.content,
		reportId: c.reportId!,
		memberId: c.memberId,
		createdAt: c.createdAt,
		author: {
			name: c.author?.user?.name ?? c.author?.user?.email ?? '—',
			role: roleLabel(c.author?.role ?? null)
		}
	}));

	return json({ corrections });
};

// POST /api/v1/[organizationSlug]/reports/[reportId]/corrections
export const POST: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const reportId = parseReportIdFromPath(event);

	let payload: Partial<{ content: string }>;
	try {
		payload = await event.request.json();
	} catch {
		throw error(400, 'JSON inválido');
	}

	const content = String(payload.content ?? '').trim();
	if (!content) throw error(400, 'El contenido es requerido');

	const report = await prisma.report.findFirst({
		where: { id: reportId, organization: { slug: organizationSlug } },
		include: { assignee: true }
	});
	if (!report) throw error(404, 'Reporte no encontrado');

	mustBeOwnerAdminOrAuthor(member, report);

	const created = await prisma.corrections.create({
		data: {
			reportId,
			memberId: member!.id!,
			content
		},
		include: {
			author: {
				select: {
					role: true,
					user: { select: { id: true, name: true, email: true, image: true } }
				}
			}
		}
	});

	return json({
		correction: {
			id: created.id,
			content: created.content,
			reportId: created.reportId!,
			memberId: created.memberId,
			createdAt: created.createdAt,
			author: {
				name: created.author?.user?.name ?? created.author?.user?.email ?? '—',
				role: roleLabel(created.author?.role ?? null)
			}
		}
	});
};
