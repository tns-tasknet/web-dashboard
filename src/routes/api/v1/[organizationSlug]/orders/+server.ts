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
    const take =
        Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 100 ? limitParam : 30;
    const skip = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

    // Filtro base
    const where: Prisma.ReportWhereInput = {
        organization: { is: { slug: event.params.organizationSlug } },
        status: { not: ReportProgress.COMPLETED },
        ...(member && member.role !== 'owner' && member.role !== 'admin'
            ? { memberId: member.id }
            : {})
    };

    // Búsqueda simple
    if (q) {
        where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
            { response: { contains: q, mode: 'insensitive' } }
        ];
    }

    // Carga de datos
    const [reports, total] = await Promise.all([
        prisma.report.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take
        }),
        prisma.report.count({ where })
    ]);

    return json({ reports, total, limit: take, offset: skip });
};
