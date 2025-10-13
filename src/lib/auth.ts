import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

import { PrismaClient } from '@prisma/client';
import { admin, organization } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';

const prisma = new PrismaClient();

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'postgresql'
	}),
	emailAndPassword: {
		enabled: true
	},
	trustedOrigins: [
		'http://localhost:8081',
		'http://localhost',
<<<<<<< HEAD
		'https://prod-tns-tasknet-usm.vercel.app'
=======
		'https://prod-tns-tasknet-usm.vercel.app',
        '*'
>>>>>>> d7a4b8f (cors fix)
	],
	plugins: [expo(), admin(), organization(), sveltekitCookies(getRequestEvent)]
});
