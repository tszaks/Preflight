<script lang="ts">
	import "../app.css";
	import { invalidate } from "$app/navigation";
	import { onMount } from "svelte";
	import { page } from "$app/stores";

	let { data, children } = $props();
	let scrolled = $state(false);

	onMount(() => {
		const {
			data: { subscription },
		} = data.supabase.auth.onAuthStateChange(() => {
			invalidate("supabase:auth");
		});

		function handleScroll() {
			scrolled = window.scrollY > 20;
		}
		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			subscription.unsubscribe();
			window.removeEventListener('scroll', handleScroll);
		};
	});

	let userInitial = $derived(
		data.user?.email ? data.user.email[0].toUpperCase() : '?'
	);

	let isAuthPage = $derived(
		$page.url.pathname.startsWith('/auth')
	);

	let isLandingPage = $derived(
		$page.url.pathname === '/'
	);
</script>

<svelte:head>
	<title>PreFlight</title>
	<meta name="description" content="AI-powered App Store review simulation." />
</svelte:head>

{#if !isAuthPage}
<nav class="nav" class:scrolled>
	<div class="container nav-content">
		<a href="/" class="logo">
			<img src="/preflight_logo.png" alt="Preflight" class="logo-img" />
		</a>

		{#if !isLandingPage}
		<div class="nav-right">
			{#if data.user}
				<a href="/dashboard" class="nav-link" class:active={$page.url.pathname === '/dashboard'}>Dashboard</a>
				<div class="avatar" title={data.user.email}>
					{userInitial}
				</div>
				<form action="/auth/logout" method="POST">
					<button type="submit" class="nav-logout">Log out</button>
				</form>
			{:else}
				<a href="/auth/login" class="btn btn-primary">Log in</a>
			{/if}
		</div>
		{/if}
	</div>
</nav>
{/if}

<div class="app-shell" class:no-nav={isAuthPage}>
	{@render children()}
</div>

<style>
	.nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		height: 100px;
		display: flex;
		align-items: center;
		background: rgba(8, 8, 10, 0.92);
		backdrop-filter: blur(20px) saturate(1.2);
		-webkit-backdrop-filter: blur(20px) saturate(1.2);
		border-bottom: 1px solid var(--border-default);
		transition: box-shadow var(--duration-normal) var(--ease-out);
	}

	.nav.scrolled {
		box-shadow: 0 1px 0 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3);
	}

	.nav-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.logo {
		display: flex;
		align-items: center;
	}

	.logo-img {
		height: 84px;
		width: auto;
	}

	.nav-right {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.nav-link {
		font-size: 13px;
		font-weight: 500;
		color: var(--gray-300);
		transition: color var(--duration-fast) var(--ease-out);
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;
	}

	.nav-link:hover {
		color: var(--fg);
	}

	.nav-link.active {
		color: var(--fg);
		border-bottom-color: var(--accent);
	}

	.avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--accent-subtle);
		border: 1px solid var(--accent-glow);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Outfit', sans-serif;
		font-size: 12px;
		font-weight: 600;
		color: var(--accent);
		transition: border-color var(--duration-fast) var(--ease-out);
	}

	.avatar:hover {
		border-color: var(--accent);
	}

	.nav-logout {
		background: none;
		border: none;
		font-family: 'Instrument Sans', sans-serif;
		font-size: 13px;
		color: var(--gray-500);
		cursor: pointer;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.nav-logout:hover {
		color: var(--gray-300);
	}

	.app-shell {
		padding-top: 100px;
		min-height: 100vh;
	}

	.app-shell.no-nav {
		padding-top: 0;
	}
</style>
