import { auth } from '$lib/auth';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) return new Response(null, { status: 401 });

	await auth.api.setActiveOrganization({
		body: {
			organizationSlug: event.params.organizationSlug
		},
		headers: event.request.headers
	});

	const { role } = await auth.api.getActiveMemberRole({
		// This endpoint requires session cookies.
		headers: event.request.headers
	});

	// Admin Role check
	if (role !== 'owner' && role !== 'admin') return new Response(null, { status: 403 });

	const options = event.url.searchParams.get('options');
	const name = event.url.searchParams.get('name');

	if (!options) {
		return new Response(null, {
			status: 400
		});
	}

	switch (options) {
		case 'name': {
			if (!name) {
				return new Response(null, {
					status: 400
				});
			}

			const users = await prisma.member.findMany({
				where: {
					organization: {
						slug: event.params.organizationSlug
					},
					user: {
						name: {
							contains: name
						}
					},
					role: 'member'
				},
				select: {
					id: true,
					role: true,
					user: {
						select: {
							name: true,
							email: true,
							image: true
						}
					}
				}
			});

			return json(users);
		}

		default: {
			const users = await prisma.member.findMany({
				where: {
					organization: {
						slug: event.params.organizationSlug
					},
					role: 'member'
				},
				select: {
					id: true,
					role: true,
					user: {
						select: {
							name: true,
							email: true,
							image: true
						}
					}
				}
			});

			return json(users);
		}
	}
};
