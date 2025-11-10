import { auth } from '$lib/auth';
import { prisma } from '$lib/server/prisma';
import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');

	const { organizationSlug } = event.params;

	const organization = await prisma.organization.findUnique({
		where: { slug: organizationSlug },
		select: { id: true, name: true, slug: true, logo: true }
	});

	if (!organization) {
		error(404, 'Organización no encontrada');
	}

	return {
		session,
		organization
	};
}) satisfies LayoutServerLoad;
