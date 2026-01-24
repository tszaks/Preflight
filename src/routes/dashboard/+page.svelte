<script lang="ts">
    let { data } = $props();
</script>

<main class="dashboard">
    <div class="container">
        <header class="dashboard-header">
            <div>
                <h1>Dashboard</h1>
                <p class="text-muted">Your app reviews</p>
            </div>
            <a href="/submit" class="btn btn-primary">New Review</a>
        </header>

        {#if data.submissions.length === 0}
            <div class="empty-state">
                <h2>No reviews yet</h2>
                <p class="text-muted mb-4">Submit your first app for review</p>
                <a href="/submit" class="btn btn-primary">Start a Review</a>
            </div>
        {:else}
            <div class="submissions-list">
                {#each data.submissions as submission}
                    {#if submission.status === 'complete' && submission.report_id}
                        <a
                            href="/report/{submission.report_id}"
                            class="card submission-card clickable"
                        >
                            <div class="submission-info">
                                <h3>{submission.app_name}</h3>
                                <p class="text-subtle">
                                    {submission.review_type === 'full' ? 'Full' : 'Quick'} Review
                                    &middot; {new Date(submission.completed_at || submission.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <span class="badge badge-complete">Complete</span>
                        </a>
                    {:else}
                        <div class="card submission-card">
                            <div class="submission-info">
                                <h3>{submission.app_name}</h3>
                                <p class="text-subtle">
                                    {submission.review_type === 'full' ? 'Full' : 'Quick'} Review
                                    &middot; {new Date(submission.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <span class="badge badge-{submission.status}">
                                {#if submission.status === 'queued' || submission.status === 'processing'}
                                    ⏳ {submission.status}
                                {:else if submission.status === 'failed'}
                                    ❌ Failed
                                {:else}
                                    {submission.status}
                                {/if}
                            </span>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
    </div>
</main>

<style>
    .dashboard {
        padding: 120px 0 60px;
        min-height: 100vh;
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 3rem;
    }

    .dashboard-header h1 {
        font-size: 2rem;
        margin-bottom: 0.25rem;
    }

    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px dashed rgba(255, 255, 255, 0.1);
        border-radius: 12px;
    }

    .empty-state h2 {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
    }

    .submissions-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .submission-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: border-color 0.2s;
    }

    .submission-card:hover {
        border-color: var(--accent);
    }

    .submission-info h3 {
        font-size: 1rem;
        margin-bottom: 0.25rem;
    }

    .submission-card.clickable:hover {
        border-color: var(--accent);
    }

    .badge {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 100px;
        text-transform: capitalize;
    }

    .badge-complete {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
    }

    .badge-queued,
    .badge-processing {
        background: rgba(212, 168, 83, 0.1);
        color: var(--accent);
    }

    .badge-paid,
    .badge-draft {
        background: rgba(255, 255, 255, 0.06);
        color: var(--gray-400);
    }

    .badge-failed {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }
</style>
