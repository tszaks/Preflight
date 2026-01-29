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
            status === "draft" ||
            status === "complete" ||
            status === "analyzing" ||
            status === "queued"
        );
    }

    function getSubmissionHref(sub: Submission): string | undefined {
        if (sub.status === "draft") {
            return `/submit?draft=${sub.id}`;
        }
        if (sub.status === "complete" || sub.status === "analyzing" || sub.status === "queued") {
            return `/report/${sub.id}`;
        }
        return undefined;
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
            <!-- Ambient glow behind the radar -->
            <div class="empty-glow"></div>

            <!-- Technical readout label -->
            <div class="readout-label">SYS STATUS</div>

            <!-- Radar scope -->
            <div class="radar-scope">
                <svg class="radar-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- Concentric range rings -->
                    <circle cx="100" cy="100" r="90" stroke="rgba(212, 168, 83, 0.08)" stroke-width="0.75" />
                    <circle cx="100" cy="100" r="65" stroke="rgba(212, 168, 83, 0.06)" stroke-width="0.75" />
                    <circle cx="100" cy="100" r="40" stroke="rgba(212, 168, 83, 0.05)" stroke-width="0.75" />

                    <!-- Crosshairs -->
                    <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(212, 168, 83, 0.05)" stroke-width="0.5" />
                    <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(212, 168, 83, 0.05)" stroke-width="0.5" />

                    <!-- Pulse rings (expanding outward from center) -->
                    <circle class="pulse-ring ring-1" cx="100" cy="100" r="20" fill="none" stroke="var(--accent)" stroke-width="0.75" />
                    <circle class="pulse-ring ring-2" cx="100" cy="100" r="20" fill="none" stroke="var(--accent)" stroke-width="0.75" />
                    <circle class="pulse-ring ring-3" cx="100" cy="100" r="20" fill="none" stroke="var(--accent)" stroke-width="0.75" />

                    <!-- Center blip (steady glow) -->
                    <circle cx="100" cy="100" r="4" fill="var(--accent)" opacity="0.5" class="center-blip" />
                    <circle cx="100" cy="100" r="7" fill="none" stroke="var(--accent)" stroke-width="0.5" opacity="0.2" />

                    <!-- Aircraft icon at center (top-down view) -->
                    <g transform="translate(100, 100)" fill="var(--accent)" opacity="0.65">
                        <!-- Fuselage -->
                        <ellipse cx="0" cy="0" rx="2.5" ry="16" />
                        <!-- Nose cone -->
                        <path d="M-2,-16 Q0,-22 2,-16 Z" />
                        <!-- Main wings (swept back) -->
                        <path d="M0,-2 L-20,6 L-20,8 L-1,3 Z" />
                        <path d="M0,-2 L20,6 L20,8 L1,3 Z" />
                        <!-- Tail wings -->
                        <path d="M0,11 L-9,16 L-9,17 L0,13 Z" />
                        <path d="M0,11 L9,16 L9,17 L0,13 Z" />
                    </g>
                </svg>

                <!-- Scanline overlay -->
                <div class="scanlines"></div>
            </div>

            <!-- Status row -->
            <div class="status-row">
                <div class="status-item">
                    <span class="status-dot idle"></span>
                    <span class="status-text">NO SUBMISSIONS</span>
                </div>
                <div class="status-divider"></div>
                <div class="status-item">
                    <span class="status-dot standby"></span>
                    <span class="status-text">AWAITING INPUT</span>
                </div>
            </div>

            <!-- Heading -->
            <h2>Ready for Departure</h2>
            <p>
                Your runway is clear. Upload your first iOS submission and Preflight
                will scan it against Apple's review guidelines -- catching rejection
                risks before you hit Send.
            </p>

            <!-- Checklist preview -->
            <div class="preflight-checklist">
                <div class="checklist-item">
                    <span class="check-box"></span>
                    <span>Metadata validation</span>
                </div>
                <div class="checklist-item">
                    <span class="check-box"></span>
                    <span>Privacy manifest audit</span>
                </div>
                <div class="checklist-item">
                    <span class="check-box"></span>
                    <span>Screenshot compliance</span>
                </div>
                <div class="checklist-item">
                    <span class="check-box"></span>
                    <span>Guideline review</span>
                </div>
            </div>

            <!-- CTA -->
            <a href="/submit" class="btn btn-primary btn-lg cta-launch">
                Begin Preflight Check
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
            </a>
        </CockpitPanel>
    {:else}
        <div class="submissions-list">
            {#each submissions as sub (sub.id)}
                {@const clickable = isClickable(sub.status)}
                <a
                    href={getSubmissionHref(sub)}
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
                                <span class="review-type full">Full Review</span>
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
    :global(.empty-state .panel-content) {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 48px 32px 56px;
        position: relative;
    }

    .empty-glow {
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        width: 400px;
        height: 300px;
        background: radial-gradient(
            ellipse at 50% 60%,
            rgba(212, 168, 83, 0.06) 0%,
            rgba(212, 168, 83, 0.02) 40%,
            transparent 70%
        );
        pointer-events: none;
        z-index: 0;
    }

    .readout-label {
        font-family: 'Instrument Mono', monospace;
        font-size: 0.5rem;
        font-weight: 700;
        color: var(--gray-500);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 4px 12px;
        margin-bottom: 32px;
    }

    /* Radar Scope */
    .radar-scope {
        position: relative;
        width: 180px;
        height: 180px;
        margin-bottom: 28px;
        border-radius: 50%;
        overflow: hidden;
        background: radial-gradient(
            circle at 50% 50%,
            rgba(212, 168, 83, 0.03) 0%,
            transparent 70%
        );
    }

    .radar-svg {
        width: 100%;
        height: 100%;
    }

    .pulse-ring {
        transform-origin: 100px 100px;
        animation: radar-pulse 3.5s ease-out infinite;
        opacity: 0;
    }

    .ring-2 { animation-delay: 1.15s; }
    .ring-3 { animation-delay: 2.3s; }

    @keyframes radar-pulse {
        0% {
            r: 8;
            opacity: 0.5;
            stroke-width: 1.5;
        }
        100% {
            r: 90;
            opacity: 0;
            stroke-width: 0.3;
        }
    }

    .center-blip {
        animation: blip-glow 3.5s ease-in-out infinite;
    }

    @keyframes blip-glow {
        0%, 100% { opacity: 0.3; }
        15% { opacity: 0.8; }
        30% { opacity: 0.3; }
    }

    .scanlines {
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 3px,
            rgba(212, 168, 83, 0.015) 3px,
            rgba(212, 168, 83, 0.015) 4px
        );
        pointer-events: none;
        border-radius: 50%;
    }

    /* Status Row */
    .status-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
    }

    .status-item {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
    }

    .status-dot.idle {
        background: var(--gray-500);
        box-shadow: 0 0 6px var(--gray-500);
    }

    .status-dot.standby {
        background: var(--accent);
        box-shadow: 0 0 6px var(--accent);
        animation: pulse-dot 2s ease-in-out infinite;
    }

    @keyframes pulse-dot {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
    }

    .status-text {
        font-family: 'Instrument Mono', monospace;
        font-size: 0.5rem;
        font-weight: 700;
        color: var(--gray-500);
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .status-divider {
        width: 1px;
        height: 12px;
        background: rgba(255, 255, 255, 0.08);
    }

    /* Empty state heading + copy */
    :global(.empty-state .panel-content) h2 {
        font-family: 'Outfit', sans-serif;
        font-size: 22px;
        font-weight: 700;
        color: var(--fg);
        margin-bottom: 10px;
        letter-spacing: -0.02em;
    }

    :global(.empty-state .panel-content) p {
        font-size: 14px;
        color: var(--gray-300);
        line-height: 1.7;
        max-width: 400px;
        margin-bottom: 28px;
    }

    /* Preflight Checklist */
    .preflight-checklist {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 24px;
        margin-bottom: 32px;
        padding: 16px 20px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 4px;
    }

    .checklist-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Instrument Sans', sans-serif;
        font-size: 12px;
        color: var(--gray-300);
    }

    .check-box {
        width: 12px;
        height: 12px;
        border: 1.5px solid rgba(212, 168, 83, 0.3);
        border-radius: 2px;
        flex-shrink: 0;
    }

    /* CTA Button */
    .cta-launch {
        position: relative;
        z-index: 1;
    }

    /* Empty state responsive */
    @media (max-width: 520px) {
        :global(.empty-state .panel-content) {
            padding: 36px 20px 44px;
        }

        .radar-scope {
            width: 140px;
            height: 140px;
        }

        .status-row {
            flex-direction: column;
            gap: 8px;
        }

        .status-divider {
            width: 20px;
            height: 1px;
        }

        .preflight-checklist {
            grid-template-columns: 1fr;
            gap: 6px;
            width: 100%;
        }

        :global(.empty-state .panel-content) h2 {
            font-size: 19px;
        }
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
