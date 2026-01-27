<script lang="ts">
    import { enhance } from "$app/forms";
    import { page } from "$app/stores";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let error = $state("");
    let showPassword = $state(false);

    // Check if coming from pricing page
    const nextUrl = $page.url.searchParams.get('next');
    const selectedPlan = $page.url.searchParams.get('plan');
    const isFromPricing = nextUrl?.includes('/pricing');

    const planNames: Record<string, string> = {
        starter: 'Starter',
        pro: 'Pro',
        agency: 'Agency'
    };
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet">
</svelte:head>

<main class="auth-page">
    <div class="auth-container">
        <div class="auth-header">
            <h1>Welcome back</h1>
            {#if isFromPricing && selectedPlan}
                <p class="context-msg">
                    Log in to purchase the <strong>{planNames[selectedPlan] || selectedPlan}</strong> plan
                </p>
            {:else}
                <p class="subtitle">Log in to your Preflight account</p>
            {/if}
        </div>

        <div class="auth-card">
            <form
                method="POST"
                action="?/login"
                use:enhance={() => {
                    loading = true;
                    error = "";
                    return async ({ result }) => {
                        loading = false;
                        if (result.type === "failure") {
                            error = (result.data?.message as string) ?? "Invalid email or password.";
                        } else if (result.type === "redirect") {
                            window.location.href = result.location;
                        }
                    };
                }}
                class="auth-form"
            >
                {#if nextUrl}
                    <input type="hidden" name="next" value={nextUrl} />
                {/if}
                {#if selectedPlan}
                    <input type="hidden" name="plan" value={selectedPlan} />
                {/if}

                <div class="form-group">
                    <label for="email" class="form-label">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        class="input"
                        bind:value={email}
                        placeholder="you@example.com"
                        required
                        disabled={loading}
                    />
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <div class="input-wrapper">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            class="input input-password"
                            bind:value={password}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            class="eye-toggle"
                            onclick={() => (showPassword = !showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            tabindex="-1"
                        >
                            {#if showPassword}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            {:else}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            {/if}
                        </button>
                    </div>
                </div>

                {#if error}
                    <p class="error-msg">{error}</p>
                {/if}

                <button
                    type="submit"
                    class="btn btn-primary btn-full"
                    disabled={loading}
                >
                    {loading ? "Logging in..." : "Log In"}
                </button>
            </form>
        </div>

        <p class="auth-switch">
            Don't have an account? <a href="/auth/signup{nextUrl ? `?next=${nextUrl}` : ''}{selectedPlan ? `&plan=${selectedPlan}` : ''}">Sign up</a>
        </p>
    </div>
</main>

<style>
    .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
    }

    .auth-container {
        width: 100%;
        max-width: 380px;
    }

    .auth-header {
        margin-bottom: 32px;
        text-align: center;
    }

    .auth-header h1 {
        font-family: 'Fraunces', serif;
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--fg);
        margin-bottom: 8px;
    }

    .subtitle {
        font-size: 0.95rem;
        color: var(--gray-400);
    }

    .context-msg {
        font-size: 0.95rem;
        color: var(--gray-300);
    }

    .context-msg strong {
        color: var(--accent);
    }

    .auth-card {
        background: var(--surface-2);
        border: 1px solid var(--border-default);
        border-radius: 16px;
        padding: 32px;
    }

    .auth-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-group {
        margin: 0;
    }

    .form-label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--gray-300);
        margin-bottom: 8px;
    }

    .input-wrapper {
        position: relative;
    }

    .input-password {
        padding-right: 44px;
    }

    .eye-toggle {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--gray-500);
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color var(--duration-fast);
    }

    .eye-toggle:hover {
        color: var(--gray-300);
    }

    .error-msg {
        font-size: 0.9rem;
        color: var(--status-failed-fg);
        padding: 12px 14px;
        background: var(--status-failed-bg);
        border-radius: 10px;
        margin: 0;
    }

    .btn-full {
        width: 100%;
    }

    .auth-switch {
        font-size: 0.9rem;
        color: var(--gray-500);
        text-align: center;
        margin-top: 24px;
    }

    .auth-switch a {
        color: var(--accent);
        font-weight: 500;
        transition: color var(--duration-fast);
    }

    .auth-switch a:hover {
        color: var(--accent-hover);
    }
</style>
