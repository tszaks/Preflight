<script lang="ts">
    import CockpitPanel from "$lib/components/CockpitPanel.svelte";
    import StatusLight from "$lib/components/StatusLight.svelte";

    let { data } = $props();

    type Submission = {
        id: string;
        app_name: string;
        review_type: "quick" | "full";
        status:
            | "draft"
            | "paid"
            | "queued"
            | "analyzing"
            | "complete"
            | "failed";
        created_at: string;
    };

    let submissions: Submission[] = $derived(data.submissions ?? []);
    let credits: number = $derived(data.credits ?? 0);

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    function isClickable(status: string): boolean {
        return (
            status === "complete" ||
            status === "analyzing" ||
            status === "queued"
        );
    }

    function mapStatus(
        status: string,
    ): "neutral" | "ready" | "processing" | "warning" | "critical" {
        switch (status) {
            case "complete":
                return "ready";
            case "analyzing":
                return "processing";
            case "failed":
                return "critical";
            case "queued":
                return "warning";
            case "paid":
                return "warning";
            default:
                return "neutral";
        }
    }
</script>

<div class="dashboard container">
    <header class="dash-header">
        <h1>Your Reviews</h1>
        <div class="header-actions">
            <a href="/pricing" class="btn btn-secondary btn-sm">Buy Credits</a>
            <a href="/submit" class="btn btn-primary">
                <span class="plus">+</span> New Review
            </a>
        </div>
    </header>

    {#if submissions.length === 0}
        <CockpitPanel class="empty-state">
            <div class="empty-icon">
                <svg
                    width="56"
                    height="56"
                    viewBox="0 0 56 56"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        x="10"
                        y="8"
                        width="28"
                        height="34"
                        rx="6"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-opacity="0.6"
                    />
                    <path
                        d="M18 18h12M18 24h8"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-opacity="0.4"
                    />
                    <circle
                        cx="38"
                        cy="36"
                        r="10"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                    <path
                        d="M43 41l4 4"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                </svg>
            </div>
            <h2>No reviews yet</h2>
            <p>
                Submit your first app and get a detailed compliance report
                before you hit Send.
            </p>
            <a href="/submit" class="btn btn-primary btn-lg"
                >Start Your First Review</a
            >
        </CockpitPanel>
    {:else}
        <div class="submissions-list">
            {#each submissions as sub (sub.id)}
                {@const clickable = isClickable(sub.status)}
                <a
                    href={clickable ? `/report/${sub.id}` : undefined}
                    class="submission-link"
                    class:clickable
                    role={clickable ? "link" : "article"}
                    tabindex={clickable ? 0 : -1}
                >
                    <CockpitPanel class="submission-card" active={clickable}>
                        <div class="card-left">
                            <div class="card-id">
                                PKT_{sub.id.substring(0, 4).toUpperCase()}
                            </div>
                            <span class="app-name">{sub.app_name}</span>
                            <div class="card-meta">
                                <span
                                    class="review-type"
                                    class:full={sub.review_type === "full"}
                                >
                                    {sub.review_type === "full"
                                        ? "DGN_FULL"
                                        : "DGN_QUICK"}
                                </span>
                                <span class="date-stamp"
                                    >{formatDate(
                                        sub.created_at,
                                    ).toUpperCase()}</span
                                >
                            </div>
                        </div>
                        <div class="card-right">
                            <StatusLight
                                status={mapStatus(sub.status)}
                                label={sub.status.toUpperCase()}
                                pulse={sub.status === "analyzing" ||
                                    sub.status === "queued"}
                            />
                        </div>
                    </CockpitPanel>
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
        gap: 1.5rem;
    }

    .dash-header h1 {
        font-size: 28px;
        letter-spacing: -0.03em;
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .credit-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(212, 168, 83, 0.08);
        border: 1px solid rgba(212, 168, 83, 0.2);
        border-radius: 8px;
    }

    .credit-icon {
        font-size: 1.25rem;
    }

    .credit-amount {
        font-family: "Outfit", sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--accent);
    }

    .credit-label {
        font-size: 0.85rem;
        color: var(--gray-400);
    }

    .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
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
        content: "";
        position: absolute;
        inset: -40px;
        background: radial-gradient(
            ellipse at 50% 40%,
            rgba(212, 168, 83, 0.03) 0%,
            transparent 60%
        );
        pointer-events: none;
    }

    .empty-icon {
        color: var(--accent);
        margin-bottom: 20px;
        animation: float 3s ease-in-out infinite alternate;
    }

    @keyframes float {
        from {
            transform: translateY(0);
        }
        to {
            transform: translateY(-4px);
        }
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

    .submission-link {
        text-decoration: none;
        color: inherit;
        display: block;
        transition: transform var(--duration-fast) var(--ease-out);
    }

    .submission-link.clickable:hover {
        transform: translateX(2px);
    }

    /* Target inner panel content for layout */
    .submission-link :global(.submission-card .panel-content) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
    }

    .card-left {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .card-id {
        font-family: "Instrument Mono", monospace;
        font-size: 0.55rem;
        font-weight: 700;
        color: var(--gray-600);
        letter-spacing: 0.1em;
        margin-bottom: -2px;
    }

    .app-name {
        font-family: "Outfit", sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--fg);
    }

    .card-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 2px;
    }

    .review-type {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 700;
        text-transform: uppercase;
        background: rgba(168, 165, 160, 0.05);
        color: var(--gray-500);
        padding: 2px 6px;
        border-radius: 2px;
        letter-spacing: 0.05em;
    }

    .review-type.full {
        background: rgba(212, 168, 83, 0.05);
        color: var(--accent);
    }

    .date-stamp {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--gray-600);
        letter-spacing: 0.05em;
    }

    .card-right {
        flex-shrink: 0;
    }

    /* Unused Badge styles removed */

    /* === Responsive === */
    @media (max-width: 768px) {
        .dash-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
        }

        .header-actions {
            flex-wrap: wrap;
        }

        .credit-badge {
            flex: 1;
            justify-content: center;
        }

        .dash-header .btn {
            flex: 1;
        }
    }

    @media (max-width: 480px) {
        .header-actions {
            flex-direction: column;
        }

        .dash-header .btn {
            width: 100%;
        }
    }
</style>
