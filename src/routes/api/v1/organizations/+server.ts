import { auth } from '$lib/auth';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) return new Response(null, { status: 401 });

	const organizations = await auth.api.listOrganizations({
		// This endpoint requires session cookies.
		headers: event.request.headers
	});

	return json(organizations);
};
