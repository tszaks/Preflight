<script lang="ts">
    import { reveal } from '../actions/reveal';
</script>

<section id="pricing" class="pricing section">
    <div class="container">
        <div class="section-header" use:reveal>
            <span class="overline">Simple Pricing</span>
            <h2>One price. Complete review.</h2>
            <p class="section-sub">No subscriptions. No hidden fees. Pay per review.</p>
        </div>

        <div class="pricing-single" use:reveal={{ delay: 150 }}>
            <div class="pricing-card featured">
                <div class="card-header">
                    <span class="plan-name">Full Review</span>
                    <div class="plan-price">
                        <span class="price gold">$49</span>
                        <span class="per">per review</span>
                    </div>
                </div>
                <div class="divider"></div>
                <ul class="features">
                    <li>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Metadata & keyword validation
                    </li>
                    <li>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Screenshot compliance check
                    </li>
                    <li>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Privacy manifest deep analysis
                    </li>
                    <li>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Info.plist verification
                    </li>
                    <li>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        URL reachability testing
                    </li>
                    <li>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Content policy review
                    </li>
                    <li>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Detailed fix instructions
                    </li>
                </ul>
                <a href="https://preflight-production-998a.up.railway.app/auth/signup" class="btn btn-primary">Get Started</a>

                <p class="recheck-note">Need a recheck after fixes? Just $19.</p>
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

    .pricing-single {
        display: flex;
        justify-content: center;
    }

    .pricing-card {
        background: var(--bg-elevated);
        border: 1px solid var(--gray-800);
        border-radius: 20px;
        padding: 48px 40px;
        display: flex;
        flex-direction: column;
        position: relative;
        max-width: 420px;
        width: 100%;
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

    .plan-name {
        font-family: 'Outfit', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: var(--gray-300);
    }

    .plan-price {
        margin-top: 8px;
    }

    .price {
        font-family: 'Outfit', sans-serif;
        font-size: 3.5rem;
        font-weight: 800;
    }

    .price.gold {
        background: var(--gradient-gold);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .per {
        font-size: 0.875rem;
        color: var(--gray-500);
        margin-left: 4px;
    }

    .divider {
        height: 1px;
        background: var(--gray-800);
        margin: 24px 0;
    }

    .features {
        list-style: none;
        flex: 1;
        margin-bottom: 32px;
    }

    .features li {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.95rem;
        color: var(--gray-100);
        padding: 10px 0;
    }

    .pricing-card .btn {
        width: 100%;
    }

    .recheck-note {
        text-align: center;
        margin-top: 16px;
        font-size: 0.85rem;
        color: var(--gray-500);
    }

    @media (max-width: 768px) {
        .section-header h2 { font-size: 2rem; }
        .pricing-card {
            padding: 32px 24px;
        }
    }
</style>
