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
    <!-- Ambient background -->
    <div class="ambient-glow"></div>
    <div class="runway-lines"></div>

    <div class="container">
        <!-- Header with loss aversion integrated elegantly -->
        <header class="pricing-header">
            <div class="stat-callout">
                <span class="stat-number">8</span>
                <span class="stat-label">days lost<br/>per rejection</span>
            </div>

            <h1>
                <span class="headline-pre">Know before</span>
                <span class="headline-main">Apple does.</span>
            </h1>

            <p class="subheadline">
                The same review Apple runs. In minutes, not weeks.
            </p>
        </header>

        <!-- Pricing cards with dramatic Pro dominance -->
        <div class="pricing-layout">
            <!-- Starter - Understated -->
            <div class="pricing-card tier-standard">
                <div class="card-inner">
                    <span class="tier-label">Starter</span>

                    <div class="review-display">
                        <span class="review-num">1</span>
                        <span class="review-text">Review</span>
                    </div>

                    <div class="price-anchor">
                        <span class="anchor-price">$49</span>
                        <span class="anchor-unit">per review</span>
                    </div>

                    <form
                        method="POST"
                        action="?/buyCredits"
                        use:enhance={() => {
                            loading = true;
                            selectedPlan = "starter";
                            return async ({ result }) => {
                                loading = false;
                                if (result.type === "redirect" && result.location) {
                                    window.location.href = result.location;
                                }
                            };
                        }}
                    >
                        <input type="hidden" name="plan" value="starter" />
                        <button type="submit" class="cta-btn cta-secondary" disabled={loading && selectedPlan === "starter"}>
                            {#if loading && selectedPlan === "starter"}
                                <span class="loading-dot"></span>
                            {:else}
                                Review My App
                            {/if}
                        </button>
                    </form>
                </div>
            </div>

            <!-- Pro - The Hero -->
            <div class="pricing-card tier-pro">
                <div class="pro-badge-wrap">
                    <span class="pro-badge">Recommended</span>
                </div>
                <div class="card-inner">
                    <span class="tier-label">Pro</span>

                    <div class="review-display">
                        <span class="review-num">3</span>
                        <span class="review-text">Reviews</span>
                    </div>

                    <div class="price-anchor">
                        <div class="savings-tag">Save $18</div>
                        <span class="anchor-price">$43</span>
                        <span class="anchor-unit">per review</span>
                    </div>

                    <div class="total-line">$129 total</div>

                    <form
                        method="POST"
                        action="?/buyCredits"
                        use:enhance={() => {
                            loading = true;
                            selectedPlan = "pro";
                            return async ({ result }) => {
                                loading = false;
                                if (result.type === "redirect" && result.location) {
                                    window.location.href = result.location;
                                }
                            };
                        }}
                    >
                        <input type="hidden" name="plan" value="pro" />
                        <button type="submit" class="cta-btn cta-primary" disabled={loading && selectedPlan === "pro"}>
                            {#if loading && selectedPlan === "pro"}
                                <span class="loading-dot"></span>
                            {:else}
                                Review My Apps
                            {/if}
                        </button>
                    </form>

                    <span class="pro-note">Most developers choose this</span>
                </div>
            </div>

            <!-- Agency - Premium understated -->
            <div class="pricing-card tier-standard">
                <div class="card-inner">
                    <span class="tier-label">Agency</span>

                    <div class="review-display">
                        <span class="review-num">15</span>
                        <span class="review-text">Reviews</span>
                    </div>

                    <div class="price-anchor">
                        <div class="savings-tag">Best value</div>
                        <span class="anchor-price">$30</span>
                        <span class="anchor-unit">per review</span>
                    </div>

                    <div class="total-line">$449 total</div>

                    <form
                        method="POST"
                        action="?/buyCredits"
                        use:enhance={() => {
                            loading = true;
                            selectedPlan = "agency";
                            return async ({ result }) => {
                                loading = false;
                                if (result.type === "redirect" && result.location) {
                                    window.location.href = result.location;
                                }
                            };
                        }}
                    >
                        <input type="hidden" name="plan" value="agency" />
                        <button type="submit" class="cta-btn cta-secondary" disabled={loading && selectedPlan === "agency"}>
                            {#if loading && selectedPlan === "agency"}
                                <span class="loading-dot"></span>
                            {:else}
                                Review My Apps
                            {/if}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Trust strip -->
        <div class="trust-strip">
            <div class="trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Results in minutes</span>
            </div>
            <div class="trust-divider"></div>
            <div class="trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Credits never expire</span>
            </div>
            <div class="trust-divider"></div>
            <div class="trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Instant delivery</span>
            </div>
        </div>

        <!-- Social proof integrated -->
        <section class="validation-section">
            <div class="quote-block">
                <div class="quote-accent"></div>
                <blockquote>
                    "Caught 3 issues that would've been instant rejections.
                    <span class="quote-highlight">Paid for itself in saved dev time alone.</span>"
                </blockquote>
                <div class="quote-attribution">
                    <div class="attr-avatar">MJ</div>
                    <div class="attr-details">
                        <span class="attr-name">Marcus Jenkins</span>
                        <span class="attr-role">Senior iOS Developer, Fintech Startup</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- What's included - elegant grid -->
        <section class="included-section">
            <div class="included-header">
                <h2>Every review includes</h2>
                <div class="header-line"></div>
            </div>

            <div class="included-grid">
                <div class="included-item">
                    <div class="item-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <path d="M9 9h6M9 13h6M9 17h4"/>
                        </svg>
                    </div>
                    <div class="item-content">
                        <h4>Metadata Analysis</h4>
                        <p>App name, subtitle, keywords, and description validation</p>
                    </div>
                </div>

                <div class="included-item">
                    <div class="item-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                    </div>
                    <div class="item-content">
                        <h4>Screenshot Compliance</h4>
                        <p>Size, format, and content checks for all device sizes</p>
                    </div>
                </div>

                <div class="included-item">
                    <div class="item-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                    <div class="item-content">
                        <h4>Privacy Manifest</h4>
                        <p>API declarations, tracking domains, and reason codes</p>
                    </div>
                </div>

                <div class="included-item">
                    <div class="item-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                        </svg>
                    </div>
                    <div class="item-content">
                        <h4>Info.plist Review</h4>
                        <p>Required keys, permissions, and version string verification</p>
                    </div>
                </div>

                <div class="included-item">
                    <div class="item-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                        </svg>
                    </div>
                    <div class="item-content">
                        <h4>URL Verification</h4>
                        <p>Support and privacy policy link reachability tests</p>
                    </div>
                </div>

                <div class="included-item">
                    <div class="item-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                        </svg>
                    </div>
                    <div class="item-content">
                        <h4>AI Guidelines Review</h4>
                        <p>Deep analysis against Apple's latest Review Guidelines</p>
                    </div>
                </div>
            </div>
        </section>
    </div>
</main>

<style>
    /* === Page Layout === */
    .pricing-page {
        min-height: 100vh;
        padding: 80px 24px 120px;
        position: relative;
        overflow: hidden;
    }

    .container {
        max-width: 1100px;
        margin: 0 auto;
        position: relative;
        z-index: 1;
    }

    /* === Ambient Background === */
    .ambient-glow {
        position: absolute;
        top: -200px;
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
        z-index: 0;
    }

    .runway-lines {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 400px;
        background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(212, 168, 83, 0.15) 20%,
            rgba(212, 168, 83, 0.3) 50%,
            rgba(212, 168, 83, 0.15) 80%,
            transparent 100%
        );
        z-index: 0;
    }

    .runway-lines::before,
    .runway-lines::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 6px;
        height: 6px;
        background: var(--accent);
        border-radius: 50%;
        opacity: 0.4;
    }

    .runway-lines::before {
        left: -30px;
    }

    .runway-lines::after {
        right: -30px;
    }

    /* === Header === */
    .pricing-header {
        text-align: center;
        margin-bottom: 80px;
        position: relative;
    }

    .stat-callout {
        display: inline-flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 32px;
        padding: 12px 24px;
        background: rgba(212, 168, 83, 0.06);
        border: 1px solid rgba(212, 168, 83, 0.15);
        border-radius: 4px;
    }

    .stat-number {
        font-family: 'Outfit', sans-serif;
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--accent);
        line-height: 1;
    }

    .stat-label {
        font-family: 'Instrument Sans', sans-serif;
        font-size: 0.85rem;
        color: var(--gray-400);
        text-align: left;
        line-height: 1.3;
    }

    .pricing-header h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 4rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        line-height: 1.05;
        margin-bottom: 20px;
    }

    .headline-pre {
        display: block;
        color: var(--gray-300);
        font-weight: 600;
        font-size: 0.5em;
        letter-spacing: -0.02em;
    }

    .headline-main {
        display: block;
        background: linear-gradient(135deg, #fff 0%, #D4A853 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .subheadline {
        font-size: 1.25rem;
        color: var(--gray-400);
        max-width: 400px;
        margin: 0 auto;
        line-height: 1.5;
    }

    /* === Pricing Layout - Pro as Hero === */
    .pricing-layout {
        display: grid;
        grid-template-columns: 1fr 1.15fr 1fr;
        gap: 24px;
        max-width: 950px;
        margin: 0 auto 48px;
        align-items: end;
    }

    /* === Card Base === */
    .pricing-card {
        position: relative;
        border-radius: 16px;
        transition: transform 0.4s var(--ease), box-shadow 0.4s var(--ease);
    }

    .card-inner {
        padding: 36px 28px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    /* === Standard Tier (Starter/Agency) === */
    .tier-standard {
        background: var(--surface-1);
        border: 1px solid var(--border-default);
    }

    .tier-standard:hover {
        transform: translateY(-4px);
        border-color: var(--border-hover);
    }

    .tier-standard .tier-label {
        font-family: 'Instrument Mono', monospace;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--gray-500);
        text-transform: uppercase;
        letter-spacing: 0.15em;
        margin-bottom: 24px;
    }

    .tier-standard .review-num {
        font-family: 'Outfit', sans-serif;
        font-size: 4rem;
        font-weight: 800;
        color: var(--fg);
        line-height: 1;
    }

    .tier-standard .review-text {
        display: block;
        font-size: 1rem;
        color: var(--gray-400);
        margin-bottom: 24px;
    }

    .tier-standard .anchor-price {
        font-family: 'Outfit', sans-serif;
        font-size: 2rem;
        font-weight: 700;
        color: var(--fg);
    }

    .tier-standard .anchor-unit {
        font-size: 0.85rem;
        color: var(--gray-500);
        display: block;
        margin-top: 2px;
    }

    /* === Pro Tier - The Hero === */
    .tier-pro {
        background: linear-gradient(
            180deg,
            rgba(212, 168, 83, 0.12) 0%,
            rgba(212, 168, 83, 0.04) 30%,
            var(--surface-1) 100%
        );
        border: 2px solid var(--accent);
        box-shadow:
            0 0 0 1px rgba(212, 168, 83, 0.1),
            0 20px 50px -10px rgba(0, 0, 0, 0.5),
            0 0 80px -20px rgba(212, 168, 83, 0.25);
    }

    .tier-pro:hover {
        transform: translateY(-6px);
        box-shadow:
            0 0 0 1px rgba(212, 168, 83, 0.2),
            0 30px 60px -10px rgba(0, 0, 0, 0.6),
            0 0 100px -20px rgba(212, 168, 83, 0.35);
    }

    .tier-pro .card-inner {
        padding: 48px 32px;
    }

    .pro-badge-wrap {
        position: absolute;
        top: -14px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
    }

    .pro-badge {
        display: inline-block;
        background: var(--accent);
        color: #000;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        padding: 8px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 16px rgba(212, 168, 83, 0.4);
    }

    .tier-pro .tier-label {
        font-family: 'Instrument Mono', monospace;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 28px;
    }

    .tier-pro .review-num {
        font-family: 'Outfit', sans-serif;
        font-size: 6rem;
        font-weight: 800;
        background: linear-gradient(135deg, #fff 20%, #D4A853 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
    }

    .tier-pro .review-text {
        display: block;
        font-size: 1.1rem;
        color: var(--gray-300);
        margin-bottom: 28px;
    }

    .tier-pro .anchor-price {
        font-family: 'Outfit', sans-serif;
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--fg);
    }

    .tier-pro .anchor-unit {
        font-size: 0.9rem;
        color: var(--gray-400);
        display: block;
        margin-top: 4px;
    }

    /* === Price Displays === */
    .price-anchor {
        margin-bottom: 20px;
        position: relative;
    }

    .savings-tag {
        font-family: 'Instrument Mono', monospace;
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 4px;
    }

    .total-line {
        font-size: 0.85rem;
        color: var(--gray-500);
        margin-bottom: 28px;
    }

    .pro-note {
        font-size: 0.75rem;
        color: var(--gray-500);
        margin-top: 16px;
    }

    /* === CTAs === */
    .cta-btn {
        width: 100%;
        padding: 16px 24px;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s var(--ease);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 52px;
    }

    .cta-primary {
        background: var(--accent);
        color: #000;
    }

    .cta-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(212, 168, 83, 0.4);
    }

    .cta-secondary {
        background: transparent;
        color: var(--fg);
        border: 1px solid var(--border-hover);
    }

    .cta-secondary:hover:not(:disabled) {
        border-color: var(--accent);
        background: rgba(212, 168, 83, 0.06);
    }

    .cta-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .loading-dot {
        width: 6px;
        height: 6px;
        background: currentColor;
        border-radius: 50%;
        animation: pulse 1s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
    }

    /* === Trust Strip === */
    .trust-strip {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 32px;
        margin-bottom: 80px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .trust-item {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--gray-400);
        font-size: 0.9rem;
    }

    .trust-item svg {
        color: var(--accent);
        opacity: 0.8;
    }

    .trust-divider {
        width: 1px;
        height: 20px;
        background: var(--border-default);
    }

    /* === Validation Section === */
    .validation-section {
        max-width: 700px;
        margin: 0 auto 100px;
    }

    .quote-block {
        position: relative;
        padding: 40px 48px;
        background: var(--surface-1);
        border: 1px solid var(--border-default);
        border-radius: 12px;
    }

    .quote-accent {
        position: absolute;
        top: 0;
        left: 40px;
        width: 60px;
        height: 4px;
        background: var(--accent);
        border-radius: 0 0 4px 4px;
    }

    .quote-block blockquote {
        font-family: 'Outfit', sans-serif;
        font-size: 1.4rem;
        font-weight: 500;
        line-height: 1.6;
        color: var(--gray-100);
        margin-bottom: 28px;
    }

    .quote-highlight {
        color: var(--accent);
        font-weight: 600;
    }

    .quote-attribution {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .attr-avatar {
        width: 44px;
        height: 44px;
        background: var(--surface-3);
        border: 1px solid var(--border-default);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Instrument Mono', monospace;
        font-weight: 700;
        font-size: 0.85rem;
        color: var(--accent);
    }

    .attr-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .attr-name {
        font-weight: 600;
        color: var(--fg);
        font-size: 0.95rem;
    }

    .attr-role {
        font-size: 0.8rem;
        color: var(--gray-500);
    }

    /* === Included Section === */
    .included-section {
        max-width: 900px;
        margin: 0 auto;
    }

    .included-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 40px;
    }

    .included-header h2 {
        font-family: 'Outfit', sans-serif;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--gray-400);
        white-space: nowrap;
    }

    .header-line {
        flex: 1;
        height: 1px;
        background: var(--border-default);
    }

    .included-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
    }

    .included-item {
        display: flex;
        gap: 16px;
        padding: 24px;
        background: rgba(255, 255, 255, 0.015);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 10px;
        transition: background 0.2s, border-color 0.2s;
    }

    .included-item:hover {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.08);
    }

    .item-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(212, 168, 83, 0.08);
        border-radius: 8px;
        color: var(--accent);
    }

    .item-content h4 {
        font-family: 'Outfit', sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--fg);
        margin-bottom: 6px;
    }

    .item-content p {
        font-size: 0.8rem;
        color: var(--gray-500);
        line-height: 1.5;
    }

    /* === Responsive === */
    @media (max-width: 900px) {
        .pricing-layout {
            grid-template-columns: 1fr;
            max-width: 380px;
            gap: 32px;
        }

        .tier-pro {
            order: -1;
        }

        .included-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .pricing-header h1 {
            font-size: 3rem;
        }
    }

    @media (max-width: 650px) {
        .pricing-page {
            padding: 60px 20px 80px;
        }

        .trust-strip {
            flex-direction: column;
            gap: 16px;
        }

        .trust-divider {
            width: 40px;
            height: 1px;
        }

        .included-grid {
            grid-template-columns: 1fr;
        }

        .quote-block {
            padding: 32px 24px;
        }

        .quote-block blockquote {
            font-size: 1.15rem;
        }

        .pricing-header h1 {
            font-size: 2.5rem;
        }

        .stat-callout {
            flex-direction: column;
            gap: 4px;
            text-align: center;
        }

        .stat-label {
            text-align: center;
        }
    }
</style>
