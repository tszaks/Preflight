<script lang="ts">
    import { enhance } from "$app/forms";
    import CockpitPanel from "$lib/components/CockpitPanel.svelte";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let error = $state("");
    let showPassword = $state(false);
</script>

<main class="auth-page">
    <div class="auth-container">
        <div class="auth-header">
            <div class="section-label">ACCESS_PROTOCOL // V2.1</div>
            <h1>Pilot Authorization</h1>
            <p class="step-meta">SEQ_AUTH_REQUEST // PING_PENDING</p>
        </div>

        <CockpitPanel class="auth-panel">
            <div class="panel-header">
                <span class="panel-id">SECURE_LINK_INIT</span>
                <h2>Establishing Connection</h2>
            </div>

            <form
                method="POST"
                action="?/login"
                use:enhance={() => {
                    loading = true;
                    error = "";
                    return async ({ result }) => {
                        loading = false;
                        if (result.type === "failure") {
                            error =
                                (result.data?.message as string) ??
                                "Invalid email or password.";
                        } else if (result.type === "redirect") {
                            window.location.href = result.location;
                        }
                    };
                }}
                class="auth-form"
            >
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
                            aria-label={showPassword
                                ? "Hide password"
                                : "Show password"}
                            tabindex="-1"
                        >
                            {#if showPassword}
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path
                                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                                    />
                                    <path
                                        d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                                    />
                                    <path
                                        d="M14.12 14.12a3 3 0 1 1-4.24-4.24"
                                    />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            {:else}
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path
                                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                                    />
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
                    {loading ? "INITIALIZING_LINK..." : "AUTHORIZE_ACCESS"}
                </button>
            </form>
        </CockpitPanel>

        <p class="auth-switch">
            Don't have an account? <a href="/auth/signup">Sign up</a>
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
        max-width: 360px;
    }

    .auth-header {
        margin-bottom: 2.5rem;
        text-align: center;
    }

    .auth-header h1 {
        font-family: "Outfit", sans-serif;
        font-size: 2.2rem;
        font-weight: 800;
        margin-top: 8px;
        letter-spacing: -0.02em;
        color: var(--gray-100);
    }

    .step-meta {
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--gray-600);
        letter-spacing: 0.1em;
        margin-top: 4px;
        text-transform: uppercase;
    }

    .auth-panel {
        padding: 32px !important;
    }

    .panel-header {
        margin-bottom: 2rem;
    }

    .panel-id {
        font-family: "Instrument Mono", monospace;
        font-size: 0.55rem;
        font-weight: 700;
        color: var(--gray-600);
        letter-spacing: 0.15em;
        text-transform: uppercase;
        display: block;
        margin-bottom: 4px;
    }

    .auth-panel h2 {
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--gray-100);
    }

    .auth-form {
        margin-bottom: 24px;
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
        font-size: 13px;
        color: var(--status-failed-fg);
        margin-bottom: 16px;
        padding: 10px 14px;
        background: var(--status-failed-bg);
        border-radius: var(--radius-md);
    }

    .btn-full {
        width: 100%;
        margin-top: 8px;
    }

    .auth-switch {
        font-size: 13px;
        color: var(--gray-500);
        text-align: center;
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
