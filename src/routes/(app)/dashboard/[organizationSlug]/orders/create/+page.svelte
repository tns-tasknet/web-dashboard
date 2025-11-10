<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';

	let { data, form } = $props<{
		data: PageProps['data'];
		form?: {
			message?: string;
			values?: {
				title?: string;
				content?: string;
				assigneeId?: string | null;
			};
		};
	}>();
</script>

<h1 class="mb-4 text-2xl font-semibold">Crear orden</h1>

<form method="POST" class="max-w-3xl space-y-5">
	{#if form?.message}
		<div class="alert alert-warning">{form.message}</div>
	{/if}

	<div class="form-control">
		<label class="label" for="title"><span class="label-text">Título</span></label>
		<input
			id="title"
			name="title"
			type="text"
			class="input-bordered input w-full"
			placeholder="Ingresa un título descriptivo"
			value={form?.values?.title ?? ''}
			required
		/>
	</div>

	<div class="form-control">
		<label class="label" for="content"><span class="label-text">Descripción</span></label>
		<textarea
			id="content"
			name="content"
			class="textarea-bordered textarea min-h-[12rem] w-full"
			placeholder="Describe el trabajo a realizar, ubicación, materiales, observaciones…"
			required>{form?.values?.content ?? ''}</textarea
		>
	</div>

	<div class="form-control">
		<label class="label" for="assigneeId"
			><span class="label-text">Técnico asignado</span></label
		>
		<select id="assigneeId" name="assigneeId" class="select-bordered select w-full">
			<option value="" selected={!form?.values?.assigneeId}>— Sin asignar —</option>
			{#each data.technicians as m}
				<option value={m.id} selected={form?.values?.assigneeId === m.id}>
					{m.user?.name ?? m.user?.email ?? 'Sin nombre'}
				</option>
			{/each}
		</select>
	</div>

	<div class="flex items-center justify-end gap-2">
		<a class="btn btn-ghost" href={`/dashboard/${page.params.organizationSlug}/orders`}
			>Cancelar</a
		>
		<button type="submit" class="btn btn-primary">Crear orden</button>
	</div>
</form>
