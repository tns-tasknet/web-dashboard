import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/auth';
import { prisma } from '$lib/server/prisma';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');
	if (session.user.role !== 'admin') return error(403, 'No permission');

	await prisma.report.create({
		data: {
			title: 'Title2',
			content: 'Content2',
			organizationId: event.url.searchParams.get('organizationId')!
		}
	});

	return {};
}) satisfies PageServerLoad;
