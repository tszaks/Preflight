<script lang="ts">
    import { enhance } from "$app/forms";

    let loading = $state(false);
    let selectedPlan = $state<string | null>(null);

    function handleSubmit(planId: string) {
        return () => {
            loading = true;
            selectedPlan = planId;
            return async ({ result }: { result: { type: string; location?: string } }) => {
                loading = false;
                if (result.type === "redirect" && result.location) {
                    window.location.href = result.location;
                }
            };
        };
    }
</script>

<main class="page">
    <!-- Decorative elements -->
    <div class="deco-line deco-line-1"></div>
    <div class="deco-line deco-line-2"></div>
    <div class="deco-corner deco-corner-tl"></div>
    <div class="deco-corner deco-corner-br"></div>

    <div class="layout">
        <!-- Left column: The pitch -->
        <div class="pitch-column">
            <div class="pitch-content">
                <p class="eyebrow">Preflight Review</p>

                <h1>
                    <span class="h1-line">8 days.</span>
                    <span class="h1-line h1-muted">That's what a rejection costs.</span>
                </h1>

                <p class="pitch-body">
                    Every App Store rejection means another week in limbo.
                    Preflight runs the same checks Apple does—metadata, privacy manifests,
                    screenshots, guidelines—and tells you what's wrong before you submit.
                </p>

                <div class="social-proof">
                    <blockquote>
                        "Caught 3 issues that would've been instant rejections."
                    </blockquote>
                    <cite>— Marcus J., iOS Developer</cite>
                </div>

                <div class="trust-badges">
                    <span class="trust-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Results in minutes
                    </span>
                    <span class="trust-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Credits never expire
                    </span>
                </div>
            </div>
        </div>

        <!-- Right column: The pricing -->
        <div class="pricing-column">
            <!-- Pro - The Hero (center, dominant) -->
            <div class="plan-card plan-pro">
                <div class="plan-label">
                    <span class="label-text">Recommended</span>
                </div>

                <div class="plan-reviews">
                    <span class="reviews-number">3</span>
                    <span class="reviews-word">Reviews</span>
                </div>

                <div class="plan-price">
                    <span class="price-per">$43</span>
                    <span class="price-unit">per review</span>
                </div>

                <div class="plan-total">$129 total</div>

                <form method="POST" action="?/buyCredits" use:enhance={handleSubmit("pro")}>
                    <input type="hidden" name="plan" value="pro" />
                    <button type="submit" class="plan-cta cta-gold" disabled={loading && selectedPlan === "pro"}>
                        {#if loading && selectedPlan === "pro"}
                            <span class="spinner"></span>
                        {:else}
                            Get Started
                        {/if}
                    </button>
                </form>
            </div>

            <!-- Other plans row -->
            <div class="other-plans">
                <!-- Starter -->
                <div class="plan-card plan-standard">
                    <span class="plan-name">Starter</span>
                    <div class="plan-reviews-sm">
                        <span class="reviews-number-sm">1</span>
                        <span class="reviews-word-sm">Review</span>
                    </div>
                    <div class="plan-price-sm">$49</div>

                    <form method="POST" action="?/buyCredits" use:enhance={handleSubmit("starter")}>
                        <input type="hidden" name="plan" value="starter" />
                        <button type="submit" class="plan-cta cta-outline" disabled={loading && selectedPlan === "starter"}>
                            {#if loading && selectedPlan === "starter"}
                                <span class="spinner"></span>
                            {:else}
                                Select
                            {/if}
                        </button>
                    </form>
                </div>

                <!-- Agency -->
                <div class="plan-card plan-standard">
                    <span class="plan-name">Agency</span>
                    <div class="plan-reviews-sm">
                        <span class="reviews-number-sm">15</span>
                        <span class="reviews-word-sm">Reviews</span>
                    </div>
                    <div class="plan-price-sm">$30<span class="price-unit-sm">/review</span></div>
                    <div class="plan-total-sm">$449 total</div>

                    <form method="POST" action="?/buyCredits" use:enhance={handleSubmit("agency")}>
                        <input type="hidden" name="plan" value="agency" />
                        <button type="submit" class="plan-cta cta-outline" disabled={loading && selectedPlan === "agency"}>
                            {#if loading && selectedPlan === "agency"}
                                <span class="spinner"></span>
                            {:else}
                                Select
                            {/if}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- What's included - horizontal strip -->
    <section class="includes-section">
        <h2 class="includes-title">Every review analyzes</h2>
        <div class="includes-list">
            <span class="include-item">Metadata</span>
            <span class="include-sep">·</span>
            <span class="include-item">Screenshots</span>
            <span class="include-sep">·</span>
            <span class="include-item">Privacy Manifest</span>
            <span class="include-sep">·</span>
            <span class="include-item">Info.plist</span>
            <span class="include-sep">·</span>
            <span class="include-item">URLs</span>
            <span class="include-sep">·</span>
            <span class="include-item">Apple Guidelines</span>
        </div>
    </section>
</main>

<style>
    /* === Page === */
    .page {
        min-height: 100vh;
        padding: 60px 48px 80px;
        position: relative;
        overflow: hidden;
    }

    /* === Decorative Lines === */
    .deco-line {
        position: absolute;
        background: var(--accent);
        opacity: 0.15;
        pointer-events: none;
    }

    .deco-line-1 {
        width: 1px;
        height: 200px;
        top: 0;
        left: 15%;
    }

    .deco-line-2 {
        width: 300px;
        height: 1px;
        bottom: 20%;
        right: 0;
    }

    .deco-corner {
        position: absolute;
        width: 80px;
        height: 80px;
        border: 1px solid var(--accent);
        opacity: 0.1;
        pointer-events: none;
    }

    .deco-corner-tl {
        top: 40px;
        left: 40px;
        border-right: none;
        border-bottom: none;
    }

    .deco-corner-br {
        bottom: 40px;
        right: 40px;
        border-left: none;
        border-top: none;
    }

    /* === Two-Column Layout === */
    .layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        max-width: 1200px;
        margin: 0 auto;
        min-height: calc(100vh - 280px);
        align-items: center;
    }

    /* === Left Column: Pitch === */
    .pitch-column {
        padding-right: 40px;
    }

    .pitch-content {
        max-width: 480px;
    }

    .eyebrow {
        font-family: 'Instrument Mono', monospace;
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 24px;
    }

    h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 3.5rem;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.03em;
        margin-bottom: 32px;
    }

    .h1-line {
        display: block;
    }

    .h1-muted {
        color: var(--gray-500);
        font-size: 0.6em;
        font-weight: 500;
        letter-spacing: -0.01em;
        margin-top: 8px;
    }

    .pitch-body {
        font-size: 1.1rem;
        line-height: 1.7;
        color: var(--gray-300);
        margin-bottom: 40px;
    }

    .social-proof {
        margin-bottom: 40px;
        padding-left: 20px;
        border-left: 2px solid var(--accent);
    }

    .social-proof blockquote {
        font-family: 'Outfit', sans-serif;
        font-size: 1.15rem;
        font-weight: 500;
        font-style: italic;
        color: var(--gray-100);
        margin-bottom: 8px;
    }

    .social-proof cite {
        font-size: 0.85rem;
        color: var(--gray-500);
        font-style: normal;
    }

    .trust-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
    }

    .trust-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
        color: var(--gray-400);
    }

    .trust-badge svg {
        color: var(--accent);
    }

    /* === Right Column: Pricing === */
    .pricing-column {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    /* === Pro Card (Hero) === */
    .plan-pro {
        background: linear-gradient(135deg, rgba(212, 168, 83, 0.08) 0%, rgba(12, 12, 15, 0.95) 100%);
        border: 2px solid var(--accent);
        border-radius: 16px;
        padding: 48px 40px;
        text-align: center;
        position: relative;
        box-shadow:
            0 0 0 1px rgba(212, 168, 83, 0.1),
            0 25px 50px -12px rgba(0, 0, 0, 0.6),
            0 0 100px -30px rgba(212, 168, 83, 0.2);
    }

    .plan-label {
        position: absolute;
        top: -1px;
        left: 50%;
        transform: translateX(-50%);
    }

    .label-text {
        display: inline-block;
        background: var(--accent);
        color: #000;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.55rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        padding: 8px 24px;
        border-radius: 0 0 8px 8px;
    }

    .plan-reviews {
        margin-bottom: 20px;
        margin-top: 16px;
    }

    .reviews-number {
        font-family: 'Outfit', sans-serif;
        font-size: 8rem;
        font-weight: 800;
        line-height: 1;
        background: linear-gradient(180deg, #fff 0%, var(--accent) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .reviews-word {
        display: block;
        font-family: 'Instrument Sans', sans-serif;
        font-size: 1.2rem;
        color: var(--gray-300);
        margin-top: -8px;
    }

    .plan-price {
        margin-bottom: 8px;
    }

    .price-per {
        font-family: 'Outfit', sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--fg);
    }

    .price-unit {
        font-size: 0.9rem;
        color: var(--gray-500);
        margin-left: 4px;
    }

    .plan-total {
        font-size: 0.85rem;
        color: var(--gray-500);
        margin-bottom: 32px;
    }

    /* === Standard Cards (Starter/Agency) === */
    .other-plans {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    .plan-standard {
        background: var(--surface-1);
        border: 1px solid var(--border-default);
        border-radius: 12px;
        padding: 28px 24px;
        text-align: center;
        transition: border-color 0.2s, transform 0.2s;
    }

    .plan-standard:hover {
        border-color: var(--border-hover);
        transform: translateY(-2px);
    }

    .plan-name {
        display: block;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.6rem;
        font-weight: 600;
        color: var(--gray-500);
        text-transform: uppercase;
        letter-spacing: 0.15em;
        margin-bottom: 16px;
    }

    .plan-reviews-sm {
        margin-bottom: 12px;
    }

    .reviews-number-sm {
        font-family: 'Outfit', sans-serif;
        font-size: 3rem;
        font-weight: 800;
        color: var(--fg);
        line-height: 1;
    }

    .reviews-word-sm {
        display: block;
        font-size: 0.85rem;
        color: var(--gray-400);
    }

    .plan-price-sm {
        font-family: 'Outfit', sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--fg);
        margin-bottom: 4px;
    }

    .price-unit-sm {
        font-size: 0.75rem;
        color: var(--gray-500);
        font-weight: 400;
    }

    .plan-total-sm {
        font-size: 0.75rem;
        color: var(--gray-600);
        margin-bottom: 20px;
    }

    .plan-standard .plan-price-sm:last-of-type {
        margin-bottom: 20px;
    }

    /* === CTAs === */
    .plan-cta {
        width: 100%;
        padding: 14px 24px;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.25s var(--ease);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
    }

    .cta-gold {
        background: var(--accent);
        color: #000;
    }

    .cta-gold:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(212, 168, 83, 0.4);
    }

    .cta-outline {
        background: transparent;
        color: var(--fg);
        border: 1px solid var(--border-hover);
    }

    .cta-outline:hover:not(:disabled) {
        border-color: var(--accent);
        background: rgba(212, 168, 83, 0.05);
    }

    .plan-cta:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* === Includes Section === */
    .includes-section {
        max-width: 1200px;
        margin: 80px auto 0;
        text-align: center;
        padding-top: 48px;
        border-top: 1px solid var(--border-default);
    }

    .includes-title {
        font-family: 'Instrument Mono', monospace;
        font-size: 0.6rem;
        font-weight: 600;
        color: var(--gray-600);
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 20px;
    }

    .includes-list {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 12px;
        color: var(--gray-400);
        font-size: 0.95rem;
    }

    .include-item {
        color: var(--gray-300);
    }

    .include-sep {
        color: var(--gray-700);
    }

    /* === Responsive === */
    @media (max-width: 1000px) {
        .layout {
            grid-template-columns: 1fr;
            gap: 60px;
            text-align: center;
        }

        .pitch-column {
            padding-right: 0;
        }

        .pitch-content {
            max-width: 100%;
        }

        h1 {
            font-size: 2.75rem;
        }

        .social-proof {
            border-left: none;
            padding-left: 0;
            border-top: 2px solid var(--accent);
            padding-top: 20px;
            text-align: center;
        }

        .trust-badges {
            justify-content: center;
        }

        .reviews-number {
            font-size: 6rem;
        }

        .deco-line-1,
        .deco-corner {
            display: none;
        }
    }

    @media (max-width: 600px) {
        .page {
            padding: 40px 20px 60px;
        }

        h1 {
            font-size: 2.25rem;
        }

        .plan-pro {
            padding: 40px 24px;
        }

        .reviews-number {
            font-size: 5rem;
        }

        .other-plans {
            grid-template-columns: 1fr;
        }

        .includes-list {
            flex-direction: column;
            gap: 8px;
        }

        .include-sep {
            display: none;
        }
    }
</style>
