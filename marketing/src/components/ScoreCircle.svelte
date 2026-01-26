<script lang="ts">
    let visible = $state(false);
    let count = $state(0);
    let elem: HTMLDivElement;

    $effect(() => {
        if (!elem) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                visible = true;
                animateCount();
                observer.disconnect();
            }
        }, { threshold: 0.5 });

        observer.observe(elem);
        return () => observer.disconnect();
    });

    function animateCount() {
        const target = 87;
        const duration = 2000;
        const start = performance.now();

        function step(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            count = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    // SVG circle math: circumference = 2 * PI * r = 2 * 3.14159 * 85 ≈ 534
    const circumference = 534;
    const targetOffset = circumference * (1 - 87 / 100); // 87% filled
</script>

<div class="score-circle" bind:this={elem}>
    <svg viewBox="0 0 200 200" width="180" height="180">
        <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#D4A853"/>
                <stop offset="50%" stop-color="#E8C97A"/>
                <stop offset="100%" stop-color="#D4A853"/>
            </linearGradient>
        </defs>
        <!-- Track -->
        <circle cx="100" cy="100" r="85" fill="none" stroke="var(--gray-800)" stroke-width="8"/>
        <!-- Progress -->
        <circle
            cx="100" cy="100" r="85"
            fill="none"
            stroke="url(#goldGrad)"
            stroke-width="8"
            stroke-linecap="round"
            stroke-dasharray={circumference}
            stroke-dashoffset={visible ? targetOffset : circumference}
            transform="rotate(-90, 100, 100)"
            class="progress-ring"
        />
    </svg>
    <div class="score-text">
        <span class="score-num">{count}</span>
        <span class="score-label">/100</span>
    </div>

    <div class="mini-badges" class:visible>
        <span class="mini pass">Metadata</span>
        <span class="mini warn">Privacy</span>
        <span class="mini pass">Screenshots</span>
    </div>
</div>

<style>
    .score-circle {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
    }

    svg {
        filter: drop-shadow(0 0 20px rgba(212, 168, 83, 0.15));
    }

    .progress-ring {
        transition: stroke-dashoffset 2s var(--ease-out-expo);
    }

    .score-text {
        position: absolute;
        top: 90px; /* half of SVG's 180px height */
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
    }

    .score-num {
        font-family: 'Outfit', sans-serif;
        font-size: 3rem;
        font-weight: 800;
        color: var(--fg);
        display: block;
        line-height: 1;
    }

    .score-label {
        font-size: 0.85rem;
        color: var(--gray-500);
    }

    .mini-badges {
        display: flex;
        gap: 8px;
        margin-top: 20px;
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 0.6s 1.5s, transform 0.6s 1.5s var(--ease-out-expo);
    }

    .mini-badges.visible {
        opacity: 1;
        transform: translateY(0);
    }

    .mini {
        font-size: 0.75rem;
        font-weight: 500;
        padding: 4px 12px;
        border-radius: var(--radius-full);
    }

    .mini.pass {
        background: rgba(34, 197, 94, 0.1);
        color: var(--success);
        border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .mini.warn {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
        border: 1px solid rgba(245, 158, 11, 0.2);
    }
</style>
