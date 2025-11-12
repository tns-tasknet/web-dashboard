// api/v1/[organizationSlug]/technicians/[technicianId]/+server.ts
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

function parseTechnicianId(event: Parameters<RequestHandler>[0]) {
	const id = event.params.technicianId;
	if (!id || typeof id !== 'string') throw error(400, 'Parámetro inválido: technicianId');
	return id;
}

function mustBeOwnerAdminOrSelf(
	requester: { role?: string; id?: string } | null,
	targetMemberId: string
) {
	const role = requester?.role;
	const isOwnerOrAdmin = role === 'owner' || role === 'admin';
	const isSelf = requester?.id === targetMemberId;
	if (!isOwnerOrAdmin && !isSelf) throw error(403, 'Forbidden');
}

export const GET: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const technicianId = parseTechnicianId(event);

	const technician = await prisma.member.findFirst({
		where: {
			id: technicianId,
			organization: { slug: organizationSlug },
			role: 'member'
		},
		select: {
			id: true,
			role: true,
			createdAt: true,
			user: { select: { id: true, name: true, email: true, image: true, role: true } }
		}
	});

	if (!technician) throw error(404, 'Técnico no encontrado');

	mustBeOwnerAdminOrSelf(member, technician.id);

	// Órdenes abiertas: PENDING, SCHEDULED, IN_PROGRESS
	const openReports = await prisma.report.findMany({
		where: {
			organization: { slug: organizationSlug },
			memberId: technicianId,
			status: { in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS'] as any }
		},
		select: {
			id: true,
			title: true,
			status: true,
			createdAt: true,
			updatedAt: true,
			closedAt: true
		},
		orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
	});

	// Órdenes cerradas: COMPLETED
	const closedReports = await prisma.report.findMany({
		where: {
			organization: { slug: organizationSlug },
			memberId: technicianId,
			status: 'COMPLETED'
		},
		select: {
			id: true,
			title: true,
			status: true,
			createdAt: true,
			updatedAt: true,
			closedAt: true
		},
		orderBy: [{ closedAt: 'desc' }, { createdAt: 'desc' }]
	});

	const openHistory = openReports.map((r) => ({
		id: r.id,
		title: r.title,
		status: r.status,
		createdAt: r.createdAt,
		updatedAt: r.updatedAt ?? r.createdAt,
		closedAt: r.closedAt
	}));

	const closedHistory = closedReports.map((r) => ({
		id: r.id,
		title: r.title,
		status: r.status,
		createdAt: r.createdAt,
		updatedAt: r.updatedAt ?? r.createdAt,
		closedAt: r.closedAt
	}));

	return json({
		technician: {
			id: technician.id,
			role: technician.role,
			createdAt: technician.createdAt,
			user: technician.user
		},
		openHistory,
		closedHistory
	});
};
