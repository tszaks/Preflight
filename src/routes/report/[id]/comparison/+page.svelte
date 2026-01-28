<script lang="ts">
    import { diffReports, formatDiffSummary, type ReportDiff } from '$lib/engine/report/diff';
    import type { CheckResult, ScoreResult } from '$lib/engine/types';

    let { data } = $props();

    // Convert DB report items to CheckResult format for the diff engine
    function toCheckResults(items: any[]): CheckResult[] {
        return items.map(item => ({
            category: item.category,
            severity: item.severity,
            title: item.title,
            description: item.description,
            guideline_ref: item.guideline_ref,
            fix_suggestion: item.fix_suggestion,
            confidence: item.confidence,
        }));
    }

    function toScoreResult(report: any): ScoreResult {
        return {
            score_metadata: report.score_metadata,
            score_screenshots: report.score_screenshots,
            score_privacy: report.score_privacy,
            score_plist: report.score_plist,
            score_urls: report.score_urls,
            score_content: report.score_content,
            score_overall: report.score_overall ?? 0,
        };
    }

    const diff: ReportDiff = diffReports(
        toCheckResults(data.originalItems),
        toCheckResults(data.currentItems),
        toScoreResult(data.originalReport),
        toScoreResult(data.currentReport)
    );

    const scoreDelta = diff.score_delta.overall;
    const deltaSign = scoreDelta.delta >= 0 ? '+' : '';

    function severityColor(severity: string): string {
        switch (severity) {
            case 'critical': return '#ff4444';
            case 'warning': return '#ffaa00';
            case 'info': return '#4da6ff';
            default: return '#888';
        }
    }
</script>

<svelte:head>
    <title>Report Comparison | Preflight</title>
</svelte:head>

