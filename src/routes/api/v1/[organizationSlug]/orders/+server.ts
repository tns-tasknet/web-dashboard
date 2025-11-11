import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { prisma } from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import type { Prisma } from '@prisma/client';
import { ReportProgress } from '@prisma/client';

export const GET: RequestHandler = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session) return new Response(null, { status: 401 });

	await auth.api.setActiveOrganization({
		body: { organizationSlug: event.params.organizationSlug },
		headers: event.request.headers
	});

	const member = await auth.api.getActiveMember({ headers: event.request.headers });

	// Parámetros
	const usp = event.url.searchParams;
	const isPaginated = usp.get('paginated') === 'true';
	const limitParam = Number(usp.get('limit'));
	const offsetParam = Number(usp.get('offset'));
	const q = (usp.get('q') ?? '').trim();

	// Ordenamiento
	const sort = (usp.get('sort') ?? 'createdAt') as
		| 'id'
		| 'title'
		| 'memberName'
		| 'status'
		| 'createdAt';
	const dir = (usp.get('dir') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

	const take =
		Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 100 ? limitParam : 30;
	const skip = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

	// Filtro base
	const where: Prisma.ReportWhereInput = {
		organization: { is: { slug: event.params.organizationSlug } },
		status: { not: ReportProgress.COMPLETED },
		...(member && member.role !== 'owner' && member.role !== 'admin'
			? { assignee: { id: member.id } }
			: {})
	};

	// Búsqueda simple
	if (q) {
		where.OR = [
			{ title: { contains: q, mode: 'insensitive' } },
			{ content: { contains: q, mode: 'insensitive' } }
		];
	}

	// orderBy dinámico
	let orderBy: Prisma.ReportOrderByWithRelationInput;
	switch (sort) {
		case 'id':
			orderBy = { id: dir };
			break;
		case 'title':
			orderBy = { title: dir };
			break;
		case 'status':
			orderBy = { status: dir };
			break;
		case 'memberName':
			orderBy = {
				assignee: { user: { name: dir } }
			} as Prisma.ReportOrderByWithRelationInput;
			break;
		case 'createdAt':
		default:
			orderBy = { createdAt: dir };
			break;
	}

	// Carga de datos
	const [reports, total] = await Promise.all([
		prisma.report.findMany({
			where,
			orderBy,
			skip,
			take,
			include: {
				assignee: {
					include: {
						user: {
							select: { id: true, name: true, email: true }
						}
					}
				}
			}
		}),
		prisma.report.count({ where })
	]);

	return json({
		reports,
		total,
		limit: take,
		offset: skip
	});
};
