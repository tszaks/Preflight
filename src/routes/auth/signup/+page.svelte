<script lang="ts">
    import { enhance } from "$app/forms";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let error = $state("");
    let success = $state("");
    let showPassword = $state(false);
</script>

<main class="auth-page">
    <div class="auth-container">
        <div class="auth-header">
            <a href="/" class="auth-logo">
                <img
                    src="/preflight_logo.png"
                    alt="PreFlight"
                    class="logo-img"
                />
            </a>
            <h1>Create account</h1>
            <p>Start catching rejections before Apple does.</p>
        </div>

        <form
            method="POST"
            action="?/signup"
            use:enhance={() => {
                loading = true;
                error = "";
                success = "";
                return async ({ result }) => {
                    loading = false;
                    if (result.type === "failure") {
                        error =
                            (result.data?.message as string) ??
                            "Something went wrong.";
                    } else if (result.type === "success") {
                        success =
                            (result.data?.message as string) ??
                            "Check your email to confirm.";
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
                        placeholder="Min 8 characters"
                        minlength="8"
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
                                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
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

            {#if success}
                <p class="success-msg">{success}</p>
            {/if}

            <button
                type="submit"
                class="btn btn-primary btn-lg btn-full"
                disabled={loading || !!success}
            >
                {loading ? "Creating account..." : "Create account"}
            </button>
        </form>

        <p class="auth-switch">
            Already have an account? <a href="/auth/login">Log in</a>
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
        margin-bottom: 32px;
    }

    .auth-logo {
        font-family: "Outfit", sans-serif;
        font-size: 18px;
        font-weight: 700;
        display: block;
        margin-bottom: 24px;
    }

    .dot {
        color: var(--accent);
        font-weight: 800;
    }

    h1 {
        font-size: 24px;
        margin-bottom: 6px;
    }

    .auth-header p {
        font-size: 14px;
        color: var(--gray-300);
    }

    .logo-img {
        height: 42px;
        width: auto;
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

    .success-msg {
        font-size: 13px;
        color: var(--status-complete-fg);
        margin-bottom: 16px;
        padding: 10px 14px;
        background: var(--status-complete-bg);
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
