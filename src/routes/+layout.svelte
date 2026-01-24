<script lang="ts">
	import "../app.css";
	import { invalidate } from "$app/navigation";
	import { onMount } from "svelte";

	let { data, children } = $props();

	onMount(() => {
		const {
			data: { subscription },
		} = data.supabase.auth.onAuthStateChange(() => {
			invalidate("supabase:auth");
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<title>PreFlight</title>
	<meta
		name="description"
		content="Catch common App Store issues before you submit."
	/>
</svelte:head>

<!-- Nav -->
<nav class="nav">
	<div class="container nav-content">
		<a href="/" class="logo">PreFlight</a>

		<div class="nav-links">
			{#if data.user}
				<a href="/dashboard" class="nav-link">Dashboard</a>
				<form action="/auth/logout" method="POST">
					<button type="submit" class="nav-link btn-text"
						>Log out</button
					>
				</form>
			{:else}
				<a href="/login" class="nav-link">Log in</a>
				<a href="/signup" class="btn btn-primary btn-sm">Sign up</a>
			{/if}
		</div>
	</div>
</nav>

{@render children()}

<style>
	.nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		padding: 1rem 0;
		background: rgba(8, 8, 10, 0.8);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.nav-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-family: "Outfit", sans-serif;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.nav-link {
		font-size: 0.9rem;
		color: var(--gray-300);
		transition: color 0.2s;
	}

	.nav-link:hover {
		color: white;
	}

	.btn-text {
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
	}

	.btn-sm {
		padding: 10px 20px;
		font-size: 0.85rem;
	}
</style>