<div class="comparison-page">
    <header class="comparison-header">
        <a href="/report/{data.currentReport.id}" class="back-link">&larr; Back to Report</a>
        <h1>{data.submission.app_name} — Before vs After</h1>
        <p class="subtitle">Comparing your retest results against the original submission</p>
    </header>

    <!-- Score Delta Hero -->
    <section class="score-hero" class:improved={diff.summary.improved} class:regressed={!diff.summary.improved && scoreDelta.delta < 0}>
        <div class="score-comparison">
            <div class="score-box old">
                <span class="label">Before</span>
                <span class="value">{scoreDelta.old}</span>
            </div>
            <div class="score-arrow">
                {#if scoreDelta.delta > 0}
                    <span class="arrow up">↑</span>
                {:else if scoreDelta.delta < 0}
                    <span class="arrow down">↓</span>
                {:else}
                    <span class="arrow same">→</span>
                {/if}
                <span class="delta">{deltaSign}{scoreDelta.delta}</span>
            </div>
            <div class="score-box new">
                <span class="label">After</span>
                <span class="value">{scoreDelta.new}</span>
            </div>
        </div>

        <div class="summary-stats">
            {#if diff.summary.total_fixed > 0}
                <span class="stat fixed">✅ {diff.summary.total_fixed} fixed</span>
            {/if}
            {#if diff.summary.total_still_present > 0}
                <span class="stat present">⚠️ {diff.summary.total_still_present} remaining</span>
            {/if}
            {#if diff.summary.total_new_issues > 0}
                <span class="stat new-issues">🆕 {diff.summary.total_new_issues} new</span>
            {/if}
        </div>
    </section>

    <!-- Category Score Breakdown -->
    <section class="category-scores">
        <h2>Category Breakdown</h2>
        <div class="score-grid">
            {#each [
                { label: 'Metadata', delta: diff.score_delta.metadata },
                { label: 'Screenshots', delta: diff.score_delta.screenshots },
                { label: 'Privacy', delta: diff.score_delta.privacy },
                { label: 'Info.plist', delta: diff.score_delta.plist },
                { label: 'URLs', delta: diff.score_delta.urls },
                { label: 'Content', delta: diff.score_delta.content },
            ] as cat}
                {#if cat.delta}
                    <div class="cat-score" class:cat-improved={cat.delta.delta > 0} class:cat-regressed={cat.delta.delta < 0}>
                        <span class="cat-label">{cat.label}</span>
                        <span class="cat-values">{cat.delta.old} → {cat.delta.new}</span>
                        <span class="cat-delta">
                            {cat.delta.delta >= 0 ? '+' : ''}{cat.delta.delta}
                        </span>
                    </div>
                {/if}
            {/each}
        </div>
    </section>

    <!-- Fixed Issues -->
    {#if diff.fixed.length > 0}
        <section class="diff-section fixed-section">
            <h2>✅ Fixed Issues ({diff.fixed.length})</h2>
            <div class="items-list">
                {#each diff.fixed as item}
                    <div class="diff-item fixed">
                        <span class="severity-dot" style="background: {severityColor(item.severity)}"></span>
                        <div class="item-content">
                            <span class="item-title">{item.title}</span>
                            <span class="item-status">Resolved</span>
                        </div>
                    </div>
                {/each}
            </div>
        </section>
    {/if}

    <!-- Still Present -->
    {#if diff.still_present.length > 0}
        <section class="diff-section present-section">
            <h2>⚠️ Still Present ({diff.still_present.length})</h2>
            <div class="items-list">
                {#each diff.still_present as item}
                    <div class="diff-item present">
                        <span class="severity-dot" style="background: {severityColor(item.severity)}"></span>
                        <div class="item-content">
                            <span class="item-title">{item.title}</span>
                            <span class="item-severity">{item.severity}</span>
                        </div>
                    </div>
                {/each}
            </div>
        </section>
    {/if}

    <!-- New Issues -->
    {#if diff.new_issues.length > 0}
        <section class="diff-section new-section">
            <h2>🆕 New Issues ({diff.new_issues.length})</h2>
            <div class="items-list">
                {#each diff.new_issues as item}
                    <div class="diff-item new-issue">
                        <span class="severity-dot" style="background: {severityColor(item.severity)}"></span>
                        <div class="item-content">
                            <span class="item-title">{item.title}</span>
                            <span class="item-desc">{item.description}</span>
                        </div>
                    </div>
                {/each}
            </div>
        </section>
    {/if}
</div>

<style>
    .comparison-page {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
        color: #e0e0e0;
        font-family: 'Inter', system-ui, sans-serif;
    }

    .comparison-header {
        margin-bottom: 2rem;
    }

    .back-link {
        color: #4da6ff;
        text-decoration: none;
        font-size: 0.9rem;
    }

    .back-link:hover {
        text-decoration: underline;
    }

    h1 {
        font-size: 1.5rem;
        margin: 0.5rem 0 0.25rem;
    }

    .subtitle {
        color: #888;
        font-size: 0.9rem;
    }

    /* Score Hero */
    .score-hero {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        margin-bottom: 2rem;
        border: 1px solid #2a2a4a;
    }

    .score-hero.improved {
        border-color: #2d5a2d;
    }

    .score-hero.regressed {
        border-color: #5a2d2d;
    }

    .score-comparison {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
        margin-bottom: 1.5rem;
    }

    .score-box {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .score-box .label {
        font-size: 0.8rem;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .score-box .value {
        font-size: 2.5rem;
        font-weight: 700;
    }

    .score-box.old .value {
        color: #888;
    }

    .score-box.new .value {
        color: #4da6ff;
    }

    .score-arrow {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .arrow {
        font-size: 1.5rem;
    }

    .arrow.up { color: #44cc44; }
    .arrow.down { color: #ff4444; }
    .arrow.same { color: #888; }

    .delta {
        font-size: 1rem;
        font-weight: 600;
    }

    .improved .delta { color: #44cc44; }
    .regressed .delta { color: #ff4444; }

    .summary-stats {
        display: flex;
        gap: 1.5rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .stat {
        font-size: 0.9rem;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.05);
    }

    /* Category Scores */
    .category-scores {
        margin-bottom: 2rem;
    }

    h2 {
        font-size: 1.1rem;
        margin-bottom: 1rem;
        color: #ccc;
    }

    .score-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.75rem;
    }

    .cat-score {
        background: #1a1a2e;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        border: 1px solid #2a2a4a;
    }

    .cat-label {
        font-size: 0.8rem;
        color: #888;
    }

    .cat-values {
        font-size: 0.9rem;
    }

    .cat-delta {
        font-size: 0.85rem;
        font-weight: 600;
    }

    .cat-improved .cat-delta { color: #44cc44; }
    .cat-regressed .cat-delta { color: #ff4444; }

    /* Diff Sections */
    .diff-section {
        margin-bottom: 2rem;
    }

    .items-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .diff-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        background: #1a1a2e;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        border: 1px solid #2a2a4a;
    }

    .diff-item.fixed {
        border-left: 3px solid #44cc44;
        opacity: 0.8;
    }

    .diff-item.present {
        border-left: 3px solid #ffaa00;
    }

    .diff-item.new-issue {
        border-left: 3px solid #ff4444;
    }

    .severity-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 0.4rem;
    }

    .item-content {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 0;
    }

    .item-title {
        font-size: 0.9rem;
    }

    .fixed .item-title {
        text-decoration: line-through;
        color: #888;
    }

    .item-status {
        font-size: 0.75rem;
        color: #44cc44;
    }

    .item-severity {
        font-size: 0.75rem;
        color: #888;
        text-transform: capitalize;
    }

    .item-desc {
        font-size: 0.8rem;
        color: #999;
        line-height: 1.4;
    }
</style>
