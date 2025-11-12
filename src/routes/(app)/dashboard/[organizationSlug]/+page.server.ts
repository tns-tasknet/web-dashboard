import { auth } from '$lib/auth';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

function parseISODateOnly(s?: string | null) {
	if (!s) return null;
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	if (!m) return null;
	const [_, y, mo, d] = m;
	const dt = new Date(Number(y), Number(mo) - 1, Number(d));
	if (isNaN(dt.getTime())) return null;
	return dt;
}

function startOfDay(d: Date) {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}
function endOfDay(d: Date) {
	const x = new Date(d);
	x.setHours(23, 59, 59, 999);
	return x;
}
function eachDay(from: Date, to: Date) {
	const out: Date[] = [];
	const cur = startOfDay(from);
	const last = startOfDay(to);
	while (cur <= last) {
		out.push(new Date(cur));
		cur.setDate(cur.getDate() + 1);
	}
	return out;
}

export const load = (async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session) redirect(307, '/login');

	const organizationSlug = event.params.organizationSlug;

	await auth.api.setActiveOrganization({
		body: { organizationSlug },
		headers: event.request.headers
	});

	const organizationData = await auth.api.getFullOrganization({
		query: { organizationSlug, membersLimit: 100 },
		headers: event.request.headers
	});

	// Rango
	const usp = event.url.searchParams;
	const fromParam = parseISODateOnly(usp.get('from'));
	const toParam = parseISODateOnly(usp.get('to'));

	const today = new Date();
	const defaultFrom = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000); // últimos 7 días
	const from = startOfDay(fromParam ?? defaultFrom);
	const to = endOfDay(toParam ?? today);

	if (from > to) throw error(400, 'Rango de fechas inválido (from > to)');

	// Offset inicial: órdenes abiertas al inicio del rango
	const initialOpen = await prisma.report.count({
		where: {
			organization: { slug: organizationSlug },
			createdAt: { lt: from },
			OR: [{ closedAt: null }, { closedAt: { gt: from } }]
		}
	});

	// Creadas en el rango
	const createdInRange = await prisma.report.findMany({
		where: {
			organization: { slug: organizationSlug },
			createdAt: { gte: from, lte: to }
		},
		select: { createdAt: true }
	});

	// Cerradas (COMPLETED) en el rango
	const closedInRange = await prisma.report.findMany({
		where: {
			organization: { slug: organizationSlug },
			status: 'COMPLETED',
			closedAt: { gte: from, lte: to }
		},
		select: { closedAt: true }
	});

	// Para SLA: creadas en el rango que tienen closedAt
	const createdWithClose = await prisma.report.findMany({
		where: {
			organization: { slug: organizationSlug },
			createdAt: { gte: from, lte: to },
			closedAt: { not: null }
		},
		select: { createdAt: true, closedAt: true }
	});

	// Buckets y serie
	const days = eachDay(from, to);
	const indexByDay = new Map<number, number>();
	days.forEach((d, i) => indexByDay.set(startOfDay(d).getTime(), i));

	const createdBuckets = Array(days.length).fill(0);
	for (const r of createdInRange) {
		const key = startOfDay(r.createdAt).getTime();
		const idx = indexByDay.get(key);
		if (idx != null) createdBuckets[idx]++;
	}

	const closedBuckets = Array(days.length).fill(0);
	for (const r of closedInRange) {
		const key = startOfDay(r.closedAt!).getTime();
		const idx = indexByDay.get(key);
		if (idx != null) closedBuckets[idx]++;
	}

	const seriesOpen: Array<{ x: number; y: number }> = [];
	let openAcc = initialOpen;
	for (let i = 0; i < days.length; i++) {
		openAcc += createdBuckets[i];
		openAcc -= closedBuckets[i];
		if (openAcc < 0) openAcc = 0;
		seriesOpen.push({ x: days[i].getTime(), y: openAcc });
	}

	// KPIs
	const kpi_created = createdInRange.length;
	const kpi_closed = closedInRange.length;

	const kpi_openEnd = await prisma.report.count({
		where: {
			organization: { slug: organizationSlug },
			createdAt: { lte: to },
			OR: [{ closedAt: null }, { closedAt: { gt: to } }]
		}
	});

	let kpi_sla = 0;
	if (createdWithClose.length > 0) {
		const within72h = createdWithClose.filter((r) => {
			const ms = new Date(r.closedAt as Date).getTime() - new Date(r.createdAt).getTime();
			return ms <= 72 * 60 * 60 * 1000;
		}).length;
		kpi_sla = Math.round((within72h / createdWithClose.length) * 100);
	}

	const openAtEnd = await prisma.report.findMany({
		where: {
			organization: { slug: organizationSlug },
			createdAt: { lte: to },
			OR: [{ closedAt: null }, { closedAt: { gt: to } }],
			NOT: { status: 'COMPLETED' }
		},
		select: { status: true }
	});

	const counts = { PENDING: 0, IN_PROGRESS: 0, SCHEDULED: 0 };
	for (const r of openAtEnd) {
		if (r.status === 'PENDING' || r.status === 'IN_PROGRESS' || r.status === 'SCHEDULED') {
			counts[r.status]++;
		}
	}
	const sum = counts.PENDING + counts.IN_PROGRESS + counts.SCHEDULED;
	const split =
		sum > 0
			? {
					pending: Math.round((counts.PENDING / sum) * 100),
					inProgress: Math.round((counts.IN_PROGRESS / sum) * 100),
					scheduled:
						100 -
						Math.round((counts.PENDING / sum) * 100) -
						Math.round((counts.IN_PROGRESS / sum) * 100)
				}
			: { pending: 0, inProgress: 0, scheduled: 0 };

	return {
		organizationData,
		dashboard: {
			from: startOfDay(from).toISOString().slice(0, 10),
			to: startOfDay(to).toISOString().slice(0, 10),
			seriesOpen,
			kpis: {
				created: kpi_created,
				closed: kpi_closed,
				openEnd: kpi_openEnd,
				sla: kpi_sla
			},
			split
		}
	};
}) satisfies PageServerLoad;
