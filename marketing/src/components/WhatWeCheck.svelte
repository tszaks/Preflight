<script lang="ts">
    import { reveal } from '../actions/reveal';
    import ScoreCircle from './ScoreCircle.svelte';

    const categories = [
        {
            title: 'Metadata & Keywords',
            desc: 'App name, subtitle, keywords, description length, special character violations.',
            icon: 'M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm10 10h.01M17 13h-5a2 2 0 00-2 2v5a2 2 0 002 2h5a2 2 0 002-2v-5a2 2 0 00-2-2z',
            checks: 14,
        },
        {
            title: 'Screenshots & Previews',
            desc: 'Resolution, device frames, count requirements, format and size validation.',
            icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
            checks: 8,
        },
        {
            title: 'Privacy Manifest',
            desc: 'Required API declarations, tracking domains, reason codes, collected data types.',
            icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
            checks: 12,
        },
        {
            title: 'Info.plist',
            desc: 'Required keys, bundle ID format, permissions strings, version formatting.',
            icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
            checks: 10,
        },
        {
            title: 'URL Reachability',
            desc: 'Privacy policy, support, and marketing URLs verified accessible over HTTPS.',
            icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
            checks: 6,
        },
        {
            title: 'Content Policy',
            desc: 'Age rating accuracy, objectionable content flags, guideline compliance.',
            icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
            checks: 8,
        },
    ];
</script>

<section class="what-we-check section">
    <div class="container">
        <div class="section-header" use:reveal>
            <span class="overline">Comprehensive Coverage</span>
            <h2>Everything Apple checks.<br/>We check first.</h2>
        </div>

        <div class="category-grid">
            {#each categories as cat, i}
                <div class="category-card" use:reveal={{ delay: i * 100 }}>
                    <div class="cat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d={cat.icon}/>
                        </svg>
                    </div>
                    <h3>{cat.title}</h3>
                    <p>{cat.desc}</p>
                    <span class="check-count">{cat.checks} checks</span>
                </div>
            {/each}
        </div>

        <div class="score-preview" use:reveal={{ threshold: 0.3 }}>
            <ScoreCircle />
            <p class="score-caption">Example PreFlight Score</p>
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

    .category-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 80px;
    }

    .category-card {
        background: var(--bg-elevated);
        border: 1px solid var(--gray-800);
        border-radius: var(--radius-lg);
        padding: 28px;
        transition: transform var(--duration-normal) var(--ease-out-quart),
                    border-color var(--duration-normal);
    }

    .category-card:hover {
        transform: translateY(-2px);
        border-top-color: var(--accent);
    }

    .cat-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--accent-subtle);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent);
        margin-bottom: 16px;
        transition: background var(--duration-normal);
    }

    .category-card:hover .cat-icon {
        background: rgba(212, 168, 83, 0.12);
    }

    .category-card h3 {
        font-size: 1.125rem;
        margin-bottom: 8px;
    }

    .category-card p {
        font-size: 0.875rem;
        color: var(--gray-300);
        line-height: 1.5;
        margin-bottom: 16px;
    }

    .check-count {
        font-size: 0.75rem;
        color: var(--gray-500);
        font-family: 'Outfit', sans-serif;
        font-weight: 500;
    }

    .score-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .score-caption {
        margin-top: 16px;
        font-size: 0.875rem;
        color: var(--gray-500);
    }

    @media (max-width: 1024px) {
        .category-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 768px) {
        .section-header h2 { font-size: 2rem; }
        .category-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
