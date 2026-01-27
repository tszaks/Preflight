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
        },
        {
            id: "pro",
            name: "Pro",
            reviews: 3,
            price: 129,
            perReview: 43,
            best: true,
        },
        {
            id: "agency",
            name: "Agency",
            reviews: 15,
            price: 449,
            perReview: 30,
        },
    ];
</script>

<main class="pricing-page">
    <div class="container">
        <header class="pricing-header">
            <h1>How many apps do you need to review?</h1>
            <p class="header-sub">
                The average App Store rejection costs 8 days. A review costs $49.
            </p>
        </header>

        <div class="pricing-grid">
            {#each plans as plan}
                <div class="pricing-card" class:best={plan.best}>
                    {#if plan.best}
                        <div class="best-badge">Best Value</div>
                    {/if}

                    <div class="plan-name">{plan.name}</div>

                    <div class="review-count">
                        <span class="count">{plan.reviews}</span>
                        <span class="count-label">{plan.reviews === 1 ? 'review' : 'reviews'}</span>
                    </div>

                    <div class="per-review">
                        <span class="per-amount">${plan.perReview}</span>
                        <span class="per-label">per review</span>
                    </div>

                    <div class="total-price">
                        ${plan.price} total
                    </div>

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
                                Review {plan.reviews === 1 ? 'My App' : `${plan.reviews} Apps`}
                            {/if}
                        </button>
                    </form>
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
                <span class="dot"></span>
                <span>Full refund on unused credits</span>
            </div>
        </div>

        <div class="what-you-get">
            <h2>What's included in every review</h2>
            <div class="features-grid">
                <div class="feature">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 12l2 2 4-4"/>
                            <rect x="3" y="3" width="18" height="18" rx="3"/>
                        </svg>
                    </div>
                    <h4>Metadata validation</h4>
                    <p>App name, subtitle, keywords, and description checked against Apple's requirements</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                    </div>
                    <h4>Screenshot analysis</h4>
                    <p>Size, format, count, and content compliance for all device sizes</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                    <h4>Privacy manifest</h4>
                    <p>API declarations, reason codes, and tracking domains validated</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                        </svg>
                    </div>
                    <h4>Info.plist checks</h4>
                    <p>Required keys, bundle ID format, version strings, and permissions</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                        </svg>
                    </div>
                    <h4>URL verification</h4>
                    <p>Privacy policy and support URLs tested for reachability</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <h4>Guideline review</h4>
                    <p>AI analysis against Apple's latest App Store Review Guidelines</p>
                </div>
            </div>
        </div>
    </div>
</main>

<style>
    .pricing-page {
        padding: 100px 24px 80px;
        min-height: 100vh;
    }

    .pricing-header {
        text-align: center;
        margin-bottom: 48px;
    }

    .pricing-header h1 {
        font-family: "Outfit", sans-serif;
        font-size: 2.25rem;
        font-weight: 800;
        letter-spacing: -0.02em;
    }

    .header-sub {
        font-size: 1.1rem;
        color: var(--gray-300);
        margin-top: 16px;
    }

    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        max-width: 800px;
        margin: 0 auto 48px;
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

    .review-count {
        margin-bottom: 16px;
        margin-top: 4px;
    }

    .count {
        font-family: "Outfit", sans-serif;
        font-size: 4rem;
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
        font-size: 1rem;
        color: var(--gray-400);
        text-transform: lowercase;
    }

    .per-review {
        margin-bottom: 8px;
    }

    .per-amount {
        font-family: "Outfit", sans-serif;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--fg);
    }

    .per-label {
        font-size: 0.9rem;
        color: var(--gray-400);
        margin-left: 4px;
    }

    .total-price {
        font-size: 0.9rem;
        color: var(--gray-500);
        margin-bottom: 24px;
    }

    .btn-full {
        width: 100%;
        justify-content: center;
    }

    .pricing-proof {
        text-align: center;
        margin-bottom: 64px;
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

    /* What's included section */
    .what-you-get {
        max-width: 900px;
        margin: 0 auto;
    }

    .what-you-get h2 {
        font-family: "Outfit", sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        text-align: center;
        margin-bottom: 32px;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
    }

    @media (max-width: 800px) {
        .features-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 500px) {
        .features-grid {
            grid-template-columns: 1fr;
        }
    }

    .feature {
        padding: 20px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 12px;
    }

    .feature-icon {
        color: var(--accent);
        margin-bottom: 12px;
        opacity: 0.8;
    }

    .feature h4 {
        font-family: "Outfit", sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: var(--fg);
        margin-bottom: 8px;
    }

    .feature p {
        font-size: 0.85rem;
        color: var(--gray-400);
        line-height: 1.5;
    }
</style>
