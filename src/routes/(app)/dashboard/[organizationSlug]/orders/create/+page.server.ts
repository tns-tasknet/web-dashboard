import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
    return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async (event) => {
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

        await prisma.report.create({
            data: {
                title: data.get('title')!.toString(),
                content: data.get('content')!.toString(),

                organization: {
                    connect: {
                        slug: event.params.organizationSlug
                    }
                }
            }
        });
        return {};
    }
};
