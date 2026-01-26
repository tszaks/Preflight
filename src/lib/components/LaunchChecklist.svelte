<script lang="ts">
    /**
     * Launch Checklist Component
     *
     * Simple checklist for App Store submission requirements.
     */
    import type { ChecklistItem, ChecklistPhase } from '$lib/engine/knowledge-base/launch-checklist';

    interface Props {
        items: ChecklistItem[];
    }

    let { items }: Props = $props();

    // Group by phase
    let preSubmission = $derived(
        items.filter(i => i.phase === 'pre_submission').sort((a, b) => a.order - b.order)
    );
    let duringReview = $derived(
        items.filter(i => i.phase === 'during_review').sort((a, b) => a.order - b.order)
    );
    let postApproval = $derived(
        items.filter(i => i.phase === 'post_approval').sort((a, b) => a.order - b.order)
    );
</script>

<div class="launch-checklist">
    <div class="section-header">
        <h3>Launch Checklist</h3>
        <p class="header-subtitle">What you need to submit to the App Store</p>
    </div>

    <!-- Phase 1: Pre-Submission -->
    <div class="phase-section">
        <div class="phase-header">
            <div class="phase-number">1</div>
            <h4>Before You Submit</h4>
        </div>

        <div class="items-list">
            {#each preSubmission as item}
                <div class="checklist-item">
                    <div class="item-content">
                        <div class="item-title">
                            {item.title}
                            {#if item.is_required}
                                <span class="required-badge">Required</span>
                            {/if}
                        </div>
                        <p class="item-description">{item.description}</p>
                        {#if item.helpful_link}
                            <a href={item.helpful_link} target="_blank" rel="noopener" class="helpful-link">
                                Learn more
                            </a>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Phase 2: During Review -->
    <div class="phase-section">
        <div class="phase-header">
            <div class="phase-number">2</div>
            <h4>During Review</h4>
        </div>

        <div class="items-list">
            {#each duringReview as item}
                <div class="checklist-item">
                    <div class="item-content">
                        <div class="item-title">{item.title}</div>
                        <p class="item-description">{item.description}</p>
                        {#if item.helpful_link}
                            <a href={item.helpful_link} target="_blank" rel="noopener" class="helpful-link">
                                Learn more
                            </a>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Phase 3: Post-Approval -->
    <div class="phase-section">
        <div class="phase-header">
            <div class="phase-number">3</div>
            <h4>After Approval</h4>
        </div>

        <div class="items-list">
            {#each postApproval as item}
                <div class="checklist-item">
                    <div class="item-content">
                        <div class="item-title">{item.title}</div>
                        <p class="item-description">{item.description}</p>
                        {#if item.helpful_link}
                            <a href={item.helpful_link} target="_blank" rel="noopener" class="helpful-link">
                                Learn more
                            </a>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .launch-checklist {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 20px;
    }

    .section-header {
        margin-bottom: 20px;
    }

    .section-header h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--fg);
        margin: 0;
    }

    .header-subtitle {
        font-size: 13px;
        color: var(--gray-400);
        margin: 4px 0 0 0;
    }

    .phase-section {
        margin-bottom: 20px;
    }

    .phase-section:last-child {
        margin-bottom: 0;
    }

    .phase-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
    }

    .phase-number {
        width: 24px;
        height: 24px;
        background: #6366f1;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
        flex-shrink: 0;
    }

    .phase-header h4 {
        font-size: 14px;
        font-weight: 600;
        color: var(--fg);
        margin: 0;
    }

    .items-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-left: 34px;
    }

    .checklist-item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        padding: 12px;
    }

    .item-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--fg);
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
    }

    .required-badge {
        background: rgba(220, 38, 38, 0.2);
        color: #f87171;
        font-size: 10px;
        font-weight: 500;
        padding: 2px 6px;
        border-radius: 4px;
    }

    .item-description {
        font-size: 12px;
        color: var(--gray-400);
        line-height: 1.5;
        margin: 0;
    }

    .helpful-link {
        display: inline-block;
        font-size: 12px;
        color: var(--accent);
        text-decoration: none;
        margin-top: 6px;
    }

    .helpful-link:hover {
        text-decoration: underline;
    }
</style>
