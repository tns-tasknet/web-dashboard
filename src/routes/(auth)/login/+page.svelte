<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/client';

	const session = authClient.useSession();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let capsOn = $state(false);

	let errorMsg = $state<string | null>(null);
	let emailErr = $state<string | null>(null);
	let passwordErr = $state<string | null>(null);
	let submitting = $state(false);

	function validateEmail(v: string): string | null {
		if (!v.trim()) return 'Ingresa tu correo.';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Correo inválido.';
		return null;
	}
	function validatePassword(v: string): string | null {
		if (!v) return 'Ingresa tu contraseña.';
		return null;
	}
	function validateAll(): boolean {
		emailErr = validateEmail(email);
		passwordErr = validatePassword(password);
		errorMsg = emailErr || passwordErr ? 'Revisa los campos marcados.' : null;
		return !emailErr && !passwordErr;
	}

	async function onSubmit(e: Event) {
		e.preventDefault();
		errorMsg = null;
		if (submitting) return;
		if (!validateAll()) return;

		try {
			loading = true;
			submitting = true;
			const res = await authClient.signIn.email({ email: email.trim(), password });
			if (res?.error) {
				errorMsg = res.error.message ?? 'Credenciales inválidas.';
				return;
			}
			await goto('/dashboard', { replaceState: true });
		} catch (err: any) {
			errorMsg = err?.message ?? 'No se pudo iniciar sesión. Inténtalo nuevamente.';
		} finally {
			loading = false;
			submitting = false;
		}
	}

	function onEmailBlur() {
		emailErr = validateEmail(email);
	}

	function onPasswordBlur() {
		passwordErr = validatePassword(password);
	}
	
	function onPasswordKey(e: KeyboardEvent) {
		capsOn = e.getModifierState?.('CapsLock') ?? false;
	}

	async function onSignOut() {
		await authClient.signOut();
	}

	const ids = {
		email: 'email-input',
		emailHelp: 'email-help',
		pass: 'password-input',
		passHelp: 'password-help',
		formErr: 'form-error',
		caps: 'caps-warning'
	};

	export function autofocus(node: HTMLInputElement) {
		queueMicrotask(() => node?.focus());
		return { destroy() {} };
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200 px-4">
	{#if $session === undefined}
		<div class="card w-full max-w-md bg-base-100 shadow">
			<div class="card-body gap-4">
				<div class="skeleton h-6 w-40"></div>
				<div class="skeleton h-4 w-56"></div>
				<div class="skeleton h-10 w-full"></div>
			</div>
		</div>

	{:else if $session?.data}
		<div class="card w-full max-w-md bg-base-100 shadow">
			<div class="card-body gap-4">
				<h2 class="card-title">Sesión activa</h2>
				<p class="text-sm opacity-80">
					<strong>Usuario:</strong> {$session.data.user.name ?? $session.data.user.email}
				</p>
				<div class="card-actions justify-end">
					<button class="btn" onclick={() => goto('/dashboard')}>Ir al dashboard</button>
					<button class="btn btn-outline" onclick={onSignOut}>Cerrar sesión</button>
				</div>
			</div>
		</div>

	{:else}
		<div class="card w-full max-w-md bg-base-100 shadow-xl">
			<form class="card-body gap-5" onsubmit={onSubmit} autocomplete="on" novalidate>
				<div class="text-center">
					<h1 class="text-2xl font-bold">Iniciar sesión</h1>
					<p class="text-sm opacity-70">Accede con tu cuenta de TaskNet</p>
				</div>

				{#if errorMsg}
					<div id={ids.formErr} class="alert alert-error" role="alert" aria-live="assertive">
						<span>{errorMsg}</span>
					</div>
				{/if}

				<div class="form-control">
					<div class="label">
						<span class="label-text">Correo</span>
						{#if emailErr}<span class="label-text-alt text-error">{emailErr}</span>{/if}
					</div>

					<label class="input input-bordered w-full {emailErr ? 'input-error' : ''} flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 7.5v9a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 16.5v-9m19.5 0A2.25 2.25 0 0 0 19.5 5.25H4.5A2.25 2.25 0 0 0 2.25 7.5m19.5 0l-9 6-9-6"/>
						</svg>

						<input
							id={ids.email}
							type="email"
							class="grow"
							bind:value={email}
							autocomplete="email"
							required
							disabled={loading}
							aria-invalid={!!emailErr}
							aria-describedby={ids.emailHelp}
							onblur={onEmailBlur}
							use:autofocus
						/>
					</label>
				</div>

				<div class="form-control">
					<div class="label">
						<span class="label-text">Contraseña</span>
						{#if passwordErr}<span class="label-text-alt text-error">{passwordErr}</span>{/if}
					</div>

					<label class="input input-bordered w-full {passwordErr ? 'input-error' : ''} flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 10.5V7.125a4.5 4.5 0 1 0-9 0V10.5m11.25 0H5.25A2.25 2.25 0 0 0 3 12.75v6A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75v-6A2.25 2.25 0 0 0 18.75 10.5z"/>
						</svg>

						<input
							id={ids.pass}
							class="grow"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							autocomplete="current-password"
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
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3l18 18M9.88 9.88A3 3 0 1 0 14.12 14.12M10.73 5.08A9.74 9.74 0 0 1 12 5c5.523 0 9.75 5.25 9.75 7s-4.227 7-9.75 7c-1.154 0-2.261-.21-3.292-.6M6.1 6.1A10.445 10.445 0 0 0 2.25 12c0 1.75 4.227 7 9.75 7 1.063 0 2.084-.17 3.044-.49"/>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 12c0 1.75 4.227 7 9.75 7s9.75-5.25 9.75-7-4.227-7-9.75-7-9.75 5.25-9.75 7z"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
							{/if}
						</button>
					</label>

					<div class="label">
						{#if capsOn}
							<span id={ids.caps} class="label-text-alt text-warning">Bloqueo de mayúsculas activado</span>
						{/if}
					</div>
				</div>

				<button class="btn btn-primary w-full" type="submit" disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner"></span>
						Ingresando…
					{:else}
						Iniciar sesión
					{/if}
				</button>

				<div class="flex items-center justify-between text-sm">
					<div>
						<span class="opacity-70">¿No tienes cuenta?</span>
						<a class="link link-primary ml-1" href="/signup">Crear cuenta</a>
					</div>
				</div>
			</form>
		</div>
	{/if}
</div>
