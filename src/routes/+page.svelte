<script lang="ts">
    import { onMount } from "svelte";
    import { enhance } from "$app/forms";

    let visible = $state(false);
    let submitted = $state(false);
    let error = $state("");
    let loading = $state(false);

    onMount(() => setTimeout(() => (visible = true), 100));
</script>

<main>
    <section class="hero">
        <div class="container hero-content" class:visible>
            <h1>PreFlight</h1>
            <p class="subtitle">Know what Apple will say before you submit.</p>
            <p class="description">AI-powered App Store review simulation. Catch rejections before they happen.</p>

            {#if submitted}
                <div class="success-msg">
                    <span class="success-icon">✓</span>
                    <p>You're on the list. We'll notify you at launch.</p>
                </div>
            {:else}
                <form
                    method="POST"
                    action="?/joinWaitlist"
                    use:enhance={() => {
                        loading = true;
                        error = "";
                        return async ({ result }) => {
                            loading = false;
                            if (result.type === "success") {
                                submitted = true;
                            } else if (result.type === "failure") {
                                error = (result.data?.message as string) ?? "Something went wrong.";
                            }
                        };
                    }}
                    class="waitlist-form"
                >
                    <div class="input-row">
                        <input
                            type="email"
                            name="email"
                            class="input"
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                        />
                        <button type="submit" class="btn btn-primary" disabled={loading}>
                            {loading ? "Joining..." : "Join Waitlist"}
                        </button>
                    </div>
                    {#if error}
                        <p class="error-msg">{error}</p>
                    {/if}
                </form>
            {/if}
        </div>
    </section>

    <section class="features">
        <div class="container">
            <h2>What we check</h2>
            <ul class="feature-list">
                <li>Metadata & keywords</li>
                <li>Screenshots & previews</li>
                <li>Privacy manifest</li>
                <li>Info.plist compliance</li>
                <li>Content policy</li>
                <li>URL reachability</li>
            </ul>
        </div>
    </section>

    <section class="pricing">
        <div class="container">
            <h2>Pricing</h2>
            <div class="pricing-grid">
                <div class="card pricing-card">
                    <h3>Quick Review</h3>
                    <p class="price">$29</p>
                    <p class="text-muted">Metadata + screenshots</p>
                    <span class="btn btn-secondary btn-disabled">Coming Soon</span>
                </div>
                <div class="card pricing-card featured">
                    <h3>Full Review</h3>
                    <p class="price">$49</p>
                    <p class="text-muted">+ Privacy manifest deep check</p>
                    <span class="btn btn-primary btn-disabled">Coming Soon</span>
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="container text-center">
            <p class="text-subtle">&copy; 2026 PreFlight</p>
        </div>
    </footer>
</main>

<style>
    .hero {
        min-height: 80vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 140px 24px 80px;
    }

    .hero-content {
        max-width: 600px;
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.8s var(--ease);
    }

    .hero-content.visible {
        opacity: 1;
        transform: translateY(0);
    }

    .hero h1 {
        font-size: clamp(3rem, 10vw, 5rem);
        margin-bottom: 1rem;
    }

    .subtitle {
        font-size: 1.25rem;
        color: var(--gray-300);
        margin-bottom: 0.75rem;
    }

    .description {
        font-size: 1rem;
        color: var(--gray-500);
        margin-bottom: 2.5rem;
    }

    .waitlist-form {
        max-width: 440px;
        margin: 0 auto;
    }

    .input-row {
        display: flex;
        gap: 0.75rem;
    }

    .input-row .input {
        flex: 1;
    }

    .input-row .btn {
        white-space: nowrap;
        flex-shrink: 0;
    }

    .error-msg {
        color: #ef4444;
        font-size: 0.85rem;
        margin-top: 0.75rem;
    }

    .success-msg {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1.25rem 2rem;
        background: rgba(34, 197, 94, 0.08);
        border: 1px solid rgba(34, 197, 94, 0.2);
        border-radius: 10px;
    }

    .success-icon {
        font-size: 1.25rem;
        color: #22c55e;
        font-weight: 700;
    }

    .success-msg p {
        color: var(--gray-100);
        font-size: 1rem;
    }

    .features,
    .pricing {
        padding: 80px 0;
    }

    .features h2,
    .pricing h2 {
        font-size: 1rem;
        font-weight: 500;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--gray-500);
        margin-bottom: 1.5rem;
    }

    .feature-list {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem 2.5rem;
    }

    .feature-list li {
        font-size: 1.1rem;
        color: var(--gray-100);
    }

    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        max-width: 600px;
    }

    .pricing-card {
        text-align: center;
    }

    .pricing-card h3 {
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--gray-300);
        margin-bottom: 0.5rem;
    }

    .price {
        font-family: "Outfit", sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }

    .pricing-card .btn {
        margin-top: 1.5rem;
        width: 100%;
    }

    .pricing-card.featured {
        border-color: var(--accent);
        background: rgba(212, 168, 83, 0.05);
    }

    .btn-disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }

    footer {
        padding: 3rem 0;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    @media (max-width: 500px) {
        .input-row {
            flex-direction: column;
        }
    }
</style>
