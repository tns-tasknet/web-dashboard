import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { prisma } from '$lib/server/prisma';
import { json, error } from '@sveltejs/kit';
import { ReportProgress } from '@prisma/client';

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

// --- helpers binarios ---
function bufToB64(x: unknown): string | null {
	if (!x) return null;
	if (typeof x === 'string') return x; // ya es base64 o data URL
	if (x instanceof Uint8Array) return Buffer.from(x).toString('base64');
	if (typeof x === 'object' && (x as any).type === 'Buffer' && Array.isArray((x as any).data)) {
		return Buffer.from((x as any).data).toString('base64');
	}
	return null;
}

export const GET: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const id = parseReportId(event);

	const report = await prisma.report.findFirst({
		where: {
			id,
			organization: { slug: organizationSlug },
			status: ReportProgress.COMPLETED
		},
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

	// Serializa binarios a base64 (solo strings serializables en JSON)
	const safeReport: any = { ...report };

	// evidence: bytea[]
	if (Array.isArray((report as any).evidence)) {
		safeReport.evidence = (report as any).evidence
			.map((e: unknown) => bufToB64(e))
			.filter((s: string | null): s is string => Boolean(s));
	}

	// signature: bytea
	if ((report as any).signature != null) {
		const s = bufToB64((report as any).signature);
		// si no se pudo convertir, evita mandar algo no serializable
		if (s) safeReport.signature = s;
		else safeReport.signature = null;
	}

	return json({ report: safeReport });
};
