<script lang="ts">
    import { enhance } from "$app/forms";
    import CockpitPanel from "$lib/components/CockpitPanel.svelte";

    let loading = $state(false);
    let selectedPlan = $state<string | null>(null);

    const plans = [
        {
            id: "starter",
            name: "Starter",
            credits: 100,
            price: 49,
            apps: "1 app",
            rereviews: "+ 4 re-reviews",
            perApp: "$49/app",
            popular: false,
        },
        {
            id: "pro",
            name: "Pro",
            credits: 350,
            price: 129,
            apps: "3 apps",
            rereviews: "+ 8 re-reviews",
            perApp: "$43/app",
            popular: true,
        },
        {
            id: "team",
            name: "Team",
            credits: 750,
            price: 249,
            apps: "7 apps",
            rereviews: "+ 10 re-reviews",
            perApp: "$35.50/app",
            popular: false,
        },
        {
            id: "agency",
            name: "Agency",
            credits: 1500,
            price: 449,
            apps: "15 apps",
            rereviews: "+ 20 re-reviews",
            perApp: "$29.93/app",
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
            <div class="user-id">ACCESS_PROTOCOL // V2.1</div>
            <h1>Credit Acquisition</h1>
            <p class="step-meta">CMD_CREDIT_PROVISIONING // SEQ_SYS_INIT</p>
        </header>

        <div class="pricing-grid">
            {#each plans as plan}
                <CockpitPanel
                    class="pricing-card"
                    variant={plan.popular ? "elevated" : "default"}
                    active={plan.popular}
                >
                    {#if plan.popular}
                        <div class="popular-badge">MOST POPULAR</div>
                    {/if}

                    <div class="plan-id">PLAN_{plan.name.toUpperCase()}</div>
                    <div class="plan-credits">
                        <span class="credits-amount">{plan.credits}</span>
                        <span class="credits-label">CREDITS</span>
                    </div>
                    <div class="plan-price">
                        <span class="price-amount">${plan.price}</span>
                        <span class="price-per-app"
                            >{plan.perApp} PER DIAGNOSTIC</span
                        >
                    </div>

                    <ul class="plan-features">
                        <li>
                            <span class="feat-marker">>></span>
                            {plan.credits / 100} FULL DIAGNOSTICS
                        </li>
                        <li>
                            <span class="feat-marker">>></span> MISSION CRITICAL
                            CHECKS
                        </li>
                        <li>
                            <span class="feat-marker">>></span> NO EXPIRATION
                        </li>
                    </ul>

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
                            class="btn btn-full"
                            class:btn-primary={!plan.popular}
                            class:btn-accent={plan.popular}
                            disabled={loading && selectedPlan === plan.id}
                        >
                            {loading && selectedPlan === plan.id
                                ? "INITIALIZING..."
                                : `ACQUIRE_PLAN: ${plan.name.toUpperCase()}`}
                        </button>
                    </form>
                </CockpitPanel>
            {/each}
        </div>

        <div class="pricing-faq">
            <div class="section-label">PROTOCOL_PARAMETERS</div>
            <h2>Operational Logistics</h2>
            <div class="faq-grid">
                <CockpitPanel class="faq-item">
                    <span class="faq-id">LOG_01</span>
                    <h4>Full Diagnostic</h4>
                    <p>
                        Standardized deep-scan consumption rate: 100 credits per
                        analyze.
                    </p>
                </CockpitPanel>
                <CockpitPanel class="faq-item">
                    <span class="faq-id">LOG_02</span>
                    <h4>Data Integrity</h4>
                    <p>
                        High-fidelity checks against latest App Store
                        strictures.
                    </p>
                </CockpitPanel>
                <CockpitPanel class="faq-item">
                    <span class="faq-id">LOG_03</span>
                    <h4>Active Readiness</h4>
                    <p>
                        Credits remain active in your profile until mission
                        deployment.
                    </p>
                </CockpitPanel>
                <CockpitPanel class="faq-item">
                    <span class="faq-id">LOG_04</span>
                    <h4>Telemetry History</h4>
                    <p>
                        Full audit log of all diagnostics available in
                        dashboard.
                    </p>
                </CockpitPanel>
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
        font-family: "Outfit", sans-serif;
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-top: 8px;
    }

    .user-id {
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--accent);
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .step-meta {
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--gray-600);
        letter-spacing: 0.1em;
        margin-top: 4px;
        text-transform: uppercase;
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
        padding: 32px !important;
        text-align: center;
        transition: all 0.4s var(--ease);
    }

    .pricing-card:hover {
        transform: translateY(-4px);
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

    .plan-id {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--gray-600);
        margin-bottom: 24px;
    }

    .plan-credits {
        margin-bottom: 0.5rem;
    }

    .credits-amount {
        font-family: "Outfit", sans-serif;
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
        font-family: "Instrument Mono", monospace;
        font-size: 1.5rem;
        font-weight: 700;
        display: block;
        margin-bottom: 4px;
        color: var(--gray-100);
    }

    .price-per-app {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--gray-600);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .plan-features {
        list-style: none;
        padding: 0;
        margin: 0 0 1.5rem 0;
        text-align: left;
    }

    .plan-features li {
        padding: 8px 0;
        color: var(--gray-400);
        font-size: 0.8rem;
        font-family: "Instrument Mono", monospace;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
    }

    .feat-marker {
        color: var(--accent);
        margin-right: 8px;
        opacity: 0.5;
    }

    .btn-full {
        width: 100%;
    }

    .pricing-faq {
        max-width: 900px;
        margin: 0 auto;
        text-align: center;
    }

    .pricing-faq h2 {
        font-family: "Outfit", sans-serif;
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-top: 8px;
        margin-bottom: 3rem;
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
        padding: 24px !important;
        text-align: left;
    }

    .faq-id {
        font-family: "Instrument Mono", monospace;
        font-size: 0.55rem;
        font-weight: 700;
        color: var(--accent);
        opacity: 0.5;
        display: block;
        margin-bottom: 8px;
    }

    .faq-item h4 {
        font-family: "Outfit", sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--gray-100);
        margin-bottom: 8px;
    }

    .faq-item p {
        font-size: 0.85rem;
        color: var(--gray-400);
        line-height: 1.6;
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
