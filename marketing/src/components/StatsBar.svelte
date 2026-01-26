<script lang="ts">
    import { reveal } from '../actions/reveal';
    import { countUp } from '../actions/countUp';
</script>

<section class="stats" use:reveal={{ threshold: 0.3 }}>
    <div class="container stats-grid">
        <div class="stat">
            <span class="stat-number" use:countUp={{ target: 50, suffix: '+' }}></span>
            <span class="stat-label">Rejection Checks</span>
        </div>
        <div class="divider"></div>
        <div class="stat">
            <span class="stat-number" use:countUp={{ target: 6 }}></span>
            <span class="stat-label">Categories Analyzed</span>
        </div>
        <div class="divider"></div>
        <div class="stat">
            <span class="stat-number" use:countUp={{ target: 36, suffix: '%' }}></span>
            <span class="stat-label">First-Time Rejection Rate</span>
        </div>
    </div>
</section>

<style>
    .stats {
        border-top: 1px solid rgba(255, 255, 255, 0.04);
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        padding: 48px 0;
    }

    .stats-grid {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 48px;
    }

    .stat {
        text-align: center;
    }

    .stat-number {
        display: block;
        font-family: 'Outfit', sans-serif;
        font-size: 2rem;
        font-weight: 700;
        color: var(--accent);
        margin-bottom: 4px;
    }

    .stat-label {
        font-size: 0.875rem;
        color: var(--gray-300);
    }

    .divider {
        width: 1px;
        height: 40px;
        background: var(--gray-800);
    }

    @media (max-width: 768px) {
        .stats-grid {
            flex-direction: column;
            gap: 32px;
        }
        .divider { display: none; }
    }
</style>
