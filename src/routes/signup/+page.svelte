<script lang="ts">
    import { enhance } from "$app/forms";

    let { form } = $props();
    let loading = $state(false);
</script>

<main class="auth-page">
    <div class="auth-container">
        <h1>Sign up</h1>
        <p class="text-muted mb-4">Create your account</p>

        {#if form?.error}
            <div class="error-message mb-2">{form.error}</div>
        {/if}

        {#if form?.success}
            <div class="success-message mb-2">
                Check your email for a confirmation link.
            </div>
        {:else}
            <form
                method="POST"
                use:enhance={() => {
                    loading = true;
                    return async ({ update }) => {
                        loading = false;
                        await update();
                    };
                }}
            >
                <div class="form-group">
                    <label for="email" class="form-label">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        class="input"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        class="input"
                        minlength="6"
                        required
                    />
                </div>

                <button
                    type="submit"
                    class="btn btn-primary full-width"
                    disabled={loading}
                >
                    {loading ? "Creating account..." : "Sign up"}
                </button>
            </form>

            <p class="text-muted mt-4 text-center">
                Already have an account? <a href="/login" class="text-accent"
                    >Log in</a
                >
            </p>
        {/if}
    </div>
</main>

<style>
    .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 100px 24px;
    }

    .auth-container {
        width: 100%;
        max-width: 360px;
    }

    .auth-container h1 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    .full-width {
        width: 100%;
    }

    .error-message {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #f87171;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 0.9rem;
    }

    .success-message {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #4ade80;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 0.9rem;
    }
</style>
