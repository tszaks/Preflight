<script lang="ts">
    import { reveal } from '../actions/reveal';

    const steps = [
        {
            num: 1,
            title: 'Upload',
            desc: 'Your app metadata, screenshots, and privacy manifest.',
            icon: 'M12 4v12m0-12L8 8m4-4l4 4M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4',
        },
        {
            num: 2,
            title: 'Analyze',
            desc: 'Our AI simulates Apple\'s review process against 50+ guidelines.',
            icon: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16zM11 8v6M8 11h6',
        },
        {
            num: 3,
            title: 'Fix',
            desc: 'Get a detailed report with specific fixes for every issue found.',
            icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
        },
    ];
</script>

<section id="how-it-works" class="how-it-works section">
    <div class="container">
        <div class="section-header" use:reveal>
            <span class="overline">How It Works</span>
            <h2>Three steps to confidence</h2>
            <p class="section-sub">Upload your app details. Get your review. Fix issues before Apple sees them.</p>
        </div>

        <div class="steps">
            {#each steps as step, i}
                <div class="step-card" use:reveal={{ delay: i * 200 }}>
                    <div class="step-num">{step.num}</div>
                    <div class="step-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d={step.icon}/>
                        </svg>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                </div>
                {#if i < steps.length - 1}
                    <div class="connector"></div>
                {/if}
            {/each}
        </div>
    </div>
</section>

<style>
    .how-it-works {
        background: var(--bg-subtle);
    }

    .section-header {
        text-align: center;
        margin-bottom: 64px;
    }

    .section-header h2 {
        font-size: 3rem;
        margin: 12px 0;
        letter-spacing: -0.03em;
    }

    .section-sub {
        font-size: 1.125rem;
        color: var(--gray-300);
        max-width: 500px;
        margin: 0 auto;
    }

    .steps {
        display: flex;
        align-items: center;
        gap: 0;
        max-width: 1000px;
        margin: 0 auto;
    }

    .step-card {
        flex: 1;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        padding: 32px;
        text-align: center;
        transition: transform var(--duration-normal) var(--ease-out-quart),
                    border-color var(--duration-normal),
                    box-shadow var(--duration-normal);
    }

    .step-card:hover {
        transform: translateY(-4px);
        border-color: rgba(212, 168, 83, 0.3);
        box-shadow: 0 8px 32px rgba(212, 168, 83, 0.08);
    }

    .step-num {
        width: 40px;
        height: 40px;
        border: 1.5px solid var(--accent);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--accent);
        margin: 0 auto 20px;
    }

    .step-icon {
        color: var(--accent);
        margin-bottom: 20px;
    }

    .step-card h3 {
        font-size: 1.25rem;
        margin-bottom: 8px;
    }

    .step-card p {
        font-size: 0.9rem;
        color: var(--gray-300);
        line-height: 1.5;
    }

    .connector {
        width: 48px;
        height: 2px;
        border-top: 2px dashed rgba(212, 168, 83, 0.2);
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        .section-header h2 { font-size: 2rem; }

        .steps {
            flex-direction: column;
            gap: 24px;
        }

        .connector {
            width: 2px;
            height: 32px;
            border-top: none;
            border-left: 2px dashed rgba(212, 168, 83, 0.2);
        }
    }
</style>
