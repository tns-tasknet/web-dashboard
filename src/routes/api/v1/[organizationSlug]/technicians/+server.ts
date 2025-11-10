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

	// Parámetros
	const usp = new URLSearchParams(event.url.search);
	const limitParam = Number(usp.get('limit'));
	const offsetParam = Number(usp.get('offset'));
	const q = (usp.get('q') ?? '').trim();

	const sort = (usp.get('sort') ?? 'name') as 'id' | 'name' | 'email';
	const dir = (usp.get('dir') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

	const take =
		Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 100 ? limitParam : 30;
	const skip = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

	// Filtro por técnicos
	const where: Prisma.MemberWhereInput = {
		organization: { slug: event.params.organizationSlug },
		role: 'member',
		...(q
			? {
					user: {
						name: { contains: q, mode: 'insensitive' }
					}
				}
			: {})
	};

	// Ordenamiento
	let orderBy: Prisma.MemberOrderByWithRelationInput;
	switch (sort) {
		case 'id':
			orderBy = { id: dir };
			break;
		case 'email':
			orderBy = { user: { email: dir } } as Prisma.MemberOrderByWithRelationInput;
			break;
		case 'name':
		default:
			orderBy = { user: { name: dir } } as Prisma.MemberOrderByWithRelationInput;
			break;
	}

	const [items, total] = await Promise.all([
		prisma.member.findMany({
			where,
			orderBy,
			skip,
			take,
			include: {
				user: { select: { id: true, name: true, email: true } },
				// Última orden ABIERTA (status != COMPLETED)
				Report: {
					where: { status: { not: ReportProgress.COMPLETED } },
					orderBy: { createdAt: 'desc' },
					take: 1,
					select: { id: true, title: true, status: true, createdAt: true }
				}
			}
		}),
		prisma.member.count({ where })
	]);

	return json({
		technicians: items,
		total,
		limit: take,
		offset: skip
	});
};
