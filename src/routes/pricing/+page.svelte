<script lang="ts">
    import { enhance } from "$app/forms";

    let loading = $state(false);
    let selectedPlan = $state<string | null>(null);

    const plans = [
        {
            id: 'starter',
            name: 'Starter',
            credits: 100,
            price: 49,
            apps: '1 app',
            rereviews: '+ 4 re-reviews',
            perApp: '$49/app',
            popular: false,
        },
        {
            id: 'pro',
            name: 'Pro',
            credits: 350,
            price: 129,
            apps: '3 apps',
            rereviews: '+ 8 re-reviews',
            perApp: '$43/app',
            popular: true,
        },
        {
            id: 'team',
            name: 'Team',
            credits: 750,
            price: 249,
            apps: '7 apps',
            rereviews: '+ 10 re-reviews',
            perApp: '$35.50/app',
            popular: false,
        },
        {
            id: 'agency',
            name: 'Agency',
            credits: 1500,
            price: 449,
            apps: '15 apps',
            rereviews: '+ 20 re-reviews',
            perApp: '$29.93/app',
            popular: false,
        },
    ];

    function selectPlan(planId: string) {
        selectedPlan = planId;
    }
</script>

<main class="pricing-page">
    <div class="container">
        <header class="pricing-header">
            <h1>Buy Credits</h1>
            <p class="subtitle">Pre-purchase credits and use them for app reviews and re-reviews</p>
        </header>

        <div class="pricing-grid">
            {#each plans as plan}
                <div class="pricing-card card" class:popular={plan.popular}>
                    {#if plan.popular}
                        <div class="popular-badge">Most Popular</div>
                    {/if}

                    <h3 class="plan-name">{plan.name}</h3>
                    <div class="plan-credits">
                        <span class="credits-amount">{plan.credits}</span>
                        <span class="credits-label">credits</span>
                    </div>
                    <div class="plan-price">
                        <span class="price-amount">${plan.price}</span>
                        <span class="price-per-app">{plan.perApp}</span>
                    </div>

                    <ul class="plan-features">
                        <li>✓ {plan.apps} full reviews</li>
                        <li>✓ {plan.rereviews}</li>
                        <li>✓ Credits never expire</li>
                        <li>✓ Use anytime</li>
                    </ul>

                    <form method="POST" action="?/buyCredits" use:enhance={() => {
                        loading = true;
                        selectedPlan = plan.id;
                        return async ({ result }) => {
                            loading = false;
                            if (result.type === 'redirect' && result.location) {
                                window.location.href = result.location;
                            }
                        };
                    }}>
                        <input type="hidden" name="plan" value={plan.id} />
                        <button
                            type="submit"
                            class="btn btn-primary btn-block"
                            class:btn-accent={plan.popular}
                            disabled={loading && selectedPlan === plan.id}
                        >
                            {loading && selectedPlan === plan.id ? 'Processing...' : `Buy ${plan.name}`}
                        </button>
                    </form>
                </div>
            {/each}
        </div>

        <div class="pricing-faq">
            <h2>How Credits Work</h2>
            <div class="faq-grid">
                <div class="faq-item">
                    <h4>Full Review</h4>
                    <p>100 credits for a complete app analysis</p>
                </div>
                <div class="faq-item">
                    <h4>Re-Review</h4>
                    <p>Only 25 credits to re-check after fixes</p>
                </div>
                <div class="faq-item">
                    <h4>Never Expire</h4>
                    <p>Use your credits whenever you need them</p>
                </div>
                <div class="faq-item">
                    <h4>Track Usage</h4>
                    <p>See your balance and history anytime</p>
                </div>
            </div>
        </div>
    </div>
</main>

<style>
    .pricing-page {
        padding: 120px 24px 80px;
        min-height: 100vh;
    }

    .pricing-header {
        text-align: center;
        margin-bottom: 3rem;
    }

    .pricing-header h1 {
        font-size: 2.5rem;
        margin-bottom: 0.75rem;
    }

    .subtitle {
        font-size: 1.1rem;
        color: var(--gray-300);
    }

    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
        margin-bottom: 4rem;
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
    }

    @media (max-width: 1000px) {
        .pricing-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .pricing-card {
        padding: 2rem 1.5rem;
        text-align: center;
        position: relative;
        transition: transform 0.2s var(--ease);
    }

    .pricing-card:hover {
        transform: translateY(-4px);
    }

    .pricing-card.popular {
        border-color: var(--accent);
        background: rgba(212, 168, 83, 0.04);
    }

    .popular-badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent);
        color: var(--bg);
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 12px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .plan-name {
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--gray-400);
        margin-bottom: 1rem;
    }

    .plan-credits {
        margin-bottom: 0.5rem;
    }

    .credits-amount {
        font-family: 'Outfit', sans-serif;
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--accent);
    }

    .credits-label {
        font-size: 0.9rem;
        color: var(--gray-500);
        margin-left: 0.5rem;
    }

    .plan-price {
        margin-bottom: 1.5rem;
    }

    .price-amount {
        font-size: 1.75rem;
        font-weight: 700;
        display: block;
        margin-bottom: 0.25rem;
    }

    .price-per-app {
        font-size: 0.85rem;
        color: var(--gray-500);
    }

    .plan-features {
        list-style: none;
        padding: 0;
        margin: 0 0 1.5rem 0;
        text-align: left;
    }

    .plan-features li {
        padding: 0.5rem 0;
        color: var(--gray-300);
        font-size: 0.9rem;
    }

    .btn-block {
        width: 100%;
    }

    .pricing-faq {
        max-width: 900px;
        margin: 0 auto;
        text-align: center;
    }

    .pricing-faq h2 {
        font-size: 1.5rem;
        margin-bottom: 2rem;
    }

    .faq-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
    }

    @media (max-width: 800px) {
        .faq-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .faq-item {
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .faq-item h4 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }

    .faq-item p {
        font-size: 0.9rem;
        color: var(--gray-400);
        line-height: 1.5;
    }

    @media (max-width: 600px) {
        .pricing-grid {
            grid-template-columns: 1fr;
        }
        .faq-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
