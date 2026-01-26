<script lang="ts">
    import { reveal } from '../actions/reveal';
</script>

<section id="pricing" class="pricing section">
    <div class="container">
        <div class="section-header" use:reveal>
            <span class="overline">Buy Credits</span>
            <h2>Pre-purchase credits. Use anytime.</h2>
            <p class="section-sub">100 credits = 1 full review. 25 credits = 1 re-review. Credits never expire.</p>
        </div>

        <div class="pricing-grid" use:reveal={{ delay: 150 }}>
            <!-- Starter -->
            <div class="pricing-card">
                <div class="card-header">
                    <span class="plan-name">Starter</span>
                    <div class="plan-credits">
                        <span class="credits gold">100</span>
                        <span class="credits-label">credits</span>
                    </div>
                    <div class="plan-price">
                        <span class="price">$49</span>
                        <span class="per">$49/app</span>
                    </div>
                </div>
                <div class="divider"></div>
                <ul class="features">
                    <li>✓ 1 app full review</li>
                    <li>✓ + 4 re-reviews</li>
                    <li>✓ Credits never expire</li>
                    <li>✓ Use anytime</li>
                </ul>
                <a href="https://preflight-production-998a.up.railway.app/pricing" class="btn btn-secondary">Buy Starter</a>
            </div>

            <!-- Pro -->
            <div class="pricing-card featured">
                <div class="popular-badge">Most Popular</div>
                <div class="card-header">
                    <span class="plan-name">Pro</span>
                    <div class="plan-credits">
                        <span class="credits gold">350</span>
                        <span class="credits-label">credits</span>
                    </div>
                    <div class="plan-price">
                        <span class="price">$129</span>
                        <span class="per">$43/app</span>
                    </div>
                </div>
                <div class="divider"></div>
                <ul class="features">
                    <li>✓ 3 apps full reviews</li>
                    <li>✓ + 8 re-reviews</li>
                    <li>✓ Credits never expire</li>
                    <li>✓ Use anytime</li>
                </ul>
                <a href="https://preflight-production-998a.up.railway.app/pricing" class="btn btn-primary">Buy Pro</a>
            </div>

            <!-- Team -->
            <div class="pricing-card">
                <div class="card-header">
                    <span class="plan-name">Team</span>
                    <div class="plan-credits">
                        <span class="credits gold">750</span>
                        <span class="credits-label">credits</span>
                    </div>
                    <div class="plan-price">
                        <span class="price">$249</span>
                        <span class="per">$35.50/app</span>
                    </div>
                </div>
                <div class="divider"></div>
                <ul class="features">
                    <li>✓ 7 apps full reviews</li>
                    <li>✓ + 10 re-reviews</li>
                    <li>✓ Credits never expire</li>
                    <li>✓ Use anytime</li>
                </ul>
                <a href="https://preflight-production-998a.up.railway.app/pricing" class="btn btn-secondary">Buy Team</a>
            </div>

            <!-- Agency -->
            <div class="pricing-card">
                <div class="card-header">
                    <span class="plan-name">Agency</span>
                    <div class="plan-credits">
                        <span class="credits gold">1500</span>
                        <span class="credits-label">credits</span>
                    </div>
                    <div class="plan-price">
                        <span class="price">$449</span>
                        <span class="per">$29.93/app</span>
                    </div>
                </div>
                <div class="divider"></div>
                <ul class="features">
                    <li>✓ 15 apps full reviews</li>
                    <li>✓ + 20 re-reviews</li>
                    <li>✓ Credits never expire</li>
                    <li>✓ Use anytime</li>
                </ul>
                <a href="https://preflight-production-998a.up.railway.app/pricing" class="btn btn-secondary">Buy Agency</a>
            </div>
        </div>
    </div>
</section>

<style>
    .section-header {
        text-align: center;
        margin-bottom: 64px;
    }

    .section-header h2 {
        font-size: 3rem;
        margin-top: 12px;
        letter-spacing: -0.03em;
    }

    .section-sub {
        font-size: 1.125rem;
        color: var(--gray-300);
        margin-top: 8px;
    }

    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 24px;
        max-width: 1200px;
        margin: 0 auto;
    }

    .pricing-card {
        background: var(--bg-elevated);
        border: 1px solid var(--gray-800);
        border-radius: 20px;
        padding: 32px 28px;
        display: flex;
        flex-direction: column;
        position: relative;
        transition: transform 0.2s var(--ease);
    }

    .pricing-card:hover {
        transform: translateY(-4px);
    }

    .pricing-card.featured {
        border-color: rgba(212, 168, 83, 0.4);
        background: linear-gradient(180deg, rgba(212, 168, 83, 0.04) 0%, transparent 40%);
    }

    /* Animated rotating gradient border for featured card */
    .pricing-card.featured::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 20px;
        padding: 1px;
        background: conic-gradient(
            from var(--angle, 0deg),
            transparent 30%,
            rgba(212, 168, 83, 0.5) 50%,
            transparent 70%
        );
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        animation: rotate-border 8s linear infinite;
        pointer-events: none;
    }

    @property --angle {
        syntax: '<angle>';
        initial-value: 0deg;
        inherits: false;
    }

    @keyframes rotate-border {
        to { --angle: 360deg; }
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

    .card-header {
        text-align: center;
        margin-bottom: 20px;
    }

    .plan-name {
        font-family: 'Outfit', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--gray-300);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .plan-credits {
        margin: 12px 0 8px;
    }

    .credits {
        font-family: 'Outfit', sans-serif;
        font-size: 2.5rem;
        font-weight: 800;
    }

    .credits.gold {
        background: var(--gradient-gold);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .credits-label {
        font-size: 0.8rem;
        color: var(--gray-500);
        margin-left: 6px;
    }

    .plan-price {
        margin-top: 4px;
    }

    .price {
        font-family: 'Outfit', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        display: block;
    }

    .per {
        font-size: 0.75rem;
        color: var(--gray-500);
        display: block;
        margin-top: 2px;
    }

    .divider {
        height: 1px;
        background: var(--gray-800);
        margin: 16px 0;
    }

    .features {
        list-style: none;
        flex: 1;
        margin-bottom: 24px;
        text-align: left;
    }

    .features li {
        font-size: 0.85rem;
        color: var(--gray-300);
        padding: 6px 0;
    }

    .pricing-card .btn {
        width: 100%;
    }

    @media (max-width: 768px) {
        .section-header h2 { font-size: 2rem; }
        .pricing-grid {
            grid-template-columns: 1fr;
        }
        .pricing-card {
            padding: 28px 24px;
        }
    }
</style>
