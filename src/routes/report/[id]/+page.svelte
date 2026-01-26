<script lang="ts">
    let { data } = $props();

    const { report, submission, items } = data;

    // Group items by category
    const grouped = $derived.by(() => {
        const groups: Record<string, typeof items> = {};
        for (const item of items) {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        }
        return groups;
    });

    function scoreColor(score: number | null): string {
        if (score === null) return 'var(--gray-500)';
        if (score >= 80) return '#22c55e';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    }

    function severityIcon(severity: string): string {
        switch (severity) {
            case 'critical': return '🔴';
            case 'warning': return '🟡';
            case 'info': return '🟢';
            default: return '✓';
        }
    }

    function categoryLabel(cat: string): string {
        const labels: Record<string, string> = {
            metadata: 'Metadata',
            screenshots: 'Screenshots',
            privacy_manifest: 'Privacy Manifest',
            info_plist: 'Info.plist',
            urls: 'URLs',
            content_policy: 'Content Policy',
            description: 'Description',
            metadata_quality: 'ASO Suggestions',
        };
        return labels[cat] || cat;
    }

    function categoryScore(cat: string): number | null {
        const scores: Record<string, number | null> = {
            metadata: report.score_metadata,
            screenshots: report.score_screenshots,
            privacy_manifest: report.score_privacy,
            info_plist: report.score_plist,
            urls: report.score_urls,
            content_policy: report.score_content,
            description: report.score_content,
            metadata_quality: null,
        };
        return scores[cat] ?? null;
    }
</script>

