<script lang="ts">
    /**
     * LaunchChecklist.svelte
     *
     * "System Diagnostics" style checklist for App Store submission.
     */
    import type { ChecklistItem } from "$lib/engine/knowledge-base/launch-checklist";
    import CockpitPanel from "./CockpitPanel.svelte";
    import StatusLight from "./StatusLight.svelte";

    interface Props {
        items: ChecklistItem[];
    }

    let { items }: Props = $props();

    // Group by phase
    let preSubmission = $derived(
        items
            .filter((i) => i.phase === "pre_submission")
            .sort((a, b) => a.order - b.order),
    );
    let duringReview = $derived(
        items
            .filter((i) => i.phase === "during_review")
            .sort((a, b) => a.order - b.order),
    );
    let postApproval = $derived(
        items
            .filter((i) => i.phase === "post_approval")
            .sort((a, b) => a.order - b.order),
    );
</script>

<CockpitPanel class="launch-checklist">
    <div class="header-row">
        <div>
            <h3 class="panel-title">PREFLIGHT CHECKLIST</h3>
            <p class="panel-subtitle">SYSTEM DIAGNOSTICS & REQUIREMENTS</p>
        </div>
        <StatusLight
            status="processing"
            label="SYSTEM ACTIVE"
            pulse
            size="sm"
        />
    </div>

    <!-- Phase 1: Pre-Submission -->
    <div class="phase-container">
        <div class="phase-label">
            <span class="phase-index">01</span>
            <span class="phase-name">PRE-SUBMISSION PROTOCOLS</span>
        </div>

        <div class="diagnostic-grid">
            {#each preSubmission as item}
                <div class="diagnostic-row">
                    <div class="row-status">
                        <div class="toggle-switch"></div>
                    </div>
                    <div class="row-content">
                        <div class="row-header">
                            <span class="item-title">{item.title}</span>
                            {#if item.is_required}
                                <span class="tag-required">REQUIRED</span>
                            {/if}
                        </div>
                        <p class="item-desc">{item.description}</p>
                        {#if item.helpful_link}
                            <a
                                href={item.helpful_link}
                                target="_blank"
                                rel="noopener"
                                class="link-action"
                            >
                                [ACCESS DOCS]
                            </a>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Phase 2: During Review -->
    <div class="phase-container">
        <div class="phase-label">
            <span class="phase-index">02</span>
            <span class="phase-name">REVIEW MONITORING</span>
        </div>

        <div class="diagnostic-grid">
            {#each duringReview as item}
                <div class="diagnostic-row">
                    <div class="row-status">
                        <div class="toggle-switch"></div>
                    </div>
                    <div class="row-content">
                        <div class="row-header">
                            <span class="item-title">{item.title}</span>
                        </div>
                        <p class="item-desc">{item.description}</p>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Phase 3: Post-Approval -->
    <div class="phase-container">
        <div class="phase-label">
            <span class="phase-index">03</span>
            <span class="phase-name">DEPLOYMENT SEQUENCE</span>
        </div>

        <div class="diagnostic-grid">
            {#each postApproval as item}
                <div class="diagnostic-row">
                    <div class="row-status">
                        <div class="toggle-switch"></div>
                    </div>
                    <div class="row-content">
                        <div class="row-header">
                            <span class="item-title">{item.title}</span>
                        </div>
                        <p class="item-desc">{item.description}</p>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</CockpitPanel>

<style>
    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        padding-bottom: 20px;
    }

    .panel-title {
        font-family: "Outfit", sans-serif;
        font-weight: 700;
        font-size: 18px;
        letter-spacing: 0.05em;
        margin: 0;
        color: var(--fg);
        text-transform: uppercase;
    }

    .panel-subtitle {
        font-family: "Instrument Mono", monospace;
        font-size: 11px;
        color: var(--accent);
        margin: 4px 0 0 0;
        letter-spacing: 0.1em;
        opacity: 0.8;
    }

    .phase-container {
        margin-bottom: 40px;
    }

    .phase-container:last-child {
        margin-bottom: 0;
    }

    .phase-label {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        color: var(--gray-400);
    }

    .phase-index {
        font-family: "Instrument Mono", monospace;
        font-size: 12px;
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        color: var(--fg);
    }

    .phase-name {
        font-family: "Outfit", sans-serif;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .diagnostic-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2px; /* Slight gap for grid lines */
        background: rgba(255, 255, 255, 0.03); /* Grid line color */
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        overflow: hidden;
    }

    .diagnostic-row {
        background: rgba(15, 15, 18, 0.4); /* Row bg */
        padding: 16px;
        display: flex;
        gap: 16px;
        transition: background 0.2s ease;
    }

    .diagnostic-row:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    .toggle-switch {
        width: 16px;
        height: 16px;
        border: 1px solid var(--gray-500);
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.2);
        cursor: pointer;
        position: relative;
    }

    /* Simulate a checked state visually for now - functionality would be added later */
    .toggle-switch:hover {
        border-color: var(--accent);
        box-shadow: 0 0 8px var(--accent-subtle);
    }

    .row-content {
        flex: 1;
    }

    .row-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
    }

    .item-title {
        font-family: "Instrument Sans", sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: var(--fg);
    }

    .tag-required {
        font-family: "Instrument Mono", monospace;
        font-size: 9px;
        color: var(--status-failed-fg);
        background: rgba(239, 68, 68, 0.1);
        padding: 2px 6px;
        border-radius: 2px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .item-desc {
        font-size: 13px;
        color: var(--gray-400);
        line-height: 1.5;
        margin: 0 0 8px 0;
        max-width: 90%;
    }

    .link-action {
        font-family: "Instrument Mono", monospace;
        font-size: 11px;
        color: var(--accent);
        text-decoration: none;
        opacity: 0.8;
        transition: opacity 0.2s;
    }

    .link-action:hover {
        opacity: 1;
        text-decoration: none;
    }
</style>
