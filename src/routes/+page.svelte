<script lang="ts">
    import { onMount } from "svelte";
    import CockpitPanel from "$lib/components/CockpitPanel.svelte";

    let visible = $state(false);
    onMount(() => setTimeout(() => (visible = true), 100));

    const plans = [
        {
            id: "starter",
            name: "Starter",
            credits: 200,
            price: 49,
            description: "1 full review + 4 rechecks",
        },
        {
            id: "pro",
            name: "Pro",
            credits: 600,
            price: 99,
            description: "3 full reviews + 12 rechecks",
            savings: "Save 33%",
            best: true,
        },
        {
            id: "agency",
            name: "Agency",
            credits: 2000,
            price: 249,
            description: "10 full reviews + 40 rechecks",
            savings: "Save 49%",
        },
    ];
</script>

<main>
    <section class="hero">
        <div class="container hero-content" class:visible>
            <div class="section-label">App Store Review Simulator</div>
            <h1>
                Never get rejected for something <span class="highlight"
                    >you could've caught.</span
                >
            </h1>
            <p class="description">
                Preflight runs Apple's review checks on your submission before
                you hit Send. Catch rejection risks before they cost you a week.
            </p>

            <div class="cta-buttons">
                <a href="/auth/signup" class="btn btn-primary btn-lg">
                    Get Started
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    >
                        <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                </a>
                <a href="#pricing" class="btn btn-secondary btn-lg"
                    >View Pricing</a
                >
            </div>

            <p class="trust">
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="#22c55e"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M4 10l4 4L16 6" />
                </svg>
                <span>Built for indie iOS developers</span>
            </p>
        </div>
    </section>

    <section class="features">
        <div class="container">
            <div class="section-label">Automated Compliance Checks</div>
            <h2>What We Check</h2>
            <div class="feature-grid">
                <CockpitPanel class="feature-item">
                    <h3>Metadata</h3>
                    <p>App name, subtitle, keywords, description validation</p>
                </CockpitPanel>
                <CockpitPanel class="feature-item">
                    <h3>Screenshots</h3>
                    <p>Size, format, count, and content compliance</p>
                </CockpitPanel>
                <CockpitPanel class="feature-item">
                    <h3>Privacy Manifest</h3>
                    <p>API declarations, reason codes, tracking domains</p>
                </CockpitPanel>
                <CockpitPanel class="feature-item">
                    <h3>Info.plist</h3>
                    <p>Required keys, bundle ID, version format</p>
                </CockpitPanel>
                <CockpitPanel class="feature-item">
                    <h3>URLs</h3>
                    <p>Privacy policy, support URL reachability</p>
                </CockpitPanel>
                <CockpitPanel class="feature-item">
                    <h3>Content Policy</h3>
                    <p>Age rating, guideline compliance, claims</p>
                </CockpitPanel>
            </div>
        </div>
    </section>

    <section id="pricing" class="pricing">
        <div class="container">
            <div class="section-header">
                <h2>Simple, transparent pricing</h2>
                <p class="section-sub">
                    The average App Store rejection costs 8 days. Preflight costs $49.
                </p>
            </div>

            <div class="pricing-grid">
                {#each plans as plan}
                    <div class="pricing-card" class:best={plan.best}>
                        {#if plan.best}
                            <div class="best-badge">Best Value</div>
                        {/if}

                        <div class="plan-name">{plan.name}</div>

                        <div class="credit-count">
                            <span class="count">{plan.credits}</span>
                            <span class="count-label">credits</span>
                        </div>

                        <div class="price-row">
                            <span class="price-amount">${plan.price}</span>
                            {#if plan.savings}
                                <span class="savings-badge">{plan.savings}</span>
                            {/if}
                        </div>

                        <div class="plan-description">
                            {plan.description}
                        </div>

                        <a
                            href="/pricing"
                            class="btn {plan.best ? 'btn-primary' : 'btn-secondary'} btn-full"
                        >
                            Get Started
                        </a>
                    </div>
                {/each}
            </div>

            <div class="pricing-proof">
                <p class="testimonial">
                    "Caught 3 issues that would've been instant rejections."
                </p>
                <div class="guarantees">
                    <span>Credits never expire</span>
                    <span class="dot"></span>
                    <span>Results in minutes</span>
                </div>
            </div>
        </div>
    </section>

    <section class="how-it-works">
        <div class="container">
            <div class="section-label">3 Simple Steps</div>
            <h2>How It Works</h2>
            <div class="steps">
                <div class="step">
                    <span class="step-number">1</span>
                    <h3>Upload Your Files</h3>
                    <p>
                        Screenshots, Info.plist, privacy manifest, and metadata
                    </p>
                </div>
                <div class="step">
                    <span class="step-number">2</span>
                    <h3>AI Analyzes Everything</h3>
                    <p>Checks against Apple's latest guidelines</p>
                </div>
                <div class="step">
                    <span class="step-number">3</span>
                    <h3>Get Your Report</h3>
                    <p>Detailed issues with fix suggestions in minutes</p>
                </div>
            </div>
        </div>
    </section>

    <section class="final-cta">
        <div class="container text-center">
            <h2>Ready to submit with confidence?</h2>
            <p>Stop waiting weeks for Apple's rejection emails.</p>
            <a href="/auth/signup" class="btn btn-primary btn-lg"
                >Get Started Now</a
            >
        </div>
    </section>

    <footer>
        <div class="container text-center">
            <p class="text-subtle">&copy; 2026 Preflight</p>
        </div>
    </footer>
</main>

<style>
    .hero {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 100px 24px 80px;
        position: relative;
    }

    .hero-content {
        max-width: 720px;
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.8s var(--ease);
    }

    .hero-content.visible {
        opacity: 1;
        transform: translateY(0);
    }

    .badge {
        display: inline-block;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--accent);
        padding: 10px 20px;
        border: 1px solid rgba(212, 168, 83, 0.4);
        border-radius: 100px;
        background: rgba(212, 168, 83, 0.1);
        margin-bottom: 28px;
        letter-spacing: 0.02em;
    }

    .hero h1 {
        font-size: clamp(2.5rem, 6vw, 4rem);
        line-height: 1.1;
        margin-bottom: 24px;
        letter-spacing: -0.03em;
    }

    .highlight {
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .description {
        font-size: 1.35rem;
        color: var(--gray-100);
        line-height: 1.7;
        margin-bottom: 40px;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }

    .cta-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-bottom: 32px;
    }

    .btn-lg {
        height: 56px;
        padding: 0 32px;
        font-size: 1rem;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .trust {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--gray-400);
        font-size: 0.9rem;
    }

    /* Features */
    .features {
        padding: 80px 0;
    }

    .features h2 {
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--fg);
        margin-bottom: 2rem;
        text-align: center;
    }

    .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
        max-width: 1000px;
        margin: 0 auto;
    }

    .feature-grid :global(.feature-item:hover) {
        transform: translateY(-2px);
    }

    .feature-grid :global(.feature-item h3) {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 10px;
        color: var(--fg);
    }

    .feature-grid :global(.feature-item p) {
        font-size: 0.95rem;
        color: var(--gray-300);
        line-height: 1.6;
    }

    /* Pricing */
    .pricing {
        padding: 80px 0;
    }

    .section-header {
        text-align: center;
        margin-bottom: 48px;
    }

    .section-header h2 {
        font-size: 2.25rem;
        letter-spacing: -0.03em;
    }

    .section-sub {
        font-size: 1.1rem;
        color: var(--gray-300);
        margin-top: 16px;
    }

    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        max-width: 800px;
        margin: 0 auto;
    }

    @media (max-width: 700px) {
        .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 320px;
        }
    }

    .pricing-card {
        position: relative;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        padding: 32px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: all 0.3s ease;
    }

    .pricing-card:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.1);
        transform: translateY(-4px);
    }

    .pricing-card.best {
        background: rgba(212, 168, 83, 0.05);
        border-color: rgba(212, 168, 83, 0.3);
        box-shadow: 0 0 60px rgba(212, 168, 83, 0.1);
        transform: scale(1.02);
    }

    .pricing-card.best:hover {
        border-color: rgba(212, 168, 83, 0.5);
        box-shadow: 0 0 80px rgba(212, 168, 83, 0.15);
        transform: scale(1.02) translateY(-4px);
    }

    .best-badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        color: #0a0a0c;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 6px 16px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        white-space: nowrap;
    }

    .plan-name {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--gray-500);
        margin-top: 8px;
    }

    .pricing-card.best .plan-name {
        color: var(--accent);
    }

    .credit-count {
        margin-bottom: 12px;
        margin-top: 4px;
    }

    .count {
        font-family: "Outfit", sans-serif;
        font-size: 3rem;
        font-weight: 800;
        line-height: 1;
        color: var(--fg);
        display: block;
    }

    .pricing-card.best .count {
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .count-label {
        font-size: 0.85rem;
        color: var(--gray-400);
        text-transform: lowercase;
    }

    .price-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .price-amount {
        font-family: "Outfit", sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--fg);
    }

    .savings-badge {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--accent);
        background: rgba(212, 168, 83, 0.15);
        padding: 4px 8px;
        border-radius: 4px;
    }

    .plan-description {
        font-size: 0.85rem;
        color: var(--gray-400);
        margin-bottom: 20px;
    }

    .btn-full {
        width: 100%;
        justify-content: center;
    }

    .pricing-proof {
        text-align: center;
        margin-top: 48px;
    }

    .testimonial {
        font-size: 1.1rem;
        font-style: italic;
        color: var(--gray-200);
        margin-bottom: 20px;
    }

    .guarantees {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
        font-size: 0.85rem;
        color: var(--gray-400);
    }

    .guarantees .dot {
        width: 4px;
        height: 4px;
        background: var(--gray-600);
        border-radius: 50%;
    }

    @media (max-width: 500px) {
        .guarantees {
            flex-direction: column;
            gap: 8px;
        }
        .guarantees .dot {
            display: none;
        }
    }

    /* How it works */
    .how-it-works {
        padding: 80px 0;
    }

    .how-it-works h2 {
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--fg);
        margin-bottom: 2.5rem;
        text-align: center;
    }

    .steps {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 40px;
        max-width: 900px;
        margin: 0 auto;
    }

    @media (max-width: 700px) {
        .steps {
            grid-template-columns: 1fr;
        }
    }

    .step {
        text-align: center;
    }

    .step-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        color: var(--bg);
        font-family: "Outfit", sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
        border-radius: 50%;
        margin-bottom: 16px;
    }

    .step h3 {
        font-size: 1.1rem;
        margin-bottom: 8px;
    }

    .step p {
        font-size: 0.9rem;
        color: var(--gray-400);
        line-height: 1.5;
    }

    /* Final CTA */
    .final-cta {
        padding: 80px 0;
        text-align: center;
    }

    .final-cta h2 {
        font-size: 2.5rem;
        margin-bottom: 16px;
        letter-spacing: -0.02em;
    }

    .final-cta p {
        color: var(--gray-300);
        margin-bottom: 40px;
        font-size: 1.15rem;
    }

    .final-cta .btn {
        display: inline-flex;
    }

    footer {
        padding: 3rem 0;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    @media (max-width: 600px) {
        .cta-buttons {
            flex-direction: column;
        }

        .btn-lg {
            width: 100%;
            justify-content: center;
        }

        .pricing-grid {
            grid-template-columns: 1fr;
        }

        .feature-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
