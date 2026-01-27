<script lang="ts">
    import { onMount } from "svelte";

    let visible = $state(false);
    onMount(() => setTimeout(() => (visible = true), 100));

    const plans = [
        { name: 'Starter', credits: 100, price: 49, apps: '1 app', perApp: '$49/app' },
        { name: 'Pro', credits: 350, price: 129, apps: '3 apps', perApp: '$43/app', popular: true },
        { name: 'Team', credits: 750, price: 249, apps: '7 apps', perApp: '$35.50/app' },
        { name: 'Agency', credits: 1500, price: 449, apps: '15 apps', perApp: '$29.93/app' },
    ];
</script>

<main>
    <section class="hero">
        <div class="container hero-content" class:visible>
            <span class="badge">For indie iOS developers</span>
            <h1>Never get rejected for something <span class="highlight">you could've caught.</span></h1>
            <p class="description">
                Preflight runs 50+ of Apple's review checks on your submission before you hit Send.
                Fix issues in minutes, not weeks.
            </p>

            <div class="cta-buttons">
                <a href="/auth/signup" class="btn btn-primary btn-lg">
                    Get Started
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M3 8h10M9 4l4 4-4 4"/>
                    </svg>
                </a>
                <a href="#pricing" class="btn btn-secondary btn-lg">View Pricing</a>
            </div>

            <p class="trust">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 10l4 4L16 6"/>
                </svg>
                <span>Used by 200+ indie iOS developers</span>
            </p>
        </div>
    </section>

    <section class="features">
        <div class="container">
            <h2>What We Check</h2>
            <div class="feature-grid">
                <div class="feature-item">
                    <h3>Metadata</h3>
                    <p>App name, subtitle, keywords, description validation</p>
                </div>
                <div class="feature-item">
                    <h3>Screenshots</h3>
                    <p>Size, format, count, and content compliance</p>
                </div>
                <div class="feature-item">
                    <h3>Privacy Manifest</h3>
                    <p>API declarations, reason codes, tracking domains</p>
                </div>
                <div class="feature-item">
                    <h3>Info.plist</h3>
                    <p>Required keys, bundle ID, version format</p>
                </div>
                <div class="feature-item">
                    <h3>URLs</h3>
                    <p>Privacy policy, support URL reachability</p>
                </div>
                <div class="feature-item">
                    <h3>Content Policy</h3>
                    <p>Age rating, guideline compliance, claims</p>
                </div>
            </div>
        </div>
    </section>

    <section id="pricing" class="pricing">
        <div class="container">
            <div class="section-header">
                <span class="overline">Buy Credits</span>
                <h2>Pre-purchase credits. Use anytime.</h2>
                <p class="section-sub">No subscriptions. Credits never expire.</p>
            </div>

            <div class="pricing-grid">
                {#each plans as plan}
                    <div class="card pricing-card" class:featured={plan.popular}>
                        {#if plan.popular}
                            <div class="popular-badge">Most Popular</div>
                        {/if}
                        <span class="plan-name">{plan.name}</span>
                        <div class="plan-credits">
                            <span class="credits">{plan.credits}</span>
                            <span class="credits-label">credits</span>
                        </div>
                        <div class="plan-price">
                            <span class="price">${plan.price}</span>
                            <span class="per-app">{plan.perApp}</span>
                        </div>
                        <ul class="plan-features">
                            <li>{plan.apps} full reviews</li>
                            <li>Credits never expire</li>
                            <li>Use anytime</li>
                        </ul>
                        <a href="/pricing" class="btn {plan.popular ? 'btn-primary' : 'btn-secondary'}">
                            Buy {plan.name}
                        </a>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <section class="how-it-works">
        <div class="container">
            <h2>How It Works</h2>
            <div class="steps">
                <div class="step">
                    <span class="step-number">1</span>
                    <h3>Upload Your Files</h3>
                    <p>Screenshots, Info.plist, privacy manifest, and metadata</p>
                </div>
                <div class="step">
                    <span class="step-number">2</span>
                    <h3>AI Analyzes Everything</h3>
                    <p>50+ checks against Apple's latest guidelines</p>
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
            <a href="/auth/signup" class="btn btn-primary btn-lg">Get Started Now</a>
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
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 160px 24px 100px;
        position: relative;
        background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 168, 83, 0.08), transparent);
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
        padding: 120px 0;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%);
    }

    .features h2 {
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--fg);
        margin-bottom: 3rem;
        text-align: center;
    }

    .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
        max-width: 1000px;
        margin: 0 auto;
    }

    .feature-item {
        padding: 28px;
        background: rgba(255, 255, 255, 0.025);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        transition: all 0.3s var(--ease);
    }

    .feature-item:hover {
        border-color: rgba(212, 168, 83, 0.3);
        background: rgba(255, 255, 255, 0.04);
        transform: translateY(-2px);
    }

    .feature-item h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 10px;
        color: var(--fg);
    }

    .feature-item p {
        font-size: 0.95rem;
        color: var(--gray-300);
        line-height: 1.6;
    }

    /* Pricing */
    .pricing {
        padding: 120px 0;
    }

    .section-header {
        text-align: center;
        margin-bottom: 60px;
    }

    .overline {
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--accent);
    }

    .section-header h2 {
        font-size: 2.75rem;
        margin-top: 16px;
        letter-spacing: -0.03em;
    }

    .section-sub {
        font-size: 1.2rem;
        color: var(--gray-300);
        margin-top: 12px;
    }

    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        max-width: 1100px;
        margin: 0 auto;
    }

    @media (max-width: 900px) {
        .pricing-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .pricing-card {
        padding: 36px 28px;
        text-align: center;
        position: relative;
        transition: all 0.3s var(--ease);
    }

    .pricing-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }

    .pricing-card.featured {
        border-color: var(--accent);
        background: linear-gradient(180deg, rgba(212, 168, 83, 0.08) 0%, rgba(212, 168, 83, 0.02) 100%);
        box-shadow: 0 0 60px rgba(212, 168, 83, 0.1);
    }

    .popular-badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent);
        color: var(--bg);
        font-size: 0.7rem;
        font-weight: 700;
        padding: 4px 12px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .plan-name {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--gray-400);
    }

    .plan-credits {
        margin: 16px 0 8px;
    }

    .credits {
        font-family: 'Outfit', sans-serif;
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .credits-label {
        font-size: 0.85rem;
        color: var(--gray-500);
        margin-left: 6px;
    }

    .plan-price {
        margin-bottom: 20px;
    }

    .price {
        font-size: 1.5rem;
        font-weight: 700;
        display: block;
    }

    .per-app {
        font-size: 0.8rem;
        color: var(--gray-500);
    }

    .plan-features {
        list-style: none;
        text-align: left;
        margin-bottom: 24px;
    }

    .plan-features li {
        font-size: 0.85rem;
        color: var(--gray-300);
        padding: 6px 0;
    }

    .pricing-card .btn {
        width: 100%;
    }

    /* How it works */
    .how-it-works {
        padding: 120px 0;
        background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.02) 100%);
    }

    .how-it-works h2 {
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--fg);
        margin-bottom: 4rem;
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
        font-family: 'Outfit', sans-serif;
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
        padding: 140px 0;
        text-align: center;
        background: radial-gradient(ellipse 60% 40% at 50% 100%, rgba(212, 168, 83, 0.06), transparent);
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
