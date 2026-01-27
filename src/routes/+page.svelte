<script lang="ts">
    import { onMount } from "svelte";
    import CockpitPanel from "$lib/components/CockpitPanel.svelte";

    let visible = $state(false);
    onMount(() => setTimeout(() => (visible = true), 100));

    const plans = [
        {
            name: "Starter",
            credits: 100,
            price: 49,
            reviews: "1 full review",
            savings: null,
            description: "Perfect for launching your first app",
        },
        {
            name: "Pro",
            credits: 350,
            price: 129,
            reviews: "3 full reviews",
            savings: "Save 12%",
            description: "For developers shipping regularly",
            popular: true,
        },
        {
            name: "Team",
            credits: 750,
            price: 249,
            reviews: "7 full reviews",
            savings: "Save 27%",
            description: "For small studios and teams",
        },
        {
            name: "Agency",
            credits: 1500,
            price: 449,
            reviews: "15 full reviews",
            savings: "Save 39%",
            description: "For agencies managing multiple apps",
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
                <div class="section-label">Simple Pricing</div>
                <h2>Buy credits, review apps.</h2>
                <p class="section-sub">
                    No subscriptions. No expiration. Just reviews when you need them.
                </p>
            </div>

            <div class="pricing-grid">
                {#each plans as plan}
                    <div class="pricing-card" class:popular={plan.popular}>
                        {#if plan.popular}
                            <div class="popular-badge">Recommended</div>
                        {/if}
                        {#if plan.savings}
                            <div class="savings-tag">{plan.savings}</div>
                        {/if}
                        <div class="plan-header">
                            <h3 class="plan-name">{plan.name}</h3>
                            <p class="plan-description">{plan.description}</p>
                        </div>
                        <div class="plan-price">
                            <span class="price-amount">${plan.price}</span>
                            <span class="price-once">one-time</span>
                        </div>
                        <div class="plan-value">
                            <span class="credits-count">{plan.credits}</span>
                            <span class="credits-label">credits</span>
                        </div>
                        <div class="plan-details">
                            <div class="detail-item">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 8l4 4L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>{plan.reviews}</span>
                            </div>
                            <div class="detail-item">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 8l4 4L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>Credits never expire</span>
                            </div>
                            <div class="detail-item">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 8l4 4L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>Full compliance report</span>
                            </div>
                        </div>
                        <a
                            href="/pricing"
                            class="btn {plan.popular ? 'btn-primary' : 'btn-secondary'} btn-full"
                        >
                            Get {plan.name}
                        </a>
                    </div>
                {/each}
            </div>

            <div class="pricing-footnote">
                <p>100 credits = 1 full app review with detailed compliance report</p>
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
        font-size: 2.5rem;
        margin-top: 16px;
        letter-spacing: -0.03em;
    }

    .section-sub {
        font-size: 1.15rem;
        color: var(--gray-300);
        margin-top: 12px;
    }

    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        max-width: 1100px;
        margin: 0 auto;
    }

    @media (max-width: 1000px) {
        .pricing-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
    }

    @media (max-width: 600px) {
        .pricing-grid {
            grid-template-columns: 1fr;
        }
    }

    .pricing-card {
        position: relative;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        padding: 28px 24px;
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;
    }

    .pricing-card:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.1);
        transform: translateY(-4px);
    }

    .pricing-card.popular {
        background: rgba(212, 168, 83, 0.04);
        border-color: rgba(212, 168, 83, 0.25);
        box-shadow: 0 0 40px rgba(212, 168, 83, 0.08);
    }

    .pricing-card.popular:hover {
        border-color: rgba(212, 168, 83, 0.4);
        box-shadow: 0 0 50px rgba(212, 168, 83, 0.12);
    }

    .popular-badge {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        color: #0a0a0c;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 5px 14px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        white-space: nowrap;
    }

    .savings-tag {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(34, 197, 94, 0.12);
        color: #22c55e;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 6px;
    }

    .plan-header {
        margin-bottom: 20px;
        padding-top: 8px;
    }

    .pricing-card.popular .plan-header {
        padding-top: 4px;
    }

    .plan-name {
        font-family: "Outfit", sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--fg);
        margin-bottom: 6px;
    }

    .plan-description {
        font-size: 0.85rem;
        color: var(--gray-400);
        line-height: 1.4;
    }

    .plan-price {
        margin-bottom: 8px;
    }

    .price-amount {
        font-family: "Outfit", sans-serif;
        font-size: 2.25rem;
        font-weight: 800;
        color: var(--fg);
        letter-spacing: -0.02em;
    }

    .pricing-card.popular .price-amount {
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .price-once {
        font-size: 0.8rem;
        color: var(--gray-500);
        margin-left: 4px;
    }

    .plan-value {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .credits-count {
        font-family: "Outfit", sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--accent);
    }

    .credits-label {
        font-size: 0.85rem;
        color: var(--gray-400);
    }

    .plan-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
        flex-grow: 1;
    }

    .detail-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
        color: var(--gray-300);
    }

    .detail-item svg {
        color: #22c55e;
        flex-shrink: 0;
    }

    .btn-full {
        width: 100%;
        justify-content: center;
    }

    .pricing-footnote {
        text-align: center;
        margin-top: 32px;
    }

    .pricing-footnote p {
        font-size: 0.9rem;
        color: var(--gray-500);
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
