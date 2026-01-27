<script lang="ts">
    import { enhance } from "$app/forms";

    let loading = $state(false);
    let selectedPlan = $state<string | null>(null);

    const plans = [
        {
            id: "starter",
            name: "Starter",
            credits: 200,
            price: 49,
            savings: null,
            description: "Perfect for your first launch",
            features: [
                "1 full review + 4 rechecks",
                "Complete compliance report",
                "Never expires",
            ],
        },
        {
            id: "pro",
            name: "Pro",
            credits: 600,
            price: 99,
            savings: "Save 33%",
            description: "For developers shipping regularly",
            featured: true,
            features: [
                "3 full reviews + 12 rechecks",
                "Perfect for iterating before launch",
                "Best value for active devs",
            ],
        },
        {
            id: "agency",
            name: "Agency",
            credits: 2000,
            price: 249,
            savings: "Save 49%",
            description: "For teams and agencies",
            features: [
                "10 full reviews + 40 rechecks",
                "Cover your whole app portfolio",
                "Volume pricing for studios",
            ],
        },
    ];
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet">
</svelte:head>

<main class="pricing-page">
    <div class="ambient-glow"></div>

    <div class="container">
        <header class="pricing-header">
            <p class="eyebrow">Pricing</p>
            <h1>
                <span class="headline-main">Catch rejection risks</span>
                <span class="headline-accent">before Apple does.</span>
            </h1>
            <p class="subhead">
                One-time purchase. No subscription. Credits never expire.
            </p>
            <p class="credit-explainer">
                Full review = 100 credits · Recheck after fixes = 25 credits
            </p>
        </header>

        <div class="loss-aversion">
            <div class="loss-stat">
                <span class="loss-number">8</span>
                <span class="loss-label">days</span>
            </div>
            <p class="loss-text">
                The average App Store rejection delays your launch by over a week.
                <br>Preflight catches issues in <strong>minutes</strong>.
            </p>
        </div>

        <div class="pricing-grid">
            {#each plans as plan}
                <article class="pricing-card" class:featured={plan.featured}>
                    {#if plan.featured}
                        <div class="featured-badge">Most Popular</div>
                    {/if}

                    <div class="card-inner">
                        <header class="plan-header">
                            <h2 class="plan-name">{plan.name}</h2>
                            <p class="plan-description">{plan.description}</p>
                        </header>

                        <div class="plan-value">
                            <div class="credit-count">
                                <span class="count-number">{plan.credits}</span>
                                <span class="count-label">credits</span>
                            </div>

                            <div class="price-display">
                                <span class="price-amount">${plan.price}</span>
                                {#if plan.savings}
                                    <span class="savings-badge">{plan.savings}</span>
                                {/if}
                            </div>
                        </div>

                        <ul class="plan-features">
                            {#each plan.features as feature}
                                <li>
                                    <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                    </svg>
                                    <span>{feature}</span>
                                </li>
                            {/each}
                        </ul>

                        <form
                            method="POST"
                            action="?/buyCredits"
                            use:enhance={() => {
                                loading = true;
                                selectedPlan = plan.id;
                                return async ({ result }) => {
                                    loading = false;
                                    if (result.type === "redirect" && result.location) {
                                        window.location.href = result.location;
                                    }
                                };
                            }}
                        >
                            <input type="hidden" name="plan" value={plan.id} />
                            <button
                                type="submit"
                                class="cta-button"
                                class:loading={loading && selectedPlan === plan.id}
                                disabled={loading && selectedPlan === plan.id}
                            >
                                {#if loading && selectedPlan === plan.id}
                                    <span class="spinner"></span>
                                    Processing...
                                {:else}
                                    Review My App
                                {/if}
                            </button>
                        </form>
                    </div>
                </article>
            {/each}
        </div>

        <section class="testimonial">
            <blockquote>
                <p>"Caught 3 issues that would've been instant rejections. Saved me a week of back-and-forth with App Review."</p>
            </blockquote>
            <cite>
                <strong>Marcus Johnson</strong>
                <span>iOS Developer, shipped 3 apps</span>
            </cite>
        </section>

        <footer class="guarantees">
            <div class="guarantee">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Credits never expire</span>
            </div>
            <div class="guarantee">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Results in minutes</span>
            </div>
            <div class="guarantee">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>One-time purchase</span>
            </div>
        </footer>
    </div>
</main>

<style>
    .pricing-page {
        position: relative;
        min-height: 100vh;
        padding: 120px 24px 80px;
        overflow: hidden;
    }

    .ambient-glow {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 800px;
        height: 600px;
        background: radial-gradient(
            ellipse at center,
            rgba(212, 168, 83, 0.08) 0%,
            rgba(212, 168, 83, 0.03) 40%,
            transparent 70%
        );
        pointer-events: none;
    }

    .container {
        position: relative;
        max-width: 1100px;
        margin: 0 auto;
    }

    /* === Header === */
    .pricing-header {
        text-align: center;
        margin-bottom: 48px;
    }

    .eyebrow {
        font-family: 'Instrument Mono', monospace;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 16px;
    }

    .pricing-header h1 {
        font-family: 'Fraunces', serif;
        font-size: clamp(2rem, 5vw, 3.2rem);
        font-weight: 600;
        line-height: 1.15;
        letter-spacing: -0.02em;
    }

    .headline-main {
        display: block;
        color: var(--fg);
    }

    .headline-accent {
        display: block;
        background: linear-gradient(135deg, #d4a853 0%, #e8c77b 50%, #c4963d 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .subhead {
        margin-top: 16px;
        font-size: 1.05rem;
        color: var(--gray-300);
    }

    .credit-explainer {
        margin-top: 12px;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--gray-500);
        letter-spacing: 0.02em;
    }

    /* === Loss Aversion === */
    .loss-aversion {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-bottom: 56px;
        padding: 24px 32px;
        background: rgba(239, 68, 68, 0.04);
        border: 1px solid rgba(239, 68, 68, 0.15);
        border-radius: 12px;
        max-width: 640px;
        margin-left: auto;
        margin-right: auto;
    }

    .loss-stat {
        display: flex;
        align-items: baseline;
        gap: 4px;
        flex-shrink: 0;
    }

    .loss-number {
        font-family: 'Fraunces', serif;
        font-size: 3.5rem;
        font-weight: 700;
        color: #f87171;
        line-height: 1;
    }

    .loss-label {
        font-family: 'Instrument Mono', monospace;
        font-size: 0.85rem;
        font-weight: 600;
        color: #f87171;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .loss-text {
        font-size: 0.95rem;
        color: var(--gray-300);
        line-height: 1.5;
    }

    .loss-text strong {
        color: var(--fg);
    }

    /* === Pricing Grid === */
    .pricing-grid {
        display: grid;
        grid-template-columns: 1fr 1.15fr 1fr;
        gap: 20px;
        align-items: start;
        margin-bottom: 64px;
    }

    @media (max-width: 900px) {
        .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
        }
    }

    /* === Pricing Card === */
    .pricing-card {
        position: relative;
        background: var(--surface-2);
        border: 1px solid var(--border-default);
        border-radius: 16px;
        transition: all 0.3s var(--ease);
    }

    .pricing-card:hover {
        border-color: var(--border-hover);
        transform: translateY(-4px);
    }

    .pricing-card.featured {
        background: linear-gradient(
            180deg,
            rgba(212, 168, 83, 0.06) 0%,
            rgba(212, 168, 83, 0.02) 100%
        );
        border-color: rgba(212, 168, 83, 0.3);
        box-shadow:
            0 0 0 1px rgba(212, 168, 83, 0.1),
            0 20px 40px -20px rgba(212, 168, 83, 0.2),
            0 0 80px -20px rgba(212, 168, 83, 0.15);
        z-index: 1;
    }

    .pricing-card.featured:hover {
        border-color: rgba(212, 168, 83, 0.5);
        box-shadow:
            0 0 0 1px rgba(212, 168, 83, 0.2),
            0 25px 50px -20px rgba(212, 168, 83, 0.25),
            0 0 100px -20px rgba(212, 168, 83, 0.2);
    }

    .card-inner {
        padding: 32px 28px;
    }

    .pricing-card.featured .card-inner {
        padding: 40px 32px;
    }

    .featured-badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        color: #0a0a0c;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 6px 16px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        white-space: nowrap;
    }

    /* === Plan Header === */
    .plan-header {
        margin-bottom: 24px;
    }

    .pricing-card.featured .plan-header {
        margin-top: 8px;
    }

    .plan-name {
        font-family: 'Outfit', sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--fg);
        margin-bottom: 6px;
    }

    .plan-description {
        font-size: 0.9rem;
        color: var(--gray-400);
        line-height: 1.4;
    }

    /* === Plan Value (Credits + Price) === */
    .plan-value {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border-default);
    }

    .credit-count {
        display: flex;
        align-items: baseline;
        gap: 8px;
    }

    .count-number {
        font-family: 'Fraunces', serif;
        font-size: 2.75rem;
        font-weight: 700;
        color: var(--fg);
        line-height: 1;
    }

    .pricing-card.featured .count-number {
        font-size: 3.5rem;
        background: linear-gradient(135deg, #d4a853 0%, #e8c77b 50%, #c4963d 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .count-label {
        font-size: 0.9rem;
        color: var(--gray-400);
    }

    .price-display {
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
    }

    .price-amount {
        font-family: 'Outfit', sans-serif;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--fg);
    }

    .savings-badge {
        background: rgba(34, 197, 94, 0.1);
        color: #4ade80;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.65rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
    }

    /* === Features === */
    .plan-features {
        list-style: none;
        margin-bottom: 24px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .plan-features li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 0.85rem;
        color: var(--gray-300);
        line-height: 1.4;
    }

    .check-icon {
        width: 16px;
        height: 16px;
        color: #22c55e;
        flex-shrink: 0;
        margin-top: 2px;
    }

    /* === CTA Button === */
    .cta-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 14px 24px;
        background: transparent;
        border: 1px solid var(--border-hover);
        border-radius: 8px;
        color: var(--fg);
        font-family: 'Instrument Mono', monospace;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        cursor: pointer;
        transition: all 0.2s var(--ease);
    }

    .cta-button:hover {
        border-color: var(--accent);
        background: rgba(212, 168, 83, 0.08);
        color: var(--accent);
    }

    .pricing-card.featured .cta-button {
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        border: none;
        color: #0a0a0c;
    }

    .pricing-card.featured .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(212, 168, 83, 0.35);
    }

    .cta-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* === Testimonial === */
    .testimonial {
        max-width: 600px;
        margin: 0 auto 48px;
        text-align: center;
    }

    .testimonial blockquote {
        position: relative;
        padding: 0 24px;
    }

    .testimonial blockquote::before {
        content: '"';
        position: absolute;
        top: -20px;
        left: 0;
        font-family: 'Fraunces', serif;
        font-size: 5rem;
        color: rgba(212, 168, 83, 0.15);
        line-height: 1;
    }

    .testimonial p {
        font-family: 'Fraunces', serif;
        font-size: 1.2rem;
        font-weight: 400;
        font-style: italic;
        color: var(--gray-200);
        line-height: 1.6;
    }

    .testimonial cite {
        display: block;
        margin-top: 20px;
        font-style: normal;
    }

    .testimonial cite strong {
        display: block;
        font-family: 'Outfit', sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--fg);
    }

    .testimonial cite span {
        font-size: 0.85rem;
        color: var(--gray-500);
    }

    /* === Guarantees === */
    .guarantees {
        display: flex;
        justify-content: center;
        gap: 40px;
        flex-wrap: wrap;
        padding-top: 32px;
        border-top: 1px solid var(--border-default);
    }

    .guarantee {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
        color: var(--gray-400);
    }

    .guarantee svg {
        width: 20px;
        height: 20px;
        color: var(--gray-500);
    }

    @media (max-width: 600px) {
        .loss-aversion {
            flex-direction: column;
            text-align: center;
        }

        .loss-stat {
            justify-content: center;
        }

        .guarantees {
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }
    }
</style>
