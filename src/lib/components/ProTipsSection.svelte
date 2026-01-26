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

    function getSeverityIcon(severity: string) {
        switch (severity) {
            case 'critical':
                return '🚨';
            case 'important':
                return '⚠️';
            case 'helpful':
                return '💡';
            default:
                return '📌';
        }
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
        <div class="header-icon">💎</div>
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
                    <span class="category-icon">🚨</span>
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
                                                <span class="impact cost">💰 {tip.cost_impact}</span>
                                            {/if}
                                            {#if tip.time_impact}
                                                <span class="impact time">⏱️ {tip.time_impact}</span>
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
                    <span class="category-icon">⚠️</span>
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
                    <span class="category-icon">💡</span>
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
                                            <span class="impact cost">💰 {tip.cost_impact}</span>
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
        <div class="footer-icon">📚</div>
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
