<script lang="ts">
    let { data } = $props();

    type Submission = {
        id: string;
        app_name: string;
        review_type: 'quick' | 'full';
        status: 'draft' | 'paid' | 'queued' | 'analyzing' | 'complete' | 'failed';
        created_at: string;
    };

    let submissions: Submission[] = $derived(data.submissions ?? []);

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function isClickable(status: string): boolean {
        return status === 'complete';
    }
</script>

<div class="dashboard container">
    <header class="dash-header">
        <h1>Your Reviews</h1>
        <a href="/submit" class="btn btn-primary">
            <span class="plus">+</span> New Review
        </a>
    </header>

    {#if submissions.length === 0}
        <div class="empty-state">
            <div class="empty-icon">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="8" width="28" height="34" rx="6" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.6"/>
                    <path d="M18 18h12M18 24h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.4"/>
                    <circle cx="38" cy="36" r="10" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M43 41l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </div>
            <h2>No reviews yet</h2>
            <p>Submit your first app and get a detailed compliance report before you hit Send.</p>
            <a href="/submit" class="btn btn-primary btn-lg">Start Your First Review</a>
        </div>
    {:else}
        <div class="submissions-list">
            {#each submissions as sub (sub.id)}
                {@const clickable = isClickable(sub.status)}
                <a
                    href={clickable ? `/report/${sub.id}` : undefined}
                    class="submission-card"
                    class:clickable
                    role={clickable ? 'link' : 'article'}
                    tabindex={clickable ? 0 : -1}
                >
                    <div class="card-left">
                        <span class="app-name">{sub.app_name}</span>
                        <span class="card-meta">
                            <span class="review-type" class:full={sub.review_type === 'full'}>
                                {sub.review_type === 'full' ? 'Full' : 'Quick'}
                            </span>
                            {formatDate(sub.created_at)}
                        </span>
                    </div>
                    <div class="card-right">
                        <span class="badge badge-{sub.status}">
                            {#if sub.status === 'queued'}
                                <span class="badge-dots">
                                    <span></span><span></span><span></span>
                                </span>
                            {:else if sub.status === 'analyzing'}
                                <span class="badge-spinner"></span>
                            {:else if sub.status === 'complete'}
                                <svg class="badge-icon" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            {:else if sub.status === 'failed'}
                                <svg class="badge-icon" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M3 3l4 4M7 3l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                            {/if}
                            {#if sub.status === 'analyzing'}Analyzing{:else}{sub.status}{/if}
                        </span>
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</div>

<style>
    .dashboard {
        padding-top: 40px;
        padding-bottom: 64px;
    }

    .dash-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
    }

    .dash-header h1 {
        font-size: 28px;
        letter-spacing: -0.03em;
    }

    .plus {
        font-size: 16px;
        font-weight: 400;
    }

    /* === Empty State === */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 80px 32px;
        max-width: 320px;
        margin: 0 auto;
        position: relative;
    }

    .empty-state::before {
        content: '';
        position: absolute;
        inset: -40px;
        background: radial-gradient(ellipse at 50% 40%, rgba(212, 168, 83, 0.03) 0%, transparent 60%);
        pointer-events: none;
    }

    .empty-icon {
        color: var(--accent);
        margin-bottom: 20px;
        animation: float 3s ease-in-out infinite alternate;
    }

    @keyframes float {
        from { transform: translateY(0); }
        to { transform: translateY(-4px); }
    }

    .empty-state h2 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
    }

    .empty-state p {
        font-size: 14px;
        color: var(--gray-300);
        line-height: 1.6;
        margin-bottom: 24px;
    }

    /* === Submissions List === */
    .submissions-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .submission-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--surface-2);
        border: 1px solid var(--border-default);
        border-radius: 12px;
        padding: 16px 20px;
        transition:
            border-color var(--duration-fast) var(--ease-out),
            transform var(--duration-fast) var(--ease-out);
        text-decoration: none;
        color: inherit;
    }

    .submission-card.clickable {
        cursor: pointer;
    }

    .submission-card.clickable:hover {
        border-color: var(--border-hover);
        transform: translateX(2px);
    }

    .card-left {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .app-name {
        font-family: 'Outfit', sans-serif;
        font-size: 15px;
        font-weight: 600;
    }

    .card-meta {
        font-size: 13px;
        color: var(--gray-500);
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .review-type {
        font-family: 'Outfit', sans-serif;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        background: rgba(168, 165, 160, 0.08);
        color: var(--gray-300);
        padding: 2px 6px;
        border-radius: 4px;
    }

    .review-type.full {
        background: rgba(212, 168, 83, 0.08);
        color: var(--accent);
    }

    .card-right {
        flex-shrink: 0;
    }

    /* === Status Badges === */
    .badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-family: 'Outfit', sans-serif;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: var(--radius-full);
        letter-spacing: 0.02em;
        text-transform: capitalize;
    }

    .badge-draft { background: var(--status-draft-bg); color: var(--status-draft-fg); }
    .badge-paid { background: var(--status-paid-bg); color: var(--status-paid-fg); }
    .badge-queued { background: var(--status-queued-bg); color: var(--status-queued-fg); }
    .badge-analyzing { background: var(--status-processing-bg); color: var(--status-processing-fg); }
    .badge-complete { background: var(--status-complete-bg); color: var(--status-complete-fg); }
    .badge-failed { background: var(--status-failed-bg); color: var(--status-failed-fg); }

    .badge-icon {
        width: 10px;
        height: 10px;
    }

    /* Animated dots for queued */
    .badge-dots {
        display: inline-flex;
        gap: 2px;
        align-items: center;
    }

    .badge-dots span {
        display: inline-block;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: currentColor;
        animation: dot-pulse 1.4s infinite;
    }

    .badge-dots span:nth-child(2) { animation-delay: 0.2s; }
    .badge-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes dot-pulse {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
    }

    /* Spinner for processing */
    .badge-spinner {
        width: 10px;
        height: 10px;
        border: 1.5px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* === Responsive === */
    @media (max-width: 480px) {
        .dash-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
        }

        .dash-header .btn {
            width: 100%;
        }
    }
</style>
