<script lang="ts">
    /**
     * Launch Checklist Component
     *
     * Guides first-time publishers through every step of the App Store submission process.
     * Organized by phase: Pre-submission, During Review, Post-Approval.
     */
    import type { ChecklistItem, ChecklistPhase } from '$lib/engine/knowledge-base/launch-checklist';

    interface Props {
        items: ChecklistItem[];
        appCategory?: string;
    }

    let { items, appCategory = '' }: Props = $props();

    // Filter items relevant to this app category
    let relevantItems = $derived(
        items.filter(item => {
            if (!item.category_specific || item.category_specific.length === 0) {
                return true;
            }
            return item.category_specific.includes(appCategory);
        })
    );

    // Group by phase
    let preSubmission = $derived(
        relevantItems.filter(i => i.phase === 'pre_submission').sort((a, b) => a.order - b.order)
    );
    let duringReview = $derived(
        relevantItems.filter(i => i.phase === 'during_review').sort((a, b) => a.order - b.order)
    );
    let postApproval = $derived(
        relevantItems.filter(i => i.phase === 'post_approval').sort((a, b) => a.order - b.order)
    );

    // Track expanded items
    let expandedItems = $state<Set<string>>(new Set());

    function toggleItem(itemId: string) {
        if (expandedItems.has(itemId)) {
            expandedItems.delete(itemId);
        } else {
            expandedItems.add(itemId);
        }
        expandedItems = new Set(expandedItems);
    }

    function getPhaseIcon(phase: ChecklistPhase) {
        switch (phase) {
            case 'pre_submission':
                return '1';
            case 'during_review':
                return '2';
            case 'post_approval':
                return '3';
        }
    }

    function getCategoryIcon(category: string) {
        const icons: Record<string, string> = {
            'account_setup': '🔐',
            'app_preparation': '📱',
            'metadata': '📝',
            'screenshots_media': '🖼️',
            'legal_privacy': '⚖️',
            'testing': '🧪',
            'submission': '📤',
            'review_process': '⏳',
            'communication': '💬',
            'launch_marketing': '🚀',
            'optimization': '📊',
            'maintenance': '🔧',
        };
        return icons[category] || '📋';
    }
</script>

