import { auth } from '$lib/auth';
import { error, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load = (async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) redirect(307, '/login');

	const data = await auth.api.setActiveOrganization({
		body: {
			organizationSlug: event.params.organizationSlug
		},
		headers: event.request.headers
	});

	const member = await auth.api.getActiveMember({
		headers: event.request.headers
	});

	if (isNaN(Number(event.params.reportId))) error(400, 'Hello World');

	const report = await prisma.report.findFirst({
		where: {
			organization: {
				slug: event.params.organizationSlug
			},
			id: Number(event.params.reportId)
		},
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
				},
				orderBy: {
					createdAt: 'desc'
				}
			}
		}
	});

	if (member?.role !== 'owner' && report?.memberId !== member?.id) error(403, 'Forbidden');
	if (!report) error(404, 'Not found');

	return {
		report
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async (event) => {
		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		if (!session) redirect(307, '/login');

		await auth.api.setActiveOrganization({
			body: {
				organizationSlug: event.params.organizationSlug
			},
			headers: event.request.headers
		});

		const member = await auth.api.getActiveMember({
			headers: event.request.headers
		});

		if (isNaN(Number(event.params.reportId))) error(400, 'Hello World');

		const report = await prisma.report.findFirst({
			where: {
				id: Number(event.params.reportId)
			}
		});

		if (!report) error(404);
		// TODO: Add form validation
		/*
		const form = await superValidate(event, formSchema);
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		*/
		const data = await event.request.formData();

		await prisma.message.create({
			data: {
				content: data.get('message')!.toString(),
				memberId: member!.id,
				reportId: report.id
			}
		});
		return {};
	}
};
