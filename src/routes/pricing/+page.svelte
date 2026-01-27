<script lang="ts">
    import { enhance } from "$app/forms";

    let loading = $state(false);
    let selectedPlan = $state<string | null>(null);

    const plans = [
        {
            id: "starter",
            name: "Starter",
            credits: 100,
            price: 49,
            reviews: "1 full review",
            savings: null,
            description: "Perfect for launching your first app",
        },
        {
            id: "pro",
            name: "Pro",
            credits: 350,
            price: 129,
            reviews: "3 full reviews",
            savings: "Save 12%",
            description: "For developers shipping regularly",
            popular: true,
        },
        {
            id: "agency",
            name: "Agency",
            credits: 1500,
            price: 449,
            reviews: "15 full reviews",
            savings: "Save 39%",
            description: "For agencies managing multiple apps",
        },
    ];

    function selectPlan(planId: string) {
        selectedPlan = planId;
    }
</script>

<main class="pricing-page">
    <div class="container">
        <header class="pricing-header">
            <div class="section-label">Pricing</div>
            <h1>Buy credits, review apps.</h1>
            <p class="header-sub">
                No subscriptions. No expiration. Just reviews when you need them.
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

        <div class="pricing-info">
            <h2>How credits work</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                    </div>
                    <h4>100 credits = 1 review</h4>
                    <p>Each full app review uses 100 credits. Simple math, no surprises.</p>
                </div>
                <div class="info-item">
                    <div class="info-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h4>Always up to date</h4>
                    <p>We check against Apple's latest guidelines so you catch issues before Apple does.</p>
                </div>
                <div class="info-item">
                    <div class="info-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"/>
                            <path d="M7 7h10M7 12h10M7 17h6"/>
                        </svg>
                    </div>
                    <h4>No expiration</h4>
                    <p>Buy credits when you need them. They stay in your account until you use them.</p>
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
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-top: 12px;
    }

    .header-sub {
        font-size: 1.15rem;
        color: var(--gray-300);
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

    /* How credits work section */
    .pricing-info {
        max-width: 900px;
        margin: 0 auto;
        text-align: center;
    }

    .pricing-info h2 {
        font-family: "Outfit", sans-serif;
        font-size: 1.75rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin-bottom: 32px;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
    }

    @media (max-width: 700px) {
        .info-grid {
            grid-template-columns: 1fr;
        }
    }

    .info-item {
        text-align: left;
        padding: 20px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 12px;
    }

    .info-icon {
        color: var(--accent);
        margin-bottom: 12px;
        opacity: 0.8;
    }

    .info-item h4 {
        font-family: "Outfit", sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: var(--fg);
        margin-bottom: 8px;
    }

    .info-item p {
        font-size: 0.85rem;
        color: var(--gray-400);
        line-height: 1.5;
    }
</style>
