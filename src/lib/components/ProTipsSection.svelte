<script lang="ts">
    /**
     * Pro Tips Section
     *
     * Displays insider knowledge and category-specific tips that save
     * first-time publishers from costly mistakes. These are the "nobody told me"
     * gotchas that experienced developers know.
     */
    import type { ProTip } from '$lib/engine/knowledge-base/pro-tips';
    import { getProTipsBySeverity } from '$lib/engine/knowledge-base/pro-tips';

    interface Props {
        tips: ProTip[];
        appCategory?: string;
    }

    let { tips, appCategory = '' }: Props = $props();

    let categorizedTips = $derived(getProTipsBySeverity(tips));

    let expandedTips = $state<Set<string>>(new Set());

    function toggleTip(tipId: string) {
        if (expandedTips.has(tipId)) {
            expandedTips.delete(tipId);
            expandedTips = new Set(expandedTips);
        } else {
            expandedTips.add(tipId);
            expandedTips = new Set(expandedTips);
        }
    }

    // SVG icons for severity levels - replaces emoji for professional appearance
    const severityIcons: Record<string, string> = {
        critical: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        important: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        helpful: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
    };

    const defaultSeverityIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

    function getSeverityIcon(severity: string) {
        return severityIcons[severity] || defaultSeverityIcon;
    }

    function getSeverityLabel(severity: string) {
        switch (severity) {
            case 'critical':
                return 'Must Know';
            case 'important':
                return 'Important';
            case 'helpful':
                return 'Pro Tip';
            default:
                return 'Tip';
        }
    }
</script>

