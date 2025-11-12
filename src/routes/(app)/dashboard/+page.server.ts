import { auth } from '$lib/auth';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');

	const orgs = await prisma.organization.findMany({
		where: {
			slug: 'org1'
		}
	});

	if (!orgs) error(404, 'Create organization org1 first');

	await auth.api.setActiveOrganization({
		body: {
			organizationSlug: 'org1'
		},
		headers: event.request.headers
	});

	redirect(302, '/dashboard/org1');

	/*
		onclick={async () => {
		const { data, error } = await authClient.organization.create({
			name: orgName, // required
			slug: orgSlug, // required
			keepCurrentActiveOrganization: false
		});

        console.log("DATA")
        console.log(data)
        console.log("ERROR")
        console.log(error)
	}}
	*/

	/*
	await auth.api.addMember({
		body: {
			userId: event.url.searchParams.get('userId')!,
			role: ['member'],
			organizationId: event.url.searchParams.get('organizationId')!
		}
	});
	*/

	return {};
}) satisfies PageServerLoad;
