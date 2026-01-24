<script lang="ts">
    import { enhance } from "$app/forms";

    let { form } = $props();
    let loading = $state(false);
</script>

<main class="auth-page">
    <div class="auth-container">
        <h1>Log in</h1>
        <p class="text-muted mb-4">Welcome back</p>

        {#if form?.error}
            <div class="error-message mb-2">{form.error}</div>
        {/if}

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
                    required
                />
            </div>

            <button
                type="submit"
                class="btn btn-primary full-width"
                disabled={loading}
            >
                {loading ? "Logging in..." : "Log in"}
            </button>
        </form>

        <p class="text-muted mt-4 text-center">
            Don't have an account? <a href="/signup" class="text-accent"
                >Sign up</a
            >
        </p>
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
</style>