<div class="pro-tips-section">
    <div class="section-header">
        <div class="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
        </div>
        <div>
            <h3>Insider Tips {#if appCategory}for {appCategory} Apps{/if}</h3>
            <p class="header-subtitle">
                Things experienced developers know that first-timers learn the hard way
            </p>
        </div>
    </div>

    {#if tips.length === 0}
        <div class="no-tips">
            <p>No specific tips for your app configuration. You're in good shape!</p>
        </div>
    {:else}
        <!-- Critical Tips -->
        {#if categorizedTips.critical.length > 0}
            <div class="tips-category critical">
                <div class="category-header">
                    <span class="category-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </span>
                    <h4>Must Know Before You Submit</h4>
                    <span class="tip-count">{categorizedTips.critical.length}</span>
                </div>
                <div class="tips-list">
                    {#each categorizedTips.critical as tip}
                        <div class="tip-card critical" class:expanded={expandedTips.has(tip.id)}>
                            <button class="tip-header" onclick={() => toggleTip(tip.id)}>
                                <span class="tip-title">{tip.title}</span>
                                <span class="expand-icon">{expandedTips.has(tip.id) ? '−' : '+'}</span>
                            </button>
                            {#if expandedTips.has(tip.id)}
                                <div class="tip-content">
                                    <p class="tip-description">{tip.description}</p>

                                    <div class="tip-detail">
                                        <span class="detail-label">Why this matters:</span>
                                        <p>{tip.why_it_matters}</p>
                                    </div>

                                    <div class="tip-detail action">
                                        <span class="detail-label">What to do:</span>
                                        <p>{tip.action}</p>
                                    </div>

                                    {#if tip.cost_impact || tip.time_impact}
                                        <div class="impacts">
                                            {#if tip.cost_impact}
                                                <span class="impact cost">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                                    {tip.cost_impact}
                                                </span>
                                            {/if}
                                            {#if tip.time_impact}
                                                <span class="impact time">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                    {tip.time_impact}
                                                </span>
                                            {/if}
                                        </div>
                                    {/if}

                                    {#if tip.link}
                                        <a href={tip.link} target="_blank" rel="noopener" class="tip-link">
                                            Learn more →
                                        </a>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Important Tips -->
        {#if categorizedTips.important.length > 0}
            <div class="tips-category important">
                <div class="category-header">
                    <span class="category-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </span>
                    <h4>Important to Know</h4>
                    <span class="tip-count">{categorizedTips.important.length}</span>
                </div>
                <div class="tips-list">
                    {#each categorizedTips.important as tip}
                        <div class="tip-card important" class:expanded={expandedTips.has(tip.id)}>
                            <button class="tip-header" onclick={() => toggleTip(tip.id)}>
                                <span class="tip-title">{tip.title}</span>
                                <span class="expand-icon">{expandedTips.has(tip.id) ? '−' : '+'}</span>
                            </button>
                            {#if expandedTips.has(tip.id)}
                                <div class="tip-content">
                                    <p class="tip-description">{tip.description}</p>

                                    <div class="tip-detail">
                                        <span class="detail-label">Why this matters:</span>
                                        <p>{tip.why_it_matters}</p>
                                    </div>

                                    <div class="tip-detail action">
                                        <span class="detail-label">What to do:</span>
                                        <p>{tip.action}</p>
                                    </div>

                                    {#if tip.link}
                                        <a href={tip.link} target="_blank" rel="noopener" class="tip-link">
                                            Learn more →
                                        </a>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Helpful Tips -->
        {#if categorizedTips.helpful.length > 0}
            <div class="tips-category helpful">
                <div class="category-header">
                    <span class="category-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
                        </svg>
                    </span>
                    <h4>Pro Tips</h4>
                    <span class="tip-count">{categorizedTips.helpful.length}</span>
                </div>
                <div class="tips-list">
                    {#each categorizedTips.helpful as tip}
                        <div class="tip-card helpful" class:expanded={expandedTips.has(tip.id)}>
                            <button class="tip-header" onclick={() => toggleTip(tip.id)}>
                                <span class="tip-title">{tip.title}</span>
                                <span class="expand-icon">{expandedTips.has(tip.id) ? '−' : '+'}</span>
                            </button>
                            {#if expandedTips.has(tip.id)}
                                <div class="tip-content">
                                    <p class="tip-description">{tip.description}</p>

                                    <div class="tip-detail">
                                        <span class="detail-label">Why this matters:</span>
                                        <p>{tip.why_it_matters}</p>
                                    </div>

                                    <div class="tip-detail action">
                                        <span class="detail-label">What to do:</span>
                                        <p>{tip.action}</p>
                                    </div>

                                    {#if tip.cost_impact}
                                        <div class="impacts">
                                            <span class="impact cost">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                                    {tip.cost_impact}
                                                </span>
                                        </div>
                                    {/if}

                                    {#if tip.link}
                                        <a href={tip.link} target="_blank" rel="noopener" class="tip-link">
                                            Learn more →
                                        </a>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/if}

    <!-- Educational Footer -->
    <div class="education-footer">
        <div class="footer-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
        </div>
        <p>
            <strong>These tips are based on real developer experiences.</strong>
            We've compiled gotchas from Apple Developer Forums, Reddit r/iOSProgramming,
            and thousands of App Store submissions. Following these tips can save you
            weeks of back-and-forth with App Review.
        </p>
    </div>
</div>

<style>
    .pro-tips-section {
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
        font-size: 24px;
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

    .no-tips {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
        border-radius: 8px;
        padding: 16px;
    }

    .no-tips p {
        margin: 0;
        color: #4ade80;
        font-size: 14px;
    }

    /* Category Sections */
    .tips-category {
        margin-bottom: 24px;
    }

    .tips-category:last-child {
        margin-bottom: 0;
    }

    .category-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
    }

    .category-icon {
        font-size: 16px;
    }

    .category-header h4 {
        font-size: 14px;
        font-weight: 600;
        color: var(--fg);
        margin: 0;
        flex: 1;
    }

    .tip-count {
        background: rgba(255, 255, 255, 0.1);
        color: var(--gray-300);
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 10px;
    }

    /* Tip Cards */
    .tips-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .tip-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        overflow: hidden;
    }

    .tip-card.critical {
        border-left: 3px solid #dc2626;
    }

    .tip-card.important {
        border-left: 3px solid #f59e0b;
    }

    .tip-card.helpful {
        border-left: 3px solid #3b82f6;
    }

    .tip-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
    }

    .tip-header:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .tip-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--fg);
    }

    .expand-icon {
        font-size: 18px;
        color: var(--gray-500);
        font-weight: 300;
    }

    .tip-content {
        padding: 0 16px 16px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .tip-description {
        font-size: 14px;
        color: var(--gray-300);
        line-height: 1.6;
        margin: 12px 0;
    }

    .tip-detail {
        margin-bottom: 12px;
    }

    .detail-label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: var(--gray-400);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
    }

    .tip-detail p {
        font-size: 13px;
        color: var(--gray-300);
        line-height: 1.5;
        margin: 0;
    }

    .tip-detail.action {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.2);
        border-radius: 6px;
        padding: 12px;
    }

    .tip-detail.action .detail-label {
        color: #4ade80;
    }

    .tip-detail.action p {
        color: #86efac;
    }

    .impacts {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 12px;
    }

    .impact {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 12px;
    }

    .impact.cost {
        background: rgba(212, 168, 83, 0.15);
        color: var(--accent);
    }

    .impact.time {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
    }

    .tip-link {
        display: inline-block;
        font-size: 13px;
        color: var(--accent);
        text-decoration: none;
        font-weight: 500;
    }

    .tip-link:hover {
        text-decoration: underline;
    }

    /* Education Footer */
    .education-footer {
        display: flex;
        gap: 12px;
        background: rgba(212, 168, 83, 0.1);
        border: 1px solid rgba(212, 168, 83, 0.3);
        border-radius: 8px;
        padding: 16px;
        margin-top: 24px;
    }

    .footer-icon {
        font-size: 20px;
        flex-shrink: 0;
    }

    .education-footer p {
        font-size: 13px;
        color: var(--gray-300);
        line-height: 1.5;
        margin: 0;
    }

    .education-footer strong {
        color: var(--accent);
    }
</style>
