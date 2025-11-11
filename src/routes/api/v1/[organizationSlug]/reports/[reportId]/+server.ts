import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { prisma } from '$lib/server/prisma';
import { json, error } from '@sveltejs/kit';
import { ReportProgress } from '@prisma/client';

const ALLOWED_STATUS = new Set<ReportProgress>([
  'PENDING',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED'
]);

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

function parseReportId(event: Parameters<RequestHandler>[0]) {
	const id = Number(event.params.reportId);
	if (!Number.isFinite(id)) throw error(400, 'Parámetro inválido: reportId');
	return id;
}

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

export const GET: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const id = parseReportId(event);

	const report = await prisma.report.findFirst({
		where: { id, organization: { slug: organizationSlug }, status: ReportProgress.COMPLETED },
			include: {
				assignee: {
					include: {
						user: { select: { id: true, name: true, email: true, image: true, role: true } }
					}
				}
			}
	});

	if (!report) throw error(404, 'Reporte no encontrado');

	mustBeOwnerAdminOrAuthor(member, report as any);

	return json({ report });
};
