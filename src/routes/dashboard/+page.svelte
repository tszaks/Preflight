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
                    <a
                        href="/report/{submission.id}"
                        class="card submission-card"
                    >
                        <div class="submission-info">
                            <h3>{submission.app_name}</h3>
                            <p class="text-subtle">
                                {new Date(
                                    submission.created_at,
                                ).toLocaleDateString()}
                            </p>
                        </div>
                        <span class="badge badge-{submission.status}"
                            >{submission.status}</span
                        >
                    </a>
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
</style>
