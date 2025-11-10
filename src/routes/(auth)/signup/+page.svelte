<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/client';

	const session = authClient.useSession();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirm = $state('');

	let showPassword = $state(false);
	let showConfirm = $state(false);
	let loading = $state(false);
	let submitting = $state(false);
	let capsOn = $state(false);

	let errorMsg = $state<string | null>(null);
	let nameErr = $state<string | null>(null);
	let emailErr = $state<string | null>(null);
	let passwordErr = $state<string | null>(null);
	let confirmErr = $state<string | null>(null);

	function validateName(v: string) {
		if (!v.trim()) return 'Ingresa tu nombre.';
		return null;
	}
	function validateEmail(v: string) {
		if (!v.trim()) return 'Ingresa tu correo.';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Correo no válido.';
		return null;
	}
	function validatePassword(v: string) {
		if (!v) return 'Ingresa tu contraseña.';
		if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
		return null;
	}
	function validateConfirm(p: string, c: string) {
		if (!c) return 'Confirma tu contraseña.';
		if (p !== c) return 'Las contraseñas no coinciden.';
		return null;
	}
	function validateAll(): boolean {
		nameErr = validateName(name);
		emailErr = validateEmail(email);
		passwordErr = validatePassword(password);
		confirmErr = validateConfirm(password, confirm);
		errorMsg =
			nameErr || emailErr || passwordErr || confirmErr ? 'Revisa los campos marcados.' : null;
		return !nameErr && !emailErr && !passwordErr && !confirmErr;
	}

	function onNameBlur() {
		nameErr = validateName(name);
	}
	function onEmailBlur() {
		emailErr = validateEmail(email);
	}
	function onPasswordBlur() {
		passwordErr = validatePassword(password);
		confirmErr = validateConfirm(password, confirm);
	}
	function onConfirmBlur() {
		confirmErr = validateConfirm(password, confirm);
	}
	function onPasswordKey(e: KeyboardEvent) {
		capsOn = e.getModifierState?.('CapsLock') ?? false;
	}

	async function onSubmit(e: Event) {
		e.preventDefault();
		if (submitting) return;
		if (!validateAll()) return;

		try {
			loading = true;
			submitting = true;

			const res = await authClient.signUp.email({
				name: name.trim(),
				email: email.trim(),
				password
			});
			if (res?.error) {
				errorMsg = res.error.message ?? 'No se pudo crear la cuenta.';
				return;
			}
			await goto('/dashboard', { replaceState: true });
		} catch (err: any) {
			errorMsg = err?.message ?? 'Ocurrió un error al registrarte.';
		} finally {
			loading = false;
			submitting = false;
		}
	}

	async function onSignOut() {
		await authClient.signOut();
	}

	const ids = {
		formErr: 'form-error',
		name: 'name-input',
		nameHelp: 'name-help',
		email: 'email-input',
		emailHelp: 'email-help',
		pass: 'password-input',
		passHelp: 'password-help',
		caps: 'caps-warning',
		confirm: 'confirm-input',
		confirmHelp: 'confirm-help'
	};

	export function autofocus(node: HTMLInputElement) {
		queueMicrotask(() => node?.focus());
		return { destroy() {} };
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200 px-4">
	{#if $session?.data}
		<div class="card w-full max-w-md bg-base-100 shadow">
			<div class="card-body gap-4">
				<h2 class="card-title">Sesión activa</h2>
				<p class="text-sm opacity-80">
					<strong>Usuario:</strong>
					{$session.data.user.name ?? $session.data.user.email}
				</p>
				<div class="card-actions justify-end">
					<button class="btn" onclick={() => goto('/dashboard')}>Ir al Dashboard</button>
					<button class="btn btn-outline" onclick={onSignOut}>Cerrar sesión</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="card w-full max-w-md bg-base-100 shadow-xl">
			<form class="card-body gap-5" onsubmit={onSubmit} autocomplete="on" novalidate>
				<div class="text-center">
					<h1 class="text-2xl font-bold">Crear cuenta</h1>
					<p class="text-sm opacity-70">Regístrate para usar TaskNet</p>
				</div>

				{#if errorMsg}
					<div
						id={ids.formErr}
						class="alert alert-error"
						role="alert"
						aria-live="assertive"
					>
						<span>{errorMsg}</span>
					</div>
				{/if}

				<div class="form-control">
					<div class="label">
						<span class="label-text">Nombre de usuario</span>
						{#if nameErr}<span class="label-text-alt text-error">{nameErr}</span>{/if}
					</div>
					<label
						class="input-bordered input w-full {nameErr
							? 'input-error'
							: ''} flex items-center gap-2"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.5 20.25a8.25 8.25 0 0 1 15 0"
							/>
						</svg>
						<input
							id={ids.name}
							class="grow"
							type="text"
							placeholder="Nombre Apellido"
							bind:value={name}
							autocomplete="name"
							required
							disabled={loading}
							onblur={onNameBlur}
							use:autofocus
						/>
					</label>
					<div id={ids.nameHelp} class="label">
						<span class="label-text-alt opacity-70"
							>Tu nombre tal como será visible para tu equipo.</span
						>
					</div>
				</div>

				<div class="form-control">
					<div class="label">
						<span class="label-text">Correo</span>
						{#if emailErr}<span class="label-text-alt text-error">{emailErr}</span>{/if}
					</div>
					<label
						class="input-bordered input w-full {emailErr
							? 'input-error'
							: ''} flex items-center gap-2"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M21.75 7.5v9A2.25 2.25 0 0 1 19.5 18.75H4.5A2.25 2.25 0 0 1 2.25 16.5v-9m19.5 0l-9 6-9-6"
							/>
						</svg>
						<input
							id={ids.email}
							type="email"
							class="grow"
							placeholder="nombre@empresa.com"
							bind:value={email}
							autocomplete="email"
							required
							disabled={loading}
							aria-invalid={!!emailErr}
							aria-describedby={ids.emailHelp}
							onblur={onEmailBlur}
						/>
					</label>
					<div id={ids.emailHelp} class="label">
						<span class="label-text-alt opacity-70">Usa tu correo corporativo.</span>
					</div>
				</div>

				<div class="form-control">
					<div class="label">
						<span class="label-text">Contraseña</span>
						{#if passwordErr}<span class="label-text-alt text-error">{passwordErr}</span
							>{/if}
					</div>
					<label
						class="input-bordered input w-full {passwordErr
							? 'input-error'
							: ''} flex items-center gap-2"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M16.5 10.5V7.125a4.5 4.5 0 1 0-9 0V10.5m11.25 0H5.25A2.25 2.25 0 0 0 3 12.75v6A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75v-6A2.25 2.25 0 0 0 18.75 10.5z"
							/>
						</svg>
						<input
							id={ids.pass}
							class="grow"
							type={showPassword ? 'text' : 'password'}
							placeholder="••••••••"
							bind:value={password}
							autocomplete="new-password"
							required
							disabled={loading}
							aria-invalid={!!passwordErr}
							aria-describedby={`${ids.passHelp} ${capsOn ? ids.caps : ''}`}
							onblur={onPasswordBlur}
							onkeydown={onPasswordKey}
							onkeyup={onPasswordKey}
						/>
						<button
							type="button"
							class="btn btn-ghost btn-xs"
							title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
							aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
							onclick={() => (showPassword = !showPassword)}
							aria-controls={ids.pass}
							aria-pressed={showPassword}
							disabled={loading}
						>
							{#if showPassword}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M3 3l18 18M9.88 9.88A3 3 0 1 0 14.12 14.12M10.73 5.08A9.74 9.74 0 0 1 12 5c5.523 0 9.75 5.25 9.75 7s-4.227 7-9.75 7c-1.154 0-2.261-.21-3.292-.6M6.1 6.1A10.445 10.445 0 0 0 2.25 12c0 1.75 4.227 7 9.75 7 1.063 0 2.084-.17 3.044-.49"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M2.25 12c0 1.75 4.227 7 9.75 7s9.75-5.25 9.75-7-4.227-7-9.75-7-9.75 5.25-9.75 7z"
									/>
									<circle cx="12" cy="12" r="3" />
								</svg>
							{/if}
						</button>
					</label>
					<div class="label">
						<span id={ids.passHelp} class="label-text-alt opacity-70"
							>Mínimo 8 caracteres.</span
						>
						{#if capsOn}
							<span id={ids.caps} class="label-text-alt text-warning"
								>Bloqueo de mayúsculas activado</span
							>
						{/if}
					</div>
				</div>

				<div class="form-control">
					<div class="label">
						<span class="label-text">Confirmar contraseña</span>
						{#if confirmErr}<span class="label-text-alt text-error">{confirmErr}</span
							>{/if}
					</div>
					<label
						class="input-bordered input w-full {confirmErr
							? 'input-error'
							: ''} flex items-center gap-2"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M16.5 10.5V7.125a4.5 4.5 0 1 0-9 0V10.5m11.25 0H5.25A2.25 2.25 0 0 0 3 12.75v6A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75v-6A2.25 2.25 0 0 0 18.75 10.5z"
							/>
						</svg>
						<input
							id={ids.confirm}
							class="grow"
							type={showConfirm ? 'text' : 'password'}
							placeholder="••••••••"
							bind:value={confirm}
							autocomplete="new-password"
							required
							disabled={loading}
							aria-invalid={!!confirmErr}
							aria-describedby={ids.confirmHelp}
							onblur={onConfirmBlur}
						/>
						<button
							type="button"
							class="btn btn-ghost btn-xs"
							title={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
							aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
							onclick={() => (showConfirm = !showConfirm)}
							aria-controls={ids.confirm}
							aria-pressed={showConfirm}
							disabled={loading}
						>
							{#if showConfirm}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M3 3l18 18M9.88 9.88A3 3 0 1 0 14.12 14.12"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M2.25 12c0 1.75 4.227 7 9.75 7s9.75-5.25 9.75-7-4.227-7-9.75-7-9.75 5.25-9.75 7z"
									/>
									<circle cx="12" cy="12" r="3" />
								</svg>
							{/if}
						</button>
					</label>
					<div id={ids.confirmHelp} class="label">
						<span class="label-text-alt opacity-70"
							>Repite la contraseña para confirmar.</span
						>
					</div>
				</div>

				<button class="btn w-full btn-primary" type="submit" disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner"></span>
						Creando cuenta…
					{:else}
						Crear cuenta
					{/if}
				</button>

				<div class="flex items-center justify-between text-sm">
					<a class="link link-hover opacity-80" href="/login"
						>¿Ya tienes cuenta? Inicia sesión</a
					>
				</div>
			</form>
		</div>
	{/if}
</div>
