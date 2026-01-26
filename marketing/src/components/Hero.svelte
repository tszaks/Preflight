<script lang="ts">
    let mounted = $state(false);

    $effect(() => {
        mounted = true;
    });
</script>

<section class="hero">
    <div class="hero-glow"></div>
    <div class="hero-grid"></div>

    <div class="hero-content" class:mounted>
        <div class="badge" style="--delay: 0ms">
            <span>For indie iOS developers</span>
        </div>

        <h1>
            <span class="line" style="--delay: 150ms">Never get rejected for</span>
            <span class="line" style="--delay: 300ms">something <span class="highlight">you could've caught.</span></span>
        </h1>

        <p class="subhead" style="--delay: 600ms">
            Preflight runs 50+ of Apple's review checks on your submission
            before you hit Send. Fix issues in minutes, not weeks.
        </p>

        <div class="cta-wrapper" style="--delay: 800ms">
            <a href="https://preflight-production-998a.up.railway.app/auth/signup" class="btn btn-primary btn-lg">
                Get Started
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M3 8h10M9 4l4 4-4 4"/>
                </svg>
            </a>
            <a href="#pricing" class="btn btn-secondary btn-lg">View Pricing</a>
        </div>

        <p class="trust" style="--delay: 1000ms">
            <svg class="check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 10l4 4L16 6"/>
            </svg>
            <span class="trust-text">Used by 200+ indie iOS developers</span>
        </p>
    </div>
</section>

<style>
    .hero {
        min-height: 100svh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        padding: 100px 24px 60px;
    }

    .hero-glow {
        position: absolute;
        top: -20%;
        left: 50%;
        transform: translateX(-50%);
        width: 120%;
        height: 70%;
        background: radial-gradient(ellipse at center, rgba(212, 168, 83, 0.04) 0%, transparent 70%);
        pointer-events: none;
    }

    .hero-grid {
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        background-size: 80px 80px;
        mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        pointer-events: none;
    }

    .hero-content {
        position: relative;
        text-align: center;
        max-width: 720px;
    }

    /* Staggered entrance animations */
    .hero-content .badge,
    .hero-content h1 .line,
    .hero-content .subhead,
    .hero-content .cta-wrapper,
    .hero-content .trust {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 800ms var(--ease-out-expo) var(--delay, 0ms),
                    transform 800ms var(--ease-out-expo) var(--delay, 0ms);
    }

    .hero-content.mounted .badge,
    .hero-content.mounted h1 .line,
    .hero-content.mounted .subhead,
    .hero-content.mounted .cta-wrapper,
    .hero-content.mounted .trust {
        opacity: 1;
        transform: translateY(0);
    }

    .badge {
        display: inline-flex;
        margin-bottom: 24px;
    }

    .badge span {
        font-family: 'Outfit', sans-serif;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--accent);
        padding: 8px 18px;
        border: 1px solid rgba(212, 168, 83, 0.3);
        border-radius: var(--radius-full);
        background: rgba(212, 168, 83, 0.06);
    }

    h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 4.5rem;
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.04em;
        margin-bottom: 24px;
        color: var(--fg);
    }

    h1 .line {
        display: block;
    }

    .highlight {
        background: var(--gradient-gold);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .subhead {
        font-size: 1.25rem;
        color: var(--gray-300);
        line-height: 1.6;
        max-width: 540px;
        margin: 0 auto 40px;
    }

    .cta-wrapper {
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
    }

    .check-icon {
        flex-shrink: 0;
    }

    .trust-text {
        font-size: 0.9rem;
        color: var(--gray-400);
    }

    @media (max-width: 768px) {
        h1 { font-size: 2.75rem; }
        .subhead { font-size: 1.1rem; }

        .cta-wrapper {
            flex-direction: column;
            padding: 0 20px;
        }

        .btn-lg {
            width: 100%;
            justify-content: center;
        }
    }
</style>
