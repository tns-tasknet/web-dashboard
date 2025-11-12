import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';

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

function parseOrderIdFromPath(event: Parameters<RequestHandler>[0]) {
	const orderId = Number(event.params.orderId);
	if (!Number.isFinite(orderId)) throw error(400, 'Parámetro inválido: reportId');
	return orderId;
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

export const GET: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const reportId = parseOrderIdFromPath(event);

	const order = await prisma.report.findFirst({
		where: { id: reportId, organization: { slug: organizationSlug } },
		include: {
			messages: {
				include: {
					sender: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true,
									role: true
								}
							}
						}
					}
				}
			}
		}
	});
	if (!order) throw error(404, 'Orden no encontrada');

	mustBeOwnerAdminOrAuthor(member, order);

	return json({
		messages: order.messages
	});
};

export const POST: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const reportId = parseOrderIdFromPath(event);

	let payload: Partial<{ text: string; tags: string[] }>;
	try {
		payload = await event.request.json();
	} catch {
		throw error(400, 'JSON inválido');
	}

	const content = String(payload.text ?? '').trim();
	if (!content) throw error(400, 'El contenido es requerido');

	const order = await prisma.report.findFirst({
		where: { id: reportId, organization: { slug: organizationSlug } },
		include: { assignee: true }
	});
	if (!order) throw error(404, 'Orden no encontrada');

	mustBeOwnerAdminOrAuthor(member, order);

	const created = await prisma.message.create({
		data: {
			reportId,
			memberId: member!.id,
			content,
			tags: payload.tags
		}
	});

	return json({
		created
	});
};
