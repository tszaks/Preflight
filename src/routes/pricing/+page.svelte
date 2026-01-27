<script lang="ts">
    import { enhance } from "$app/forms";

    let loading = $state(false);
    let selectedPlan = $state<string | null>(null);

    const plans = [
        {
            id: "starter",
            name: "Starter",
            reviewCount: 1,
            price: 49,
            savings: null,
            description: "Perfect for launching your first app",
        },
        {
            id: "pro",
            name: "Pro",
            reviewCount: 3,
            price: 129,
            savings: "Save 12%",
            description: "For developers shipping regularly",
            popular: true,
        },
        {
            id: "agency",
            name: "Agency",
            reviewCount: 15,
            price: 449,
            savings: "Save 39%",
            description: "For agencies managing multiple apps",
        },
    ];
</script>

<main class="pricing-page">
    <div class="container">
        <header class="pricing-header">
            <h1>Catch issues before Apple does.</h1>
            <p class="header-sub">
                One-time purchase. No subscription. Credits never expire.
            </p>
        </header>

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

                    <div class="plan-reviews">
                        <span class="review-count">{plan.reviewCount}</span>
                        <span class="review-label">{plan.reviewCount === 1 ? 'review' : 'reviews'}</span>
                    </div>

                    <div class="plan-price">
                        <span class="price-amount">${plan.price}</span>
                        <span class="price-per">${Math.round(plan.price / plan.reviewCount)}/review</span>
                    </div>

                    <div class="plan-details">
                        <div class="detail-item">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8l4 4L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Full compliance report</span>
                        </div>
                        <div class="detail-item">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8l4 4L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Latest Apple guidelines</span>
                        </div>
                        <div class="detail-item">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8l4 4L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Results in minutes</span>
                        </div>
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
                            class="btn btn-full {plan.popular ? 'btn-primary' : 'btn-secondary'}"
                            disabled={loading && selectedPlan === plan.id}
                        >
                            {loading && selectedPlan === plan.id
                                ? "Processing..."
                                : `Get ${plan.name}`}
                        </button>
                    </form>
                </div>
            {/each}
        </div>

        <div class="testimonial">
            <blockquote>
                "Caught 3 issues that would've been instant rejections. Saved me a week of back-and-forth with App Review."
            </blockquote>
            <cite>— Marcus J., iOS Developer</cite>
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
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.02em;
    }

    .header-sub {
        font-size: 1.1rem;
        color: var(--gray-400);
        margin-top: 12px;
    }

    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 64px;
        max-width: 900px;
        margin-left: auto;
        margin-right: auto;
    }

    @media (max-width: 800px) {
        .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
            gap: 24px;
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

    .plan-reviews {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 8px;
    }

    .review-count {
        font-family: "Outfit", sans-serif;
        font-size: 3rem;
        font-weight: 800;
        color: var(--fg);
        line-height: 1;
    }

    .pricing-card.popular .review-count {
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .review-label {
        font-size: 1.1rem;
        color: var(--gray-400);
    }

    .plan-price {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .price-amount {
        font-family: "Outfit", sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--fg);
        letter-spacing: -0.02em;
    }

    .price-per {
        font-size: 0.85rem;
        color: var(--gray-500);
        margin-left: 8px;
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

    /* Testimonial */
    .testimonial {
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
        padding: 32px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 12px;
    }

    .testimonial blockquote {
        font-family: "Outfit", sans-serif;
        font-size: 1.15rem;
        font-weight: 500;
        color: var(--gray-200);
        line-height: 1.6;
        font-style: italic;
        margin-bottom: 16px;
    }

    .testimonial cite {
        font-size: 0.9rem;
        color: var(--gray-500);
        font-style: normal;
    }
</style>