<main class="container report-page">
    <header class="report-header">
        <div>
            <h1>{submission.app_name}</h1>
            <p class="text-muted">
                {submission.review_type === 'full' ? 'Full' : 'Quick'} Review
                &middot; {new Date(submission.completed_at || submission.created_at).toLocaleDateString()}
            </p>
        </div>
        <a href="/dashboard" class="btn btn-secondary">Back to Dashboard</a>
    </header>

    <!-- Overall Score -->
    <section class="score-section">
        <div class="overall-score" style="--score-color: {scoreColor(report.score_overall)}">
            <div class="score-circle">
                <span class="score-number">{report.score_overall ?? '--'}</span>
                <span class="score-label">/ 100</span>
            </div>
        </div>
        <div class="score-summary">
            <p class="summary-text">{report.summary}</p>
            <div class="score-stats">
                {#if report.total_critical > 0}
                    <span class="stat stat-critical">🔴 {report.total_critical} Critical</span>
                {/if}
                {#if report.total_warnings > 0}
                    <span class="stat stat-warning">🟡 {report.total_warnings} Warnings</span>
                {/if}
                {#if report.total_info > 0}
                    <span class="stat stat-info">🟢 {report.total_info} Suggestions</span>
                {/if}
                {#if report.total_critical === 0 && report.total_warnings === 0}
                    <span class="stat stat-pass">✓ All checks passed</span>
                {/if}
            </div>
        </div>
    </section>

    <!-- Category Scores -->
    <section class="categories">
        <h2>Category Breakdown</h2>
        <div class="category-grid">
            {#each ['metadata', 'screenshots', 'privacy_manifest', 'info_plist', 'urls', 'content_policy'] as cat}
                {@const score = categoryScore(cat)}
                <div class="category-card card">
                    <div class="category-header">
                        <span class="category-name">{categoryLabel(cat)}</span>
                        <span class="category-score" style="color: {scoreColor(score)}">
                            {score ?? '--'}
                        </span>
                    </div>
                    <div class="category-bar">
                        <div class="category-fill" style="width: {score ?? 0}%; background: {scoreColor(score)}"></div>
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- Report Items -->
    <section class="items-section">
        <h2>Detailed Results</h2>
        {#each Object.entries(grouped) as [category, categoryItems]}
            <div class="category-group">
                <h3>{categoryLabel(category)}</h3>
                {#each categoryItems as item}
                    <details class="item-card card">
                        <summary class="item-summary">
                            <span class="item-severity">{severityIcon(item.severity)}</span>
                            <span class="item-title">{item.title}</span>
                            {#if item.guideline_ref}
                                <span class="item-ref">{item.guideline_ref}</span>
                            {/if}
                        </summary>
                        <div class="item-body">
                            <p>{item.description}</p>
                            {#if item.fix_suggestion}
                                <div class="fix-box">
                                    <strong>Fix:</strong> {item.fix_suggestion}
                                </div>
                            {/if}
                        </div>
                    </details>
                {/each}
            </div>
        {/each}

        {#if items.length === 0}
            <div class="card empty-state">
                <p>No issues found! Your app looks ready for submission.</p>
            </div>
        {/if}
    </section>

    <div class="report-footer">
        {#if report.total_critical > 0 || report.total_warnings > 0}
            <a href="/submit?resubmit={submission.id}" class="btn btn-accent btn-lg">
                🔄 Fix Issues & Re-Review (25 credits)
            </a>
        {/if}
        <a href="/submit" class="btn btn-secondary">Submit Another App</a>
    </div>
</main>

<style>
    .report-page {
        padding: 120px 24px 60px;
        max-width: 800px;
    }

    .report-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
    }

    .report-header h1 {
        font-size: 2rem;
        margin-bottom: 0.25rem;
    }

    .score-section {
        display: flex;
        gap: 2rem;
        align-items: center;
        margin-bottom: 3rem;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .overall-score {
        flex-shrink: 0;
    }

    .score-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 4px solid var(--score-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .score-number {
        font-family: 'Outfit', sans-serif;
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--score-color);
        line-height: 1;
    }

    .score-label {
        font-size: 0.75rem;
        color: var(--gray-500);
    }

    .score-summary {
        flex: 1;
    }

    .summary-text {
        font-size: 1.1rem;
        color: var(--gray-100);
        margin-bottom: 1rem;
        line-height: 1.5;
    }

    .score-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .stat {
        font-size: 0.85rem;
        font-weight: 500;
    }

    .categories {
        margin-bottom: 3rem;
    }

    .categories h2,
    .items-section h2 {
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--gray-500);
        margin-bottom: 1rem;
    }

    .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .category-card {
        padding: 1rem 1.25rem;
    }

    .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .category-name {
        font-size: 0.85rem;
        color: var(--gray-300);
    }

    .category-score {
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        font-size: 1.25rem;
    }

    .category-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 2px;
        overflow: hidden;
    }

    .category-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 0.6s var(--ease);
    }

    .category-group {
        margin-bottom: 2rem;
    }

    .category-group h3 {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--gray-300);
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .item-card {
        margin-bottom: 0.5rem;
        cursor: pointer;
    }

    .item-summary {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        list-style: none;
    }

    .item-summary::-webkit-details-marker {
        display: none;
    }

    .item-severity {
        font-size: 0.8rem;
        flex-shrink: 0;
    }

    .item-title {
        flex: 1;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .item-ref {
        font-size: 0.75rem;
        color: var(--gray-500);
        white-space: nowrap;
    }

    .item-body {
        padding: 0 1rem 1rem 2.75rem;
    }

    .item-body p {
        font-size: 0.85rem;
        color: var(--gray-300);
        line-height: 1.5;
        margin-bottom: 0.75rem;
    }

    .fix-box {
        font-size: 0.85rem;
        padding: 0.75rem 1rem;
        background: rgba(212, 168, 83, 0.08);
        border: 1px solid rgba(212, 168, 83, 0.15);
        border-radius: 8px;
        color: var(--gray-100);
    }

    .fix-box strong {
        color: var(--accent);
    }

    .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--gray-300);
    }

    .report-footer {
        text-align: center;
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
        display: flex;
        justify-content: center;
        gap: 1rem;
    }

    .btn-lg {
        padding: 1rem 2rem;
        font-size: 1.05rem;
    }

    .btn-accent {
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        color: var(--bg);
        font-weight: 600;
    }

    .btn-accent:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(212, 168, 83, 0.3);
    }

    @media (max-width: 600px) {
        .score-section {
            flex-direction: column;
            text-align: center;
        }

        .report-header {
            flex-direction: column;
            gap: 1rem;
        }
    }
</style>