<div class="launch-checklist">
    <div class="section-header">
        <div class="header-icon">🚀</div>
        <div>
            <h3>Your Launch Checklist</h3>
            <p class="header-subtitle">
                Everything you need to do to get from "I built an app" to "It's live on the App Store"
            </p>
        </div>
    </div>

    <!-- Phase 1: Pre-Submission -->
    <div class="phase-section">
        <div class="phase-header">
            <div class="phase-number">1</div>
            <div>
                <h4>Before You Submit</h4>
                <p class="phase-count">{preSubmission.length} steps to complete</p>
            </div>
        </div>

        <div class="items-list">
            {#each preSubmission as item}
                <div class="checklist-item" class:expanded={expandedItems.has(item.id)}>
                    <button class="item-header" onclick={() => toggleItem(item.id)}>
                        <span class="item-icon">{getCategoryIcon(item.category)}</span>
                        <span class="item-title">
                            {item.title}
                            {#if item.is_required}
                                <span class="required-badge">Required</span>
                            {/if}
                        </span>
                        {#if item.estimated_time}
                            <span class="time-estimate">{item.estimated_time}</span>
                        {/if}
                        <span class="expand-icon">{expandedItems.has(item.id) ? '−' : '+'}</span>
                    </button>

                    {#if expandedItems.has(item.id)}
                        <div class="item-content">
                            <p class="item-description">{item.description}</p>

                            <div class="content-section why">
                                <h5>Why This Matters</h5>
                                <p>{item.why_it_matters}</p>
                            </div>

                            <div class="content-section how">
                                <h5>How To Do It</h5>
                                <p class="how-content">{item.how_to_do_it}</p>
                            </div>

                            {#if item.helpful_link}
                                <a href={item.helpful_link} target="_blank" rel="noopener" class="helpful-link">
                                    📖 Read Apple's Guide →
                                </a>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <!-- Phase 2: During Review -->
    <div class="phase-section">
        <div class="phase-header">
            <div class="phase-number">2</div>
            <div>
                <h4>During the Review</h4>
                <p class="phase-count">{duringReview.length} things to know</p>
            </div>
        </div>

        <div class="items-list">
            {#each duringReview as item}
                <div class="checklist-item" class:expanded={expandedItems.has(item.id)}>
                    <button class="item-header" onclick={() => toggleItem(item.id)}>
                        <span class="item-icon">{getCategoryIcon(item.category)}</span>
                        <span class="item-title">{item.title}</span>
                        {#if item.estimated_time}
                            <span class="time-estimate">{item.estimated_time}</span>
                        {/if}
                        <span class="expand-icon">{expandedItems.has(item.id) ? '−' : '+'}</span>
                    </button>

                    {#if expandedItems.has(item.id)}
                        <div class="item-content">
                            <p class="item-description">{item.description}</p>

                            <div class="content-section why">
                                <h5>Why This Matters</h5>
                                <p>{item.why_it_matters}</p>
                            </div>

                            <div class="content-section how">
                                <h5>What To Know</h5>
                                <p class="how-content">{item.how_to_do_it}</p>
                            </div>

                            {#if item.helpful_link}
                                <a href={item.helpful_link} target="_blank" rel="noopener" class="helpful-link">
                                    📖 Learn More →
                                </a>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <!-- Phase 3: Post-Approval -->
    <div class="phase-section">
        <div class="phase-header">
            <div class="phase-number">3</div>
            <div>
                <h4>After You're Live</h4>
                <p class="phase-count">{postApproval.length} next steps</p>
            </div>
        </div>

        <div class="items-list">
            {#each postApproval as item}
                <div class="checklist-item" class:expanded={expandedItems.has(item.id)}>
                    <button class="item-header" onclick={() => toggleItem(item.id)}>
                        <span class="item-icon">{getCategoryIcon(item.category)}</span>
                        <span class="item-title">{item.title}</span>
                        {#if item.estimated_time}
                            <span class="time-estimate">{item.estimated_time}</span>
                        {/if}
                        <span class="expand-icon">{expandedItems.has(item.id) ? '−' : '+'}</span>
                    </button>

                    {#if expandedItems.has(item.id)}
                        <div class="item-content">
                            <p class="item-description">{item.description}</p>

                            <div class="content-section why">
                                <h5>Why This Matters</h5>
                                <p>{item.why_it_matters}</p>
                            </div>

                            <div class="content-section how">
                                <h5>How To Do It</h5>
                                <p class="how-content">{item.how_to_do_it}</p>
                            </div>

                            {#if item.helpful_link}
                                <a href={item.helpful_link} target="_blank" rel="noopener" class="helpful-link">
                                    📖 Read More →
                                </a>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <!-- Educational Footer -->
    <div class="education-footer">
        <div class="footer-content">
            <span class="footer-icon">💡</span>
            <div>
                <strong>Tip: Don't rush!</strong>
                <p>
                    First-time submissions often get rejected for simple mistakes. Take your time
                    with each step. It's better to spend an extra day preparing than a week
                    going back and forth with App Review.
                </p>
            </div>
        </div>
    </div>
</div>

<style>
    .launch-checklist {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        padding: 24px;
    }

    .section-header {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
    }

    .header-icon {
        font-size: 28px;
    }

    .section-header h3 {
        font-size: 18px;
        font-weight: 600;
        color: var(--fg);
        margin: 0;
    }

    .header-subtitle {
        font-size: 13px;
        color: var(--gray-400);
        margin: 4px 0 0 0;
    }

    /* Phase Sections */
    .phase-section {
        margin-bottom: 24px;
    }

    .phase-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
    }

    .phase-number {
        width: 32px;
        height: 32px;
        background: #6366f1;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
    }

    .phase-header h4 {
        font-size: 16px;
        font-weight: 600;
        color: var(--fg);
        margin: 0;
    }

    .phase-count {
        font-size: 12px;
        color: var(--gray-400);
        margin: 2px 0 0 0;
    }

    /* Items List */
    .items-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .checklist-item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        overflow: hidden;
    }

    .item-header {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
    }

    .item-header:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .item-icon {
        font-size: 18px;
        flex-shrink: 0;
    }

    .item-title {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        color: var(--fg);
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .required-badge {
        background: rgba(220, 38, 38, 0.2);
        color: #f87171;
        font-size: 10px;
        font-weight: 500;
        padding: 2px 6px;
        border-radius: 4px;
    }

    .time-estimate {
        font-size: 12px;
        color: var(--gray-500);
        flex-shrink: 0;
    }

    .expand-icon {
        font-size: 18px;
        color: var(--gray-500);
        flex-shrink: 0;
    }

    /* Item Content */
    .item-content {
        padding: 0 16px 16px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .item-description {
        font-size: 14px;
        color: var(--gray-300);
        line-height: 1.6;
        margin: 12px 0;
    }

    .content-section {
        margin-bottom: 16px;
    }

    .content-section h5 {
        font-size: 12px;
        font-weight: 600;
        color: var(--gray-400);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 8px 0;
    }

    .content-section p {
        font-size: 13px;
        color: var(--gray-300);
        line-height: 1.6;
        margin: 0;
    }

    .content-section.why {
        background: rgba(212, 168, 83, 0.1);
        border: 1px solid rgba(212, 168, 83, 0.2);
        border-radius: 6px;
        padding: 12px;
    }

    .content-section.why h5 {
        color: var(--accent);
    }

    .content-section.why p {
        color: #d4a853;
    }

    .content-section.how {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.2);
        border-radius: 6px;
        padding: 12px;
    }

    .content-section.how h5 {
        color: #4ade80;
    }

    .content-section.how p,
    .how-content {
        color: #86efac;
        white-space: pre-wrap;
    }

    .helpful-link {
        display: inline-block;
        font-size: 13px;
        color: var(--accent);
        text-decoration: none;
        font-weight: 500;
    }

    .helpful-link:hover {
        text-decoration: underline;
    }

    /* Education Footer */
    .education-footer {
        background: rgba(212, 168, 83, 0.1);
        border: 1px solid rgba(212, 168, 83, 0.3);
        border-radius: 8px;
        padding: 16px;
        margin-top: 8px;
    }

    .footer-content {
        display: flex;
        gap: 12px;
    }

    .footer-icon {
        font-size: 20px;
        flex-shrink: 0;
    }

    .education-footer strong {
        font-size: 13px;
        color: var(--accent);
    }

    .education-footer p {
        font-size: 13px;
        color: var(--gray-300);
        line-height: 1.5;
        margin: 4px 0 0 0;
    }
</style>
