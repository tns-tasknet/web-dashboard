// api/v1/[organizationSlug]/corrections/+server.ts
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

function parseReportIdFromQuery(event: Parameters<RequestHandler>[0]) {
	const usp = event.url.searchParams;
	const reportId = Number(usp.get('reportId'));
	if (!Number.isFinite(reportId)) throw error(400, 'Parámetro inválido: reportId');
	return reportId;
}

// Ojo: Corrections.id es STRING (cuid)
function parseCorrectionIdFromQuery(event: Parameters<RequestHandler>[0]) {
	const usp = event.url.searchParams;
	const id = usp.get('id');
	if (!id || typeof id !== 'string') throw error(400, 'Parámetro inválido: id');
	return id;
}

// Puede crear si es owner/admin o autor/asignado del reporte
function mustBeOwnerAdminOrAuthor(
	member: { role?: string; id?: string } | null,
	report: { assignee?: { id: string } | null; memberId?: string | null }
) {
	const role = member?.role;
	const isOwnerOrAdmin = role === 'owner' || role === 'admin';
	const assignedId: string | null = report.assignee?.id ?? report.memberId ?? null;
	const isAuthor = assignedId != null && assignedId === member?.id;
	if (!isOwnerOrAdmin && !isAuthor) throw error(403, 'Forbidden');
}

// Para editar una rectificación: owner/admin o autor de la rectificación
function mustBeOwnerAdminOrCorrectionAuthor(
	member: { role?: string; id?: string } | null,
	correction: { memberId: string }
) {
	const role = member?.role;
	const isOwnerOrAdmin = role === 'owner' || role === 'admin';
	const isAuthor = correction.memberId === member?.id;
	if (!isOwnerOrAdmin && !isAuthor) throw error(403, 'Forbidden');
}

function roleLabel(memberRole?: string | null) {
	return memberRole === 'owner' || memberRole === 'admin' ? 'Coordinador' : 'Técnico';
}

/**
 * GET /api/v1/[organizationSlug]/corrections?reportId=123
 * Lista rectificaciones del reporte.
 */
export const GET: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const reportId = parseReportIdFromQuery(event);

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
			// author = Member; necesitamos role + user
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

/**
 * POST /api/v1/[organizationSlug]/corrections
 * Body: { reportId: number, content: string }
 */
export const POST: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);

	let payload: Partial<{ reportId: number; content: string }>;
	try {
		payload = await event.request.json();
	} catch {
		throw error(400, 'JSON inválido');
	}

	const reportId = Number(payload.reportId);
	if (!Number.isFinite(reportId)) throw error(400, 'reportId inválido');

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
			// createdAt lo maneja @default(now())
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

/**
 * PATCH /api/v1/[organizationSlug]/corrections?id=CU1Dxxxxx
 * Body: { content?: string }
 */
export const PATCH: RequestHandler = async (event) => {
	const { member } = await ensureSessionAndOrg(event);
	const id = parseCorrectionIdFromQuery(event); // string

	let payload: Partial<{ content: string }>;
	try {
		payload = await event.request.json();
	} catch {
		throw error(400, 'JSON inválido');
	}

	const current = await prisma.corrections.findUnique({
		where: { id }, // string
		include: {
			author: {
				select: {
					role: true,
					user: { select: { id: true, name: true, email: true, image: true } }
				}
			}
		}
	});
	if (!current) throw error(404, 'Rectificación no encontrada');

	// current.memberId existe en Corrections
	mustBeOwnerAdminOrCorrectionAuthor(member, { memberId: current.memberId });

	const data: { content?: string } = {};
	if (payload.content !== undefined) {
		const content = String(payload.content).trim();
		if (!content) throw error(400, 'El contenido es requerido');
		data.content = content;
	}

	if (Object.keys(data).length === 0) {
		return json({ correction: current, unchanged: true });
	}

	const updated = await prisma.corrections.update({
		where: { id },
		data,
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
			id: updated.id,
			content: updated.content,
			reportId: updated.reportId!,
			memberId: updated.memberId,
			createdAt: updated.createdAt,
			author: {
				name: updated.author?.user?.name ?? updated.author?.user?.email ?? '—',
				role: roleLabel(updated.author?.role ?? null)
			}
		}
	});
};
