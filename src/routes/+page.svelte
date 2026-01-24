<script lang="ts">
    import { onMount } from "svelte";

    let visible = $state(false);
    onMount(() => setTimeout(() => (visible = true), 100));
</script>

<main>
    <section class="hero">
        <div class="container hero-content" class:visible>
            <h1>PreFlight</h1>
            <p class="subtitle">Know what Apple will say before you submit.</p>
            <div class="cta">
                <a href="/signup" class="btn btn-primary">Get Started</a>
            </div>
        </div>
    </section>

    <section class="features">
        <div class="container">
            <h2>What we check</h2>
            <ul class="feature-list">
                <li>Metadata & keywords</li>
                <li>Screenshots & previews</li>
                <li>Privacy manifest</li>
                <li>Binary compliance</li>
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
                    <a href="/signup" class="btn btn-secondary">Get Started</a>
                </div>
                <div class="card pricing-card featured">
                    <h3>Full Review</h3>
                    <p class="price">$49</p>
                    <p class="text-muted">+ Privacy manifest deep check</p>
                    <a href="/signup" class="btn btn-primary">Get Started</a>
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="container text-center">
            <p class="text-subtle">© 2026 PreFlight</p>
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
        margin-bottom: 2.5rem;
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

    footer {
        padding: 3rem 0;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }
</style>
