<script lang="ts">
    import { enhance } from "$app/forms";

    let loading = $state(false);
    let selectedPlan = $state<string | null>(null);

    const plans = [
        {
            id: "starter",
            name: "Starter",
            reviews: 1,
            price: 49,
            perReview: 49,
            features: ["Essential checks", "Results in < 5 mins"]
        },
        {
            id: "pro",
            name: "Pro",
            reviews: 3,
            price: 129,
            perReview: 43,
            best: true,
            features: ["Priority processing", "Deep scan analysis", "Exportable PDF reports"]
        },
        {
            id: "agency",
            name: "Agency",
            reviews: 15,
            price: 449,
            perReview: 30,
            features: ["Team dashboard", "API Access", "White-label options"]
        },
    ];
</script>

<main class="pricing-page">
    <div class="background-grid"></div>
    
    <div class="container">
        <header class="pricing-header">
            <div class="loss-aversion-banner">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">The average App Store rejection costs <strong>8 days</strong></span>
            </div>
            <h1>Don't leave your launch to chance.</h1>
            <p class="header-sub">
                Get the exact same feedback Apple would give you, but in minutes instead of days.
            </p>
        </header>

        <div class="pricing-grid">
            {#each plans as plan}
                <div class="pricing-card" class:best={plan.best}>
                    {#if plan.best}
                        <div class="best-badge">Most Popular</div>
                        <div class="glow-effect"></div>
                    {/if}

                    <div class="card-content">
                        <div class="plan-header">
                            <h3 class="plan-name">{plan.name}</h3>
                        </div>

                        <div class="outcome-section">
                            <span class="review-count">{plan.reviews}</span>
                            <span class="review-label">{plan.reviews === 1 ? 'Review' : 'Reviews'}</span>
                        </div>

                        <div class="price-section">
                            <div class="per-review-container">
                                <span class="currency">$</span>
                                <span class="amount">{plan.perReview}</span>
                                <span class="per-suffix">/ review</span>
                            </div>
                            <div class="total-price">
                                ${plan.price} billed once
                            </div>
                        </div>

                        <div class="divider"></div>

                        <form
                            method="POST"
                            action="?/buyCredits"
                            use:enhance={() => {
                                loading = true;
                                selectedPlan = plan.id;
                                return async ({ result }) => {
                                    loading = false;
                                    if (
                                        result.type === "redirect" &&
                                        result.location
                                    ) {
                                        window.location.href = result.location;
                                    }
                                };
                            }}
                        >
                            <input type="hidden" name="plan" value={plan.id} />
                            <button
                                type="submit"
                                class="btn btn-full {plan.best ? 'btn-primary' : 'btn-secondary'}"
                                disabled={loading && selectedPlan === plan.id}
                            >
                                {#if loading && selectedPlan === plan.id}
                                    Processing...
                                {:else}
                                    Review My {plan.reviews === 1 ? 'App' : 'Apps'}
                                {/if}
                            </button>
                        </form>
                        
                        <div class="guarantee-text">
                            Credits never expire
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <div class="social-proof-section">
            <div class="testimonial-card">
                <div class="quote-mark">“</div>
                <p class="quote">
                    Caught 3 issues that would've been instant rejections. It paid for itself in saved dev time alone.
                </p>
                <div class="author">
                    <div class="author-avatar">MJ</div>
                    <div class="author-info">
                        <div class="author-name">Marcus Jenkins</div>
                        <div class="author-role">Senior iOS Developer</div>
                    </div>
                </div>
            </div>

            <div class="guarantees-row">
                <div class="guarantee-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Results in minutes</span>
                </div>
                <div class="guarantee-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>100% Secure Analysis</span>
                </div>
                <div class="guarantee-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                    <span>Full refund on unused credits</span>
                </div>
            </div>
        </div>

        <div class="features-section">
            <div class="section-title">
                <h2>Flight Systems Check</h2>
                <div class="title-line"></div>
            </div>
            
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-header">
                        <span class="feature-icon">📝</span>
                        <h4>Metadata</h4>
                    </div>
                    <p>App name, subtitle, keywords & description validation</p>
                </div>
                <div class="feature-card">
                    <div class="feature-header">
                        <span class="feature-icon">📸</span>
                        <h4>Screenshots</h4>
                    </div>
                    <p>Size, format, and content compliance for all devices</p>
                </div>
                <div class="feature-card">
                    <div class="feature-header">
                        <span class="feature-icon">🔒</span>
                        <h4>Privacy</h4>
                    </div>
                    <p>Manifest API declarations & tracking domain checks</p>
                </div>
                <div class="feature-card">
                    <div class="feature-header">
                        <span class="feature-icon">⚙️</span>
                        <h4>Info.plist</h4>
                    </div>
                    <p>Required keys, permissions & version string verification</p>
                </div>
                <div class="feature-card">
                    <div class="feature-header">
                        <span class="feature-icon">🔗</span>
                        <h4>URLs</h4>
                    </div>
                    <p>Support & privacy policy link reachability tests</p>
                </div>
                <div class="feature-card">
                    <div class="feature-header">
                        <span class="feature-icon">🧠</span>
                        <h4>Guidelines</h4>
                    </div>
                    <p>AI analysis against latest Apple Review Guidelines</p>
                </div>
            </div>
        </div>
    </div>
</main>

<style>
    .pricing-page {
        padding: 60px 24px 100px;
        min-height: 100vh;
        position: relative;
        overflow-x: hidden;
    }

    .background-grid {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100vh;
        background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 50px 50px;
        mask-image: linear-gradient(to bottom, black 0%, transparent 80%);
        pointer-events: none;
        z-index: -1;
    }

    .pricing-header {
        text-align: center;
        margin-bottom: 64px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .loss-aversion-banner {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        padding: 8px 16px;
        border-radius: 99px;
        margin-bottom: 24px;
        color: #f87171;
        font-size: 0.9rem;
    }

    .warning-text strong {
        color: #fca5a5;
        font-weight: 700;
    }

    .pricing-header h1 {
        font-family: "Outfit", sans-serif;
        font-size: 3rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        background: linear-gradient(to bottom, #fff 0%, #a8a5a0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 16px;
    }

    .header-sub {
        font-size: 1.2rem;
        color: var(--gray-300);
        max-width: 500px;
        line-height: 1.5;
    }

    /* === Pricing Grid === */
    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        max-width: 1000px;
        margin: 0 auto 80px;
        align-items: center;
    }

    .pricing-card {
        background: var(--surface-2);
        border: 1px solid var(--border-default);
        border-radius: 20px;
        padding: 4px; /* For double border effect if needed */
        position: relative;
        transition: transform 0.3s var(--ease-spring), box-shadow 0.3s var(--ease);
    }

    .card-content {
        background: var(--surface-1);
        border-radius: 16px;
        padding: 32px 24px;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .pricing-card:hover {
        transform: translateY(-5px);
        border-color: var(--border-hover);
    }

    /* === Pro Plan Styling === */
    .pricing-card.best {
        border-color: var(--accent);
        transform: scale(1.05);
        z-index: 10;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }

    .pricing-card.best:hover {
        transform: scale(1.05) translateY(-5px);
        box-shadow: 0 30px 60px rgba(212, 168, 83, 0.15);
    }

    .pricing-card.best .card-content {
        background: linear-gradient(180deg, rgba(212, 168, 83, 0.03) 0%, rgba(12, 12, 15, 1) 100%);
    }

    .best-badge {
        position: absolute;
        top: -14px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent);
        color: #000;
        font-family: "Instrument Mono", monospace;
        font-weight: 700;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 6px 16px;
        border-radius: 99px;
        z-index: 20;
        box-shadow: 0 4px 12px rgba(212, 168, 83, 0.4);
    }

    .plan-name {
        font-family: "Instrument Mono", monospace;
        color: var(--gray-500);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 24px;
    }

    .pricing-card.best .plan-name {
        color: var(--accent);
    }

    /* === Outcome Section === */
    .outcome-section {
        margin-bottom: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
    }

    .review-count {
        font-family: "Outfit", sans-serif;
        font-size: 4.5rem;
        font-weight: 800;
        color: var(--fg);
        letter-spacing: -0.04em;
    }

    .pricing-card.best .review-count {
        background: linear-gradient(135deg, #fff 0%, #D4A853 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .review-label {
        font-size: 1.1rem;
        color: var(--gray-400);
        font-weight: 500;
    }

    /* === Price Section === */
    .price-section {
        margin-bottom: 32px;
        background: rgba(255, 255, 255, 0.03);
        width: 100%;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .per-review-container {
        display: flex;
        align-items: baseline;
        justify-content: center;
        margin-bottom: 4px;
    }

    .currency {
        font-size: 1.2rem;
        color: var(--gray-400);
        font-weight: 600;
        margin-right: 2px;
    }

    .amount {
        font-family: "Instrument Mono", monospace;
        font-size: 2rem;
        font-weight: 700;
        color: var(--fg);
        letter-spacing: -0.02em;
    }

    .per-suffix {
        font-size: 0.9rem;
        color: var(--gray-500);
        margin-left: 6px;
    }

    .total-price {
        font-size: 0.8rem;
        color: var(--gray-500);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .divider {
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        margin-bottom: 32px;
    }

    .btn-full {
        width: 100%;
        height: 48px;
        font-size: 0.9rem;
    }

    .guarantee-text {
        margin-top: 16px;
        font-size: 0.75rem;
        color: var(--gray-600);
    }

    /* === Social Proof === */
    .social-proof-section {
        max-width: 800px;
        margin: 0 auto 100px;
        text-align: center;
    }

    .testimonial-card {
        position: relative;
        margin-bottom: 40px;
    }

    .quote-mark {
        font-family: serif;
        font-size: 8rem;
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        color: rgba(255, 255, 255, 0.05);
        pointer-events: none;
    }

    .quote {
        font-family: "Outfit", sans-serif;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--gray-100);
        margin-bottom: 24px;
        position: relative;
        z-index: 1;
    }

    .author {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
    }

    .author-avatar {
        width: 40px;
        height: 40px;
        background: var(--surface-3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: var(--accent);
        font-size: 0.9rem;
        border: 1px solid var(--border-default);
    }

    .author-info {
        text-align: left;
    }

    .author-name {
        font-weight: 600;
        color: var(--fg);
        font-size: 0.95rem;
    }

    .author-role {
        font-size: 0.8rem;
        color: var(--gray-500);
    }

    .guarantees-row {
        display: flex;
        justify-content: center;
        gap: 32px;
        flex-wrap: wrap;
    }

    .guarantee-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--gray-400);
        font-size: 0.9rem;
    }

    .guarantee-item svg {
        color: var(--accent);
        opacity: 0.7;
    }

    /* === Features === */
    .features-section {
        max-width: 900px;
        margin: 0 auto;
    }

    .section-title {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 40px;
    }

    .section-title h2 {
        font-size: 1.2rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--gray-500);
        white-space: nowrap;
    }

    .title-line {
        height: 1px;
        background: var(--border-default);
        width: 100%;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
    }

    .feature-card {
        padding: 24px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 12px;
        transition: background 0.2s;
    }

    .feature-card:hover {
        background: rgba(255, 255, 255, 0.04);
    }

    .feature-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }

    .feature-icon {
        font-size: 1.2rem;
    }

    .feature-card h4 {
        font-size: 1rem;
        color: var(--fg);
    }

    .feature-card p {
        font-size: 0.85rem;
        color: var(--gray-400);
        line-height: 1.6;
    }

    /* === Mobile === */
    @media (max-width: 850px) {
        .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
            gap: 40px;
        }

        .pricing-card.best {
            transform: scale(1);
        }

        .pricing-card.best:hover {
            transform: translateY(-5px);
        }

        .features-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .pricing-header h1 {
            font-size: 2.25rem;
        }
    }

    @media (max-width: 600px) {
        .features-grid {
            grid-template-columns: 1fr;
        }
        
        .quote {
            font-size: 1.2rem;
        }
    }
</style>
