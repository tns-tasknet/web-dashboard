import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { prisma } from '$lib/server/prisma';
import { json, error } from '@sveltejs/kit';
import type { ReportProgress, Prisma } from '@prisma/client';

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

function parseOrderId(event: Parameters<RequestHandler>[0]) {
	const id = Number(event.params.orderId);
	if (!Number.isFinite(id)) throw error(400, 'Parámetro inválido: orderId');
	return id;
}

function mustBeOwnerAdminOrAuthor(
	member: { role?: string; id?: string } | null,
	report: { assignee?: { id: string } | null } & Record<string, any>
) {
	const role = member?.role;
	const isOwnerOrAdmin = role === 'owner' || role === 'admin';
	const assignedId: string | null = report.assignee?.id ?? report.memberId ?? null;
	const isAuthor = assignedId != null && assignedId === member?.id;
	if (!isOwnerOrAdmin && !isAuthor) throw error(403, 'Forbidden');
}

function nextValidStatus(current: ReportProgress, incomingRaw?: unknown): ReportProgress {
	if (incomingRaw == null || incomingRaw === '') return current;
	const candidate = String(incomingRaw) as ReportProgress;
	if (!ALLOWED_STATUS.has(candidate)) throw error(400, 'Estado no válido.');
	return candidate;
}

// --- Helper para normalizar listas de texto ---
function coerceStringList(raw: unknown): string[] {
	if (raw == null) return [];
	if (Array.isArray(raw)) {
		return raw.map((v) => String(v).trim()).filter((v) => v.length > 0);
	}
	// permitir string con saltos de línea o comas
	return String(raw)
		.split(/[\n,]/g)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

export const GET: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const id = parseOrderId(event);

	const report = await prisma.report.findFirst({
		where: { id, organization: { slug: organizationSlug } },
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

	return json({ report });
};

export const PATCH: RequestHandler = async (event) => {
	const { organizationSlug, member } = await ensureSessionAndOrg(event);
	const id = parseOrderId(event);

	let payload: Partial<{
		title: string;
		content: string;
		status: ReportProgress;
		assigneeId: string | null;
		activities: string[] | string;
		materials: string[] | string;
		signature: string | null;
		evidence: string[];
	}>;
	try {
		payload = await event.request.json();
	} catch {
		throw error(400, 'JSON inválido');
	}

	const current = await prisma.report.findFirst({
		where: { id, organization: { slug: organizationSlug } }
	});
	if (!current) throw error(404, 'Orden no encontrada');

	mustBeOwnerAdminOrAuthor(member, current);

	const isOwnerOrAdmin = member?.role === 'owner' || member?.role === 'admin';
	if (current.status === 'COMPLETED' && !isOwnerOrAdmin) {
		throw error(400, 'La orden completada no admite cambios.');
	}

	const data: Prisma.ReportUpdateInput = {};

	if (payload.title !== undefined) {
		const title = String(payload.title).trim();
		if (!title) throw error(400, 'El título es requerido.');
		data.title = title;
	}
	if (payload.content !== undefined) {
		data.content = String(payload.content);
	}

	if (payload.status !== undefined) {
		const next = nextValidStatus(current.status as ReportProgress, payload.status);
		switch (next) {
			case 'COMPLETED':
				data.completedAt = new Date();
				break;
			case 'IN_PROGRESS':
				data.startedAt = new Date();
				break;
			case 'SCHEDULED':
				data.scheduledAt = new Date();
				break;
		}
		data.status = next;
	}

	if (payload.assigneeId !== undefined) {
		if (payload.assigneeId === null || payload.assigneeId === '') {
			data.assignee = { disconnect: true };
		} else {
			const m = await prisma.member.findFirst({
				where: { id: String(payload.assigneeId), organization: { slug: organizationSlug } },
				select: { id: true }
			});
			if (!m) throw error(400, 'assigneeId inválido para esta organización.');
			data.assignee = { connect: { id: m.id } };
		}
	}

	if (payload.activities !== undefined) {
		const list = coerceStringList(payload.activities);
		data.activities = { set: list };
	}

	if (payload.materials !== undefined) {
		const list = coerceStringList(payload.materials);
		data.materials = { set: list };
	}

	if (payload.signature !== undefined && payload.signature !== null) {
		const sig = payload.signature;

		let buffer: Buffer | null = null;
		const base64 = sig.split(',')[1];
		buffer = Buffer.from(base64, 'base64');

		if (buffer) {
			data.signature = buffer;
		}
	}

	if (
		payload.evidence !== undefined &&
		payload.evidence !== null &&
		payload.evidence.length > 0
	) {
		const buffers: Buffer[] = [];
		console.log(payload.evidence);

		for (const item of payload.evidence) {
			let buffer: Buffer | null = null;

			const base64 = item.split(',')[1];
			buffer = Buffer.from(base64, 'base64');

			if (buffer) {
				buffers.push(buffer);
			}
		}

		data.evidence = buffers;
	}

	if (Object.keys(data).length === 0) {
		return json({ report: current, unchanged: true });
	}

	const updated = await prisma.report.update({
		where: { id },
		data,
		include: {
			assignee: {
				include: {
					user: { select: { id: true, name: true, email: true, image: true, role: true } }
				}
			}
		}
	});

	return json({ report: updated });
};
