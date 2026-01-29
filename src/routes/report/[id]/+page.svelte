<script lang="ts">
    import { onMount } from "svelte";
    import { invalidateAll } from "$app/navigation";
    import MissionControl from "$lib/components/mission-control/MissionControl.svelte";
    import CockpitPanel from "$lib/components/CockpitPanel.svelte";
    import StatusLight from "$lib/components/StatusLight.svelte";
    import {
        SUBMISSION_TIMING,
        estimateReviewTime,
    } from "$lib/engine/knowledge-base/review-timeline";

    let { data } = $props();

    // Use derived state to track submission updates
    let submission = $derived(data.submission);
    let report = $derived(data.report);
    let items = $derived(data.items);

    // Polling for analyzing status
    onMount(() => {
        if (
            submission.status === "analyzing" ||
            submission.status === "queued"
        ) {
            const interval = setInterval(async () => {
                await invalidateAll(); // Reloads data
                if (submission.status === "complete") {
                    clearInterval(interval);
                }
            }, 3000);

            return () => clearInterval(interval);
        }
    });

    let showExportMenu = $state(false);
    let copySuccess = $state(false);

    // Get review time estimate
    let categoryId = $derived.by(() => {
        const categoryMap: Record<string, number> = {
            Finance: 6015,
            Games: 6014,
            "Health & Fitness": 6013,
            "Social Networking": 6005,
            Entertainment: 6016,
            Medical: 6020,
            "Photo & Video": 6008,
            Productivity: 6007,
            Education: 6017,
            Business: 6000,
            Utilities: 6002,
            Travel: 6003,
        };
        return categoryMap[submission.category || ""] || 6002; // Default to Utilities
    });

    let reviewTimeEstimate = $derived(
        estimateReviewTime({
            categoryId,
            isNewApp: submission.is_new_app ?? false,
            hasIAP: submission.has_iap ?? false,
            hasSubscription: submission.has_subscriptions ?? false,
            hasUGC: false,
            isNewDeveloper: false,
            submissionDay: new Date().getDay(),
        }),
    );

    let todayRecommendation = $derived(
        SUBMISSION_TIMING.find((d) => d.dayIndex === new Date().getDay()),
    );

    // Group items by category
    const grouped = $derived.by(() => {
        const groups: Record<string, typeof items> = {};
        for (const item of items) {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        }
        return groups;
    });

    // Separate by severity for the summary
    const criticalItems = $derived(
        items.filter((i) => i.severity === "critical"),
    );
    const warningItems = $derived(
        items.filter((i) => i.severity === "warning"),
    );
    const infoItems = $derived(items.filter((i) => i.severity === "info"));

    function scoreColor(
        score: number | null,
        hasCriticalIssues: boolean = false,
    ): string {
        if (score === null) return "var(--gray-500)";
        // Critical issues = red regardless of score
        if (hasCriticalIssues) return "#ef4444";
        if (score >= 80) return "#22c55e";
        if (score >= 50) return "#f59e0b";
        return "#ef4444";
    }

    function scoreEmoji(
        score: number | null,
        hasCriticalIssues: boolean = false,
    ): string {
        if (score === null) return "";
        // Critical issues = guaranteed rejection, never say "Looking good!"
        if (hasCriticalIssues) return "Not ready";
        if (score >= 80) return "Looking good!";
        if (score >= 50) return "Needs work";
        return "High risk";
    }

    function categoryLabel(cat: string): string {
        const labels: Record<string, string> = {
            metadata: "App Info",
            screenshots: "Screenshots",
            privacy_manifest: "Privacy Settings",
            info_plist: "App Configuration",
            urls: "Links & URLs",
            content_policy: "Content Guidelines",
            description: "App Description",
            metadata_quality: "Optimization Tips",
        };
        return labels[cat] || cat;
    }

    function categoryDescription(cat: string): string {
        const descriptions: Record<string, string> = {
            metadata: "Your app name, subtitle, and basic info",
            screenshots: "Preview images shown in the App Store",
            privacy_manifest: "How your app handles user data",
            info_plist: "Technical settings in your Xcode project",
            urls: "Privacy policy, support, and marketing links",
            content_policy: "Age ratings and content appropriateness",
            description: "Your app store description text",
            metadata_quality: "Tips to improve App Store visibility",
        };
        return descriptions[cat] || "";
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

    function categoryStatus(cat: string, score: number | null): string {
        if (score === null) return 'Pending';
        const catItems = items.filter(i => i.category === cat);
        const hasCritical = catItems.some(i => i.severity === 'critical');
        const hasWarning = catItems.some(i => i.severity === 'warning');
        if (hasCritical) return 'Critical';
        if (hasWarning) return 'Needs Review';
        if (score >= 80) return 'Optimal';
        return 'Advisory';
    }

    function friendlySeverity(severity: string): {
        icon: string;
        label: string;
        class: string;
    } {
        switch (severity) {
            case "critical":
                return {
                    icon: "!",
                    label: "Must Fix",
                    class: "severity-critical",
                };
            case "warning":
                return {
                    icon: "!",
                    label: "Should Fix",
                    class: "severity-warning",
                };
            case "info":
                return {
                    icon: "i",
                    label: "Suggestion",
                    class: "severity-info",
                };
            default:
                return { icon: "✓", label: "Passed", class: "severity-pass" };
        }
    }

    // Generate technical Markdown export for LLMs
    function generateMarkdownExport(): string {
        const lines: string[] = [];

        lines.push(`# App Store Review Report: ${submission.app_name}`);
        lines.push("");
        lines.push(
            "> This is a technical report for AI assistants. Use this to understand and fix App Store submission issues.",
        );
        lines.push("");

        // App metadata section
        lines.push("## App Metadata");
        lines.push("");
        lines.push(`- **App Name:** ${submission.app_name}`);
        if (submission.subtitle)
            lines.push(`- **Subtitle:** ${submission.subtitle}`);
        if (submission.category)
            lines.push(`- **Category:** ${submission.category}`);
        if (submission.age_rating)
            lines.push(`- **Age Rating:** ${submission.age_rating}`);
        if (submission.keywords)
            lines.push(`- **Keywords:** ${submission.keywords}`);
        if (submission.privacy_url)
            lines.push(`- **Privacy Policy URL:** ${submission.privacy_url}`);
        if (submission.support_url)
            lines.push(`- **Support URL:** ${submission.support_url}`);
        if (submission.marketing_url)
            lines.push(`- **Marketing URL:** ${submission.marketing_url}`);
        lines.push("");

        // Description
        if (submission.description) {
            lines.push("### App Description");
            lines.push("```");
            lines.push(submission.description);
            lines.push("```");
            lines.push("");
        }

        // Files uploaded
        lines.push("## Files Analyzed");
        lines.push("");
        lines.push(
            `- **Info.plist:** ${submission.plist_path ? "Uploaded" : "Not provided"}`,
        );
        lines.push(
            `- **PrivacyInfo.xcprivacy:** ${submission.manifest_path ? "Uploaded" : "Not provided"}`,
        );
        lines.push(
            `- **Screenshots:** ${submission.screenshot_paths?.length || 0} uploaded`,
        );
        lines.push("");

        // Scores
        lines.push("## Scores");
        lines.push("");
        lines.push(`- **Overall Score:** ${report.score_overall}/100`);
        lines.push(`- **Metadata:** ${report.score_metadata}/100`);
        lines.push(`- **Screenshots:** ${report.score_screenshots}/100`);
        lines.push(`- **Privacy:** ${report.score_privacy}/100`);
        lines.push(`- **Info.plist:** ${report.score_plist}/100`);
        lines.push(`- **URLs:** ${report.score_urls}/100`);
        lines.push(`- **Content:** ${report.score_content}/100`);
        lines.push("");

        // Critical issues
        if (criticalItems.length > 0) {
            lines.push("## CRITICAL ISSUES (Will Cause Rejection)");
            lines.push("");
            for (const item of criticalItems) {
                lines.push(`### ${item.title}`);
                lines.push("");
                lines.push(`**Category:** ${categoryLabel(item.category)}`);
                if (item.guideline_ref)
                    lines.push(`**Apple Guideline:** ${item.guideline_ref}`);
                lines.push("");
                lines.push(`**Problem:** ${item.description}`);
                lines.push("");
                if (item.fix_suggestion) {
                    lines.push(`**How to Fix:** ${item.fix_suggestion}`);
                    lines.push("");
                }
            }
        }

        // Warnings
        if (warningItems.length > 0) {
            lines.push("## WARNINGS (May Cause Rejection)");
            lines.push("");
            for (const item of warningItems) {
                lines.push(`### ${item.title}`);
                lines.push("");
                lines.push(`**Category:** ${categoryLabel(item.category)}`);
                if (item.guideline_ref)
                    lines.push(`**Apple Guideline:** ${item.guideline_ref}`);
                lines.push("");
                lines.push(`**Problem:** ${item.description}`);
                lines.push("");
                if (item.fix_suggestion) {
                    lines.push(`**How to Fix:** ${item.fix_suggestion}`);
                    lines.push("");
                }
            }
        }

        // Info/suggestions
        if (infoItems.length > 0) {
            lines.push("## SUGGESTIONS (Recommended Improvements)");
            lines.push("");
            for (const item of infoItems) {
                lines.push(`### ${item.title}`);
                lines.push("");
                lines.push(`**Category:** ${categoryLabel(item.category)}`);
                lines.push("");
                lines.push(item.description);
                lines.push("");
                if (item.fix_suggestion) {
                    lines.push(`**Suggestion:** ${item.fix_suggestion}`);
                    lines.push("");
                }
            }
        }

        // Requirements reference
        lines.push("## Apple App Store Requirements Reference");
        lines.push("");
        lines.push("### Metadata Requirements");
        lines.push("- App name: 30 characters max");
        lines.push("- Subtitle: 30 characters max");
        lines.push("- Description: 4000 characters max (100+ recommended)");
        lines.push("- Keywords: 100 characters max, comma-separated");
        lines.push("- What's New: 4000 characters max");
        lines.push("");
        lines.push("### Screenshot Requirements");
        lines.push("- Minimum 1 screenshot required");
        lines.push('- iPhone 6.7": 1290 x 2796 or 1284 x 2778 pixels');
        lines.push('- iPhone 6.5": 1242 x 2688 or 1284 x 2778 pixels');
        lines.push('- iPad Pro 12.9": 2048 x 2732 pixels');
        lines.push("- Format: PNG or JPEG, sRGB color space");
        lines.push("");
        lines.push("### Privacy Manifest (PrivacyInfo.xcprivacy)");
        lines.push(
            "- Required if using: UserDefaults, FileTimestamp, SystemBoot, DiskSpace APIs",
        );
        lines.push("- Must declare tracking status and domains");
        lines.push("- Must list collected data types");
        lines.push("");

        lines.push("---");
        lines.push(
            `Generated by PreFlight on ${new Date().toISOString().split("T")[0]}`,
        );

        return lines.join("\n");
    }

    // Generate JSON export
    function generateJSONExport(): string {
        return JSON.stringify(
            {
                generated_at: new Date().toISOString(),
                app: {
                    name: submission.app_name,
                    subtitle: submission.subtitle,
                    description: submission.description,
                    keywords: submission.keywords,
                    category: submission.category,
                    age_rating: submission.age_rating,
                    privacy_url: submission.privacy_url,
                    support_url: submission.support_url,
                    marketing_url: submission.marketing_url,
                },
                files: {
                    info_plist: submission.plist_path ? "uploaded" : null,
                    privacy_manifest: submission.manifest_path
                        ? "uploaded"
                        : null,
                    screenshots_count: submission.screenshot_paths?.length || 0,
                },
                scores: {
                    overall: report.score_overall,
                    metadata: report.score_metadata,
                    screenshots: report.score_screenshots,
                    privacy: report.score_privacy,
                    info_plist: report.score_plist,
                    urls: report.score_urls,
                    content: report.score_content,
                },
                issues: {
                    critical: criticalItems.map((i) => ({
                        title: i.title,
                        category: i.category,
                        description: i.description,
                        guideline_ref: i.guideline_ref,
                        fix_suggestion: i.fix_suggestion,
                    })),
                    warnings: warningItems.map((i) => ({
                        title: i.title,
                        category: i.category,
                        description: i.description,
                        guideline_ref: i.guideline_ref,
                        fix_suggestion: i.fix_suggestion,
                    })),
                    suggestions: infoItems.map((i) => ({
                        title: i.title,
                        category: i.category,
                        description: i.description,
                        fix_suggestion: i.fix_suggestion,
                    })),
                },
            },
            null,
            2,
        );
    }

    async function copyToClipboard() {
        const markdown = generateMarkdownExport();
        await navigator.clipboard.writeText(markdown);
        copySuccess = true;
        showExportMenu = false;
        setTimeout(() => (copySuccess = false), 2000);
    }

    // Track which fix tip was just copied
    let copiedFixId: string | null = $state(null);

    async function copyFixSuggestion(text: string, itemId: string) {
        await navigator.clipboard.writeText(text);
        copiedFixId = itemId;
        setTimeout(() => (copiedFixId = null), 2000);
    }

    // Confidence badge display — severity-aware so colors match context
    function confidenceBadge(confidence: number | null | undefined, severity?: string): { label: string; class: string } | null {
        if (confidence == null) return null;
        const level = confidence >= 80 ? 'High' : confidence >= 50 ? 'Medium' : 'Low';
        const cls = severity === 'critical' ? 'confidence-on-critical'
            : severity === 'warning' ? 'confidence-on-warning'
            : 'confidence-neutral';
        return { label: level, class: cls };
    }

    // User feedback state
    let feedbackState: Record<string, 'helpful' | 'false_positive'> = $state({});
    let feedbackLoading: Record<string, boolean> = $state({});

    async function submitFeedback(itemId: string, feedback: 'helpful' | 'false_positive') {
        // Toggle off if already set to same value
        if (feedbackState[itemId] === feedback) {
            feedbackState[itemId] = undefined as any;
            return;
        }

        feedbackLoading[itemId] = true;
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: itemId, feedback }),
            });
            if (res.ok) {
                feedbackState[itemId] = feedback;
            }
        } catch (e) {
            console.error('Failed to submit feedback:', e);
        } finally {
            feedbackLoading[itemId] = false;
        }
    }

    function downloadMarkdown() {
        const markdown = generateMarkdownExport();
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${submission.app_name.replace(/\s+/g, "_")}_preflight_report.md`;
        a.click();
        URL.revokeObjectURL(url);
        showExportMenu = false;
    }

    function downloadJSON() {
        const json = generateJSONExport();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${submission.app_name.replace(/\s+/g, "_")}_preflight_report.json`;
        a.click();
        URL.revokeObjectURL(url);
        showExportMenu = false;
    }
</script>

<main class="container report-page">
    <header class="report-header">
        <div class="report-header-info">
            {#if submission.app_icon_url}
                <img class="report-app-icon" src={submission.app_icon_url} alt="{submission.app_name} icon" />
            {:else}
                <div class="report-app-icon report-app-icon-fallback">
                    {submission.app_name.charAt(0).toUpperCase()}
                </div>
            {/if}
            <div>
                <h1>{submission.app_name}</h1>
                <p class="text-muted">
                    {submission.review_type === "full"
                        ? "Full Review"
                        : "Quick Check"}
                    &middot; {new Date(
                        submission.completed_at || submission.created_at,
                    ).toLocaleDateString()}
                </p>
            </div>
        </div>
        <div class="header-actions">
            <div class="export-wrapper">
                <button
                    class="btn btn-secondary export-btn"
                    onclick={() => (showExportMenu = !showExportMenu)}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M8 2v8M8 10l-3-3M8 10l3-3M3 14h10"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                    </svg>
                    Export for AI
                </button>
                {#if showExportMenu}
                    <div class="export-menu">
                        <button onclick={copyToClipboard}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                            >
                                <rect
                                    x="4"
                                    y="4"
                                    width="8"
                                    height="8"
                                    rx="1.5"
                                    stroke="currentColor"
                                    stroke-width="1.2"
                                />
                                <path
                                    d="M10 4V2.5A1.5 1.5 0 008.5 1H2.5A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4"
                                    stroke="currentColor"
                                    stroke-width="1.2"
                                />
                            </svg>
                            Copy to Clipboard
                        </button>
                        <button onclick={downloadMarkdown}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                            >
                                <path
                                    d="M7 1v9M7 10L4 7M7 10l3-3M2 13h10"
                                    stroke="currentColor"
                                    stroke-width="1.2"
                                    stroke-linecap="round"
                                />
                            </svg>
                            Download .md
                        </button>
                        <button onclick={downloadJSON}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                            >
                                <path
                                    d="M7 1v9M7 10L4 7M7 10l3-3M2 13h10"
                                    stroke="currentColor"
                                    stroke-width="1.2"
                                    stroke-linecap="round"
                                />
                            </svg>
                            Download .json
                        </button>
                    </div>
                {/if}
            </div>
            <a href="/dashboard" class="btn btn-secondary">Dashboard</a>
        </div>
    </header>

    {#if submission.status === "analyzing" || submission.status === "queued"}
        <MissionControl appName={submission.app_name} />
    {:else}
        {#if copySuccess}
            <div class="toast">
                Copied to clipboard! Paste into your AI assistant.
            </div>
        {/if}

        <!-- Progress Summary Banner -->
        {@const passingCategories = [
            report.score_metadata,
            report.score_screenshots,
            report.score_privacy,
            report.score_plist,
            report.score_urls,
            report.score_content
        ].filter(s => s !== null && s >= 80).length}
        {@const totalCategories = 6}

        {#if criticalItems.length > 0}
            <div class="status-banner critical">
                <div class="banner-content">
                    <strong>{criticalItems.length} critical issue{criticalItems.length === 1 ? '' : 's'} found</strong>
                    <p>Your app will be rejected. Fix {criticalItems.length === 1 ? 'this issue' : 'these issues'} before submitting{warningItems.length > 0 ? ` · ${warningItems.length} warning${warningItems.length === 1 ? '' : 's'} also found` : ''}.</p>
                </div>
            </div>
        {:else if warningItems.length > 0}
            <div class="status-banner">
                <div class="banner-content">
                    <strong>No blocking issues</strong>
                    <p>{passingCategories}/{totalCategories} categories optimal · {warningItems.length} warning{warningItems.length === 1 ? '' : 's'} to review.</p>
                </div>
            </div>
        {:else}
            <div class="status-banner clear">
                <div class="banner-content">
                    <strong>No issues detected</strong>
                    <p>{passingCategories}/{totalCategories} categories optimal · Ready for submission.</p>
                </div>
            </div>
        {/if}

        <section class="score-section">
            <CockpitPanel class="high-level-score" variant="elevated">
                <div class="hud-main-panel">
                    <!-- Gauge Section -->
                    <div class="hud-gauge-group">
                        <div
                            class="hud-gauge"
                            style="--score-color: {scoreColor(
                                report.score_overall,
                                criticalItems.length > 0,
                            )}"
                        >
                            <svg viewBox="0 0 100 100">
                                <circle class="track" cx="50" cy="50" r="45" />
                                <circle
                                    class="fill"
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    style="stroke-dasharray: {2 *
                                        Math.PI *
                                        45 *
                                        (report.score_overall / 100)}, 1000"
                                />
                            </svg>
                            <div class="gauge-value">
                                <span class="value"
                                    >{report.score_overall ?? "--"}</span
                                >
                                <span class="label">Score</span>
                            </div>
                        </div>
                    </div>

                    <!-- Core Info Section -->
                    <div class="hud-info-group">
                        <div class="hud-meta-tags">
                            <span class="hud-tag"
                                >ID: {submission.id.slice(0, 8).toUpperCase()}</span
                            >
                            <span class="hud-tag"
                                >{submission.review_type === "full" ? "Full Review" : "Quick Check"}</span
                            >
                        </div>
                        <div
                            class="hud-status-box"
                            style="--status-color: {scoreColor(
                                report.score_overall,
                                criticalItems.length > 0,
                            )}"
                        >
                            <div class="status-label">Status</div>
                            <div class="hud-verdict">
                                {scoreEmoji(
                                    report.score_overall,
                                    criticalItems.length > 0,
                                )}
                            </div>
                            <div
                                class="hud-alert-msg {criticalItems.length > 0
                                    ? 'critical'
                                    : warningItems.length > 0 && (report.score_overall ?? 0) < 80
                                      ? 'warning'
                                      : 'safe'}"
                            >
                                {#if criticalItems.length > 0}
                                    <span class="msg">Issues Found</span>
                                {:else if warningItems.length > 0 && (report.score_overall ?? 0) < 80}
                                    <span class="msg">Needs Attention</span>
                                {:else}
                                    <span class="msg">All Clear</span>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <!-- Diagnostic Matrix Section -->
                    <div class="hud-diagnostic-matrix">
                        <div
                            class="stat-readout {report.total_critical > 0
                                ? 'critical'
                                : 'dim'}"
                        >
                            <div class="readout-header">
                                <span class="readout-label">Critical</span>
                                <StatusLight
                                    status={report.total_critical > 0
                                        ? "critical"
                                        : "neutral"}
                                    size="sm"
                                    pulse={report.total_critical > 0}
                                />
                            </div>
                            <span class="readout-value"
                                >{report.total_critical}</span
                            >
                        </div>
                        <div
                            class="stat-readout {report.total_warnings > 0
                                ? 'warning'
                                : 'dim'}"
                        >
                            <div class="readout-header">
                                <span class="readout-label">Warnings</span>
                                <StatusLight
                                    status={report.total_warnings > 0
                                        ? "warning"
                                        : "neutral"}
                                    size="sm"
                                />
                            </div>
                            <span class="readout-value"
                                >{report.total_warnings}</span
                            >
                        </div>
                        <div
                            class="stat-readout {report.total_info > 0
                                ? 'info'
                                : 'dim'}"
                        >
                            <div class="readout-header">
                                <span class="readout-label">Tips</span>
                                <StatusLight
                                    status={report.total_info > 0
                                        ? "info"
                                        : "neutral"}
                                    size="sm"
                                />
                            </div>
                            <span class="readout-value"
                                >{report.total_info}</span
                            >
                        </div>
                    </div>

                </div>
            </CockpitPanel>
        </section>

        <!-- What You Need to Do (simplified action items) -->
        {#if criticalItems.length > 0 || warningItems.length > 0}
            <section class="action-section">
                <div class="section-label">Issues to Address</div>

                {#if criticalItems.length > 0}
                    <div class="action-group">
                        <div class="group-header critical">
                            <StatusLight status="critical" size="sm" pulse />
                            <div class="header-text">
                                <h3>Critical Issues</h3>
                                <div class="sub-label">
                                    These will cause rejection
                                </div>
                            </div>
                        </div>
                        {#each criticalItems as item}
                            <CockpitPanel class="action-item critical-item">
                                <div class="action-content">
                                    <div class="item-meta-row">
                                        <span class="item-meta">{categoryLabel(item.category)}</span>
                                        {#if confidenceBadge(item.confidence, item.severity)}
                                            {@const badge = confidenceBadge(item.confidence, item.severity)}
                                            <span class="confidence-badge {badge?.class}">{badge?.label}</span>
                                        {/if}
                                    </div>
                                    <strong>{item.title}</strong>
                                    <p>{item.description}</p>
                                    {#if item.fix_suggestion}
                                        <div class="fix-tip">
                                            <div class="tip-header">
                                                <span class="tip-label">How to Fix</span>
                                                <button
                                                    class="copy-fix-btn"
                                                    class:copied={copiedFixId === item.id}
                                                    onclick={() => copyFixSuggestion(item.fix_suggestion, item.id)}
                                                >
                                                    {copiedFixId === item.id ? '✓ Copied' : 'Copy'}
                                                </button>
                                            </div>
                                            <div class="tip-body">
                                                {item.fix_suggestion}
                                            </div>
                                        </div>
                                    {/if}
                                    <div class="feedback-row">
                                        <span class="feedback-label">Was this helpful?</span>
                                        <button
                                            class="feedback-btn"
                                            class:active={feedbackState[item.id] === 'helpful'}
                                            disabled={feedbackLoading[item.id]}
                                            onclick={() => submitFeedback(item.id, 'helpful')}
                                            title="This finding is helpful"
                                        >&#x1F44D;</button>
                                        <button
                                            class="feedback-btn"
                                            class:active={feedbackState[item.id] === 'false_positive'}
                                            disabled={feedbackLoading[item.id]}
                                            onclick={() => submitFeedback(item.id, 'false_positive')}
                                            title="This is a false positive"
                                        >&#x1F44E;</button>
                                    </div>
                                </div>
                            </CockpitPanel>
                        {/each}
                    </div>
                {/if}

                {#if warningItems.length > 0}
                    <div class="action-group">
                        <div class="group-header warning">
                            <StatusLight status="warning" size="sm" />
                            <div class="header-text">
                                <h3>Warnings</h3>
                                <div class="sub-label">
                                    May cause issues during review
                                </div>
                            </div>
                        </div>
                        {#each warningItems as item}
                            <CockpitPanel class="action-item warning-item">
                                <div class="action-content">
                                    <div class="item-meta-row">
                                        <span class="item-meta">{categoryLabel(item.category)}</span>
                                        {#if confidenceBadge(item.confidence, item.severity)}
                                            {@const badge = confidenceBadge(item.confidence, item.severity)}
                                            <span class="confidence-badge {badge?.class}">{badge?.label}</span>
                                        {/if}
                                    </div>
                                    <strong>{item.title}</strong>
                                    <p>{item.description}</p>
                                    {#if item.fix_suggestion}
                                        <div class="fix-tip">
                                            <div class="tip-header">
                                                <span class="tip-label">How to Fix</span>
                                                <button
                                                    class="copy-fix-btn"
                                                    class:copied={copiedFixId === item.id}
                                                    onclick={() => copyFixSuggestion(item.fix_suggestion, item.id)}
                                                >
                                                    {copiedFixId === item.id ? '✓ Copied' : 'Copy'}
                                                </button>
                                            </div>
                                            <div class="tip-body">
                                                {item.fix_suggestion}
                                            </div>
                                        </div>
                                    {/if}
                                    <div class="feedback-row">
                                        <span class="feedback-label">Was this helpful?</span>
                                        <button
                                            class="feedback-btn"
                                            class:active={feedbackState[item.id] === 'helpful'}
                                            disabled={feedbackLoading[item.id]}
                                            onclick={() => submitFeedback(item.id, 'helpful')}
                                            title="This finding is helpful"
                                        >&#x1F44D;</button>
                                        <button
                                            class="feedback-btn"
                                            class:active={feedbackState[item.id] === 'false_positive'}
                                            disabled={feedbackLoading[item.id]}
                                            onclick={() => submitFeedback(item.id, 'false_positive')}
                                            title="This is a false positive"
                                        >&#x1F44E;</button>
                                    </div>
                                </div>
                            </CockpitPanel>
                        {/each}
                    </div>
                {/if}
            </section>
        {/if}

        <!-- Category Scores -->
        <section class="performance-matrix">
            <div class="section-label">Category Scores</div>
            <div class="matrix-grid">
                {#each ["metadata", "screenshots", "privacy_manifest", "info_plist", "urls", "content_policy"] as cat, i}
                    {@const score = categoryScore(cat)}
                    <CockpitPanel class="matrix-cell">
                        <div class="matrix-header">
                            <div class="matrix-label">
                                {categoryLabel(cat)}
                            </div>
                            <StatusLight
                                status={score === null
                                    ? "neutral"
                                    : score >= 80
                                      ? "ready"
                                      : score >= 50
                                        ? "warning"
                                        : "critical"}
                                size="sm"
                            />
                        </div>
                        <div class="matrix-meter">
                            <div
                                class="matrix-bar"
                                style="width: {score ??
                                    0}%; background: {scoreColor(score)}"
                            ></div>
                        </div>
                        <div class="matrix-footer">
                            <span class="matrix-val">{score ?? "--"}%</span>
                            <span class="matrix-status">{categoryStatus(cat, score)}</span>
                        </div>
                    </CockpitPanel>
                {/each}
            </div>
        </section>

        <!-- Suggestions (non-blocking) -->
        {#if infoItems.length > 0}
            <section class="suggestions-section">
                <div class="section-label">Suggestions</div>
                <div class="suggestions-list">
                    {#each infoItems as item, i}
                        <CockpitPanel class="suggestion-card">
                            <div class="suggestion-header">
                                <span class="suggestion-title"
                                    >{item.title}</span
                                >
                                {#if confidenceBadge(item.confidence, item.severity)}
                                    {@const badge = confidenceBadge(item.confidence, item.severity)}
                                    <span class="confidence-badge {badge?.class}">{badge?.label}</span>
                                {/if}
                                <span class="suggestion-category"
                                    >{categoryLabel(item.category)}</span
                                >
                            </div>
                            <div class="suggestion-body">
                                <p>{item.description}</p>
                            </div>
                        </CockpitPanel>
                    {/each}
                </div>
            </section>
        {/if}

        <!-- All Good State -->
        {#if items.length === 0}
            <section class="success-section">
                <div class="section-label">All Clear</div>
                <div class="success-icon">
                    <p>
                        No issues found. Your app appears ready for App Store
                        submission.
                    </p>
                </div>
            </section>
        {/if}

        <!-- Next Action -->
        <section class="next-action-section">
            <div class="section-label">Next</div>
            <div class="next-action">
                {#if criticalItems.length > 0}
                    <StatusLight status="critical" size="sm" pulse />
                    <span>Fix {criticalItems.length} critical issue{criticalItems.length > 1 ? 's' : ''}, then run another check.</span>
                {:else if warningItems.length > 0}
                    <StatusLight status="ready" size="sm" />
                    <span>Ready to submit. Review {warningItems.length} warning{warningItems.length > 1 ? 's' : ''} to improve approval chances.</span>
                {:else}
                    <StatusLight status="ready" size="sm" />
                    <span>Ready to submit to App Store Connect.</span>
                {/if}
            </div>
            {#if criticalItems.length > 0 || warningItems.length > 0}
                <a
                    href="/submit?resubmit={submission.id}"
                    class="retest-button"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    Retest (25 Credits)
                </a>
            {/if}
        </section>

        <!-- Review Timeline -->
        <section class="timeline-section">
            <div class="section-label">Review Timeline</div>
            <CockpitPanel class="timeline-panel">
                <div class="timeline-content">
                    <div class="timeline-estimate">
                        <span class="estimate-range"
                            >{reviewTimeEstimate.minHours}<span class="unit">H</span>
                            - {reviewTimeEstimate.maxHours}<span class="unit">H</span></span
                        >
                        <span class="estimate-label">Estimated review time</span>
                        <span class="estimate-caveat">Based on category and common factors</span>
                    </div>
                    {#if reviewTimeEstimate.factors.length > 0}
                        <div class="timeline-factors">
                            <ul>
                                {#each reviewTimeEstimate.factors as factor}
                                    <li>{factor}</li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
                    {#if todayRecommendation}
                        <div class="today-rec">
                            <span class="rec-day">{todayRecommendation.day}</span>
                            <span class="rec-note">{todayRecommendation.notes}</span>
                        </div>
                    {/if}
                    <p class="timeline-disclaimer">
                        Estimates based on community-reported data. Preflight is not affiliated with Apple.
                        Actual review times vary and are not guaranteed.
                    </p>
                </div>
            </CockpitPanel>
        </section>

        <div class="report-footer">
            <div class="footer-actions">
                <a href="/submit" class="btn btn-secondary">New Review</a>
            </div>
            <p class="footer-hint">
                Need help fixing these issues? Click "Export for AI" above and
                paste into your LLM of choice.
            </p>
            <p class="legal-disclaimer">
                Preflight simulates Apple's review process based on publicly available guidelines.
                This is not an official Apple service. Results are informational only and do not guarantee
                approval or rejection. Use at your own discretion.
            </p>
        </div>
    {/if}
</main>

<style>
    .report-page {
        padding: 100px 24px 60px;
        max-width: 800px;
    }

    .report-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        gap: 1rem;
    }

    .report-header-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .report-app-icon {
        width: 64px;
        height: 64px;
        border-radius: 14px;
        flex-shrink: 0;
        object-fit: cover;
    }

    .report-app-icon-fallback {
        background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
        color: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: 800;
    }

    .report-header h1 {
        font-size: 2rem;
        margin-bottom: 0.25rem;
    }

    .header-actions {
        display: flex;
        gap: 0.75rem;
        flex-shrink: 0;
    }

    .export-wrapper {
        position: relative;
    }

    .export-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .export-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.5rem;
        background: var(--surface-2);
        border: 1px solid var(--border-default);
        border-radius: 8px;
        padding: 0.5rem;
        min-width: 180px;
        z-index: 100;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .export-menu button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.625rem 0.75rem;
        background: none;
        border: none;
        color: var(--fg);
        font-size: 0.85rem;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.15s;
    }

    .export-menu button:hover {
        background: rgba(255, 255, 255, 0.06);
    }

    .toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent);
        color: var(--bg);
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        font-size: 0.9rem;
        z-index: 1000;
        animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    .score-section {
        margin-bottom: 40px;
    }

    /* --- REFINED HUD STYLES --- */
    .score-section :global(.high-level-score) {
        position: relative;
        padding: 0 !important;
        overflow: visible;
    }

    .hud-main-panel {
        display: flex;
        align-items: stretch;
        min-height: 200px;
    }

    .hud-gauge-group {
        padding: 24px;
        display: flex;
        align-items: center;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }

    .hud-gauge {
        position: relative;
        width: 120px;
        height: 120px;
    }

    .hud-gauge svg {
        transform: rotate(-90deg);
        filter: drop-shadow(0 0 10px var(--score-color));
    }

    .hud-gauge .track {
        fill: none;
        stroke: rgba(255, 255, 255, 0.03);
        stroke-width: 6;
    }

    .hud-gauge .fill {
        fill: none;
        stroke: var(--score-color);
        stroke-width: 6;
        stroke-linecap: square;
        transition: stroke-dasharray 1s ease-out;
    }

    .gauge-value {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .gauge-value .value {
        font-family: "Instrument Mono", monospace;
        font-size: 2.5rem;
        font-weight: 700;
        letter-spacing: -0.05em;
        line-height: 1;
    }

    .gauge-value .label {
        font-family: "Instrument Mono", monospace;
        font-size: 0.55rem;
        font-weight: 800;
        color: var(--gray-500);
        margin-top: 4px;
    }

    .hud-info-group {
        flex: 1;
        padding: 24px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 16px;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }

    .hud-meta-tags {
        display: flex;
        gap: 12px;
    }

    .hud-tag {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        color: var(--gray-500);
        background: rgba(255, 255, 255, 0.03);
        padding: 2px 6px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .hud-status-box {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .status-label {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--gray-600);
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .hud-verdict {
        font-family: "Instrument Mono", monospace;
        font-size: 1.8rem;
        font-weight: 800;
        color: var(--status-color);
        letter-spacing: -0.025em;
        line-height: 1;
    }

    .hud-alert-msg {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: "Instrument Mono", monospace;
        font-size: 0.75rem;
        font-weight: 700;
        margin-top: 4px;
    }

    .hud-alert-msg .msg {
        padding: 2px 8px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .hud-alert-msg.critical .msg {
        color: hsl(0, 85%, 65%);
        background: hsla(0, 85%, 65%, 0.1);
        border-color: hsla(0, 85%, 65%, 0.2);
    }
    .hud-alert-msg.warning .msg {
        color: hsl(38, 95%, 60%);
        background: hsla(38, 95%, 60%, 0.1);
        border-color: hsla(38, 95%, 60%, 0.2);
    }
    .hud-alert-msg.safe .msg {
        color: hsl(145, 80%, 50%);
        background: hsla(145, 80%, 50%, 0.1);
        border-color: hsla(145, 80%, 50%, 0.2);
    }

    .hud-diagnostic-matrix {
        width: 180px;
        display: grid;
        grid-template-rows: repeat(3, 1fr);
        gap: 0;
    }

    .stat-readout {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .stat-readout:last-child {
        border-bottom: none;
    }

    .readout-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
    }

    .readout-label {
        font-family: "Instrument Mono", monospace;
        font-size: 0.55rem;
        font-weight: 800;
        color: var(--gray-600);
        letter-spacing: 0.1em;
    }

    .readout-value {
        font-family: "Instrument Mono", monospace;
        font-size: 1.25rem;
        font-weight: 700;
        line-height: 1;
    }

    .stat-readout.critical .readout-value {
        color: hsl(0, 85%, 65%);
    }
    .stat-readout.warning .readout-value {
        color: hsl(38, 95%, 60%);
    }
    .stat-readout.info .readout-value {
        color: hsl(200, 90%, 65%);
    }
    .stat-readout.dim {
        opacity: 0.3;
        filter: grayscale(1);
    }

    /* --- PERFORMANCE MATRIX --- */
    .performance-matrix {
        margin-bottom: 64px;
    }

    .matrix-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 12px;
    }

    .matrix-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
    }

    .matrix-label {
        font-family: "Outfit", sans-serif;
        font-size: 0.85rem;
        font-weight: 600;
        flex: 1;
        color: var(--gray-300);
    }

    .matrix-cell {
        padding: 16px 20px !important;
    }

    .matrix-meter {
        height: 2px;
        background: rgba(255, 255, 255, 0.03);
        margin-bottom: 12px;
        overflow: hidden;
    }

    .matrix-bar {
        height: 100%;
        transition: width 1s ease-out;
    }

    .matrix-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    /* --- SUGGESTIONS LIST --- */
    .suggestions-section {
        margin-bottom: 64px;
    }

    .suggestions-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .suggestion-card {
        background: rgba(10, 10, 14, 0.3) !important;
        border: 1px solid rgba(255, 255, 255, 0.03) !important;
        border-radius: 4px;
        overflow: hidden;
    }

    .suggestion-summary {
        padding: 16px 24px;
        display: flex;
        align-items: center;
        gap: 16px;
        cursor: pointer;
        list-style: none;
    }

    .suggestion-summary::-webkit-details-marker {
        display: none;
    }

    .suggestion-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(200, 200, 255, 0.05);
        color: hsl(200, 90%, 60%);
        border: 1px solid hsla(200, 90%, 60%, 0.2);
        border-radius: 50%;
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 800;
    }

    .suggestion-title {
        flex: 1;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--gray-300);
    }

    .suggestion-category {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--gray-600);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .suggestion-body {
        padding: 0 24px 20px 56px;
        font-size: 0.9rem;
        color: var(--gray-400);
        line-height: 1.5;
    }

    .action-group {
        margin-bottom: 40px;
    }

    .group-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
    }

    .header-text h3 {
        font-family: "Outfit", sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
    }

    .header-text .sub-label {
        font-size: 0.8rem;
        font-weight: 400;
        color: var(--gray-500);
        margin-top: 2px;
    }

    .group-header.critical h3 {
        color: hsl(0, 85%, 65%);
    }
    .group-header.warning h3 {
        color: hsl(38, 95%, 60%);
    }

    .action-item {
        margin-bottom: 12px;
    }

    .item-meta {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--gray-600);
        margin-bottom: 8px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .action-content strong {
        display: block;
        font-size: 1.1rem;
        margin-bottom: 8px;
        color: var(--gray-100);
    }

    .action-content p {
        font-size: 0.9rem;
        color: var(--gray-400);
        line-height: 1.5;
        margin-bottom: 16px;
    }

    .fix-tip {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 16px;
        margin-top: 16px;
        position: relative;
    }

    .tip-header {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 800;
        color: var(--gray-600);
        letter-spacing: 0.15em;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        text-transform: uppercase;
    }

    .tip-label {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .tip-label::before {
        content: "!";
        width: 12px;
        height: 12px;
        background: var(--gray-700);
        color: var(--bg);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 0.5rem;
        flex-shrink: 0;
    }

    .tip-body {
        font-size: 0.85rem;
        color: var(--gray-300);
        line-height: 1.4;
    }

    .tip-icon {
        font-family: "Instrument Mono", monospace;
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--accent);
        background: rgba(212, 168, 83, 0.1);
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    /* Copy Fix Button */
    .copy-fix-btn {
        font-family: "Instrument Mono", monospace;
        font-size: 0.55rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--gray-400);
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
        margin-left: auto;
    }

    .copy-fix-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
        color: var(--gray-200);
    }

    .copy-fix-btn.copied {
        background: rgba(34, 197, 94, 0.15);
        border-color: rgba(34, 197, 94, 0.3);
        color: #4ade80;
    }

    /* Status Banner */
    .status-banner {
        padding: 16px 20px;
        background: rgba(245, 158, 11, 0.04);
        border-left: 2px solid rgba(245, 158, 11, 0.4);
        margin-bottom: 32px;
    }

    .status-banner.critical {
        background: rgba(239, 68, 68, 0.06);
        border-left-color: rgba(239, 68, 68, 0.6);
    }

    .status-banner.clear {
        background: rgba(34, 197, 94, 0.04);
        border-left-color: rgba(34, 197, 94, 0.4);
    }

    .status-banner .banner-content strong {
        display: block;
        font-family: "Outfit", sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--fg);
        margin-bottom: 2px;
    }

    .status-banner .banner-content p {
        font-size: 0.85rem;
        color: var(--gray-400);
        line-height: 1.4;
        margin: 0;
    }

    /* Categories */
    .category-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: rgba(255, 255, 255, 0.05); /* Thin grid lines */
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .category-card {
        padding: 24px;
        background: rgba(12, 12, 16, 0.6);
        border: none !important;
        border-radius: 0 !important;
        backdrop-filter: blur(10px);
    }

    .category-card :global(.category-header) {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
    }

    .category-name {
        font-family: "Outfit", sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--fg);
        display: block;
    }

    .category-desc {
        font-size: 0.75rem;
        color: var(--gray-500);
        line-height: 1.5;
        margin-top: 2px;
        display: block;
    }

    .category-bar {
        height: 2px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 0;
        overflow: hidden;
        margin-top: 12px;
    }

    .category-fill {
        height: 100%;
        transition: width 1s ease-out;
    }

    /* --- SUGGESTIONS (HUD LIST) --- */
    .suggestions-section {
        margin-bottom: 40px;
    }

    .suggestions-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .suggestion-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.03);
        border-radius: 2px;
        transition: background 0.2s ease;
    }

    .suggestion-card:hover {
        background: rgba(255, 255, 255, 0.04);
    }

    .suggestion-summary {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 20px;
        list-style: none;
        cursor: pointer;
    }

    .suggestion-summary::-webkit-details-marker {
        display: none;
    }

    .suggestion-icon {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 800;
        color: hsl(200, 90%, 65%);
        background: hsla(200, 90%, 65%, 0.1);
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 2px;
        flex-shrink: 0;
    }

    .suggestion-title {
        flex: 1;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--gray-200);
    }

    .suggestion-category {
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        color: var(--gray-500);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .suggestion-body {
        padding: 0 20px 16px 54px;
    }

    .suggestion-body p {
        font-size: 0.85rem;
        color: var(--gray-400);
        line-height: 1.6;
    }

    /* --- RESULTS FOOTER & PREMIUM INSIGHTS --- */
    .success-section {
        text-align: center;
        padding: 48px 0;
        margin-bottom: 64px;
    }

    .success-icon {
        margin-bottom: 24px;
        display: flex;
        justify-content: center;
    }

    .success-section p {
        color: var(--gray-400);
        font-size: 1.1rem;
        max-width: 500px;
        margin: 0 auto;
    }

    /* Next Action */
    .next-action-section {
        margin-bottom: 48px;
    }

    .next-action {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
    }

    .next-action span {
        font-size: 0.9rem;
        color: var(--gray-200);
    }

    .retest-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 10px 20px;
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 8px;
        color: #f59e0b;
        font-family: "Instrument Mono", monospace;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .retest-button:hover {
        background: rgba(245, 158, 11, 0.2);
        border-color: rgba(245, 158, 11, 0.5);
    }

    /* Footer */
    .report-footer {
        text-align: center;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .footer-actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .footer-hint {
        font-size: 0.8rem;
        color: var(--gray-500);
    }

    .timeline-disclaimer {
        font-size: 0.7rem;
        color: var(--gray-500);
        margin-top: 1rem;
        line-height: 1.4;
    }

    .legal-disclaimer {
        font-size: 0.7rem;
        color: var(--gray-500);
        margin-top: 1.5rem;
        line-height: 1.4;
    }

    .btn-lg {
        padding: 0.875rem 1.75rem;
        font-size: 1rem;
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

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--gray-400);
    }

    .suggestions-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 16px;
    }

    .suggestion-card {
        padding: 16px !important;
    }

    .suggestion-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
    }

    .suggestion-title {
        font-family: "Outfit", sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--gray-100);
        flex: 1;
    }

    .suggestion-category {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--gray-500);
    }

    .suggestion-body p {
        font-size: 0.85rem;
        color: var(--gray-400);
        line-height: 1.5;
        margin: 0;
    }

    /* Review Timeline Section */
    .timeline-section {
        margin-bottom: 48px;
    }

    .timeline-content {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .timeline-estimate {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .estimate-range {
        font-family: "Instrument Mono", monospace;
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--gray-100);
        letter-spacing: -0.05em;
        line-height: 1;
    }

    .estimate-range .unit {
        font-size: 0.9rem;
        color: var(--gray-600);
        margin-left: 2px;
        font-weight: 600;
    }

    .estimate-label {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--gray-400);
        margin-top: 4px;
    }

    .estimate-caveat {
        font-size: 0.75rem;
        color: var(--gray-600);
        font-style: italic;
    }

    .timeline-factors {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        padding: 1rem;
    }

    .timeline-factors ul {
        margin: 0;
        padding-left: 1.25rem;
    }

    .timeline-factors li {
        font-size: 0.85rem;
        color: var(--gray-400);
        margin-bottom: 0.35rem;
    }

    .today-rec {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .rec-day {
        font-family: "Instrument Mono", monospace;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .rec-note {
        font-size: 0.85rem;
        color: var(--gray-400);
    }


    /* Confidence Badges */
    .item-meta-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .confidence-badge {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: 3px;
    }

    .confidence-on-critical {
        color: hsl(0, 85%, 65%);
        background: hsla(0, 85%, 65%, 0.1);
        border: 1px solid hsla(0, 85%, 65%, 0.2);
    }

    .confidence-on-warning {
        color: hsl(38, 95%, 60%);
        background: hsla(38, 95%, 60%, 0.1);
        border: 1px solid hsla(38, 95%, 60%, 0.2);
    }

    .confidence-neutral {
        color: var(--gray-400);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* Feedback Buttons */
    .feedback-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .feedback-label {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 600;
        color: var(--gray-600);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-right: 4px;
    }

    .feedback-btn {
        font-size: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 6px;
        padding: 4px 10px;
        cursor: pointer;
        opacity: 0.5;
        transition: all 0.15s ease;
        line-height: 1;
    }

    .feedback-btn:hover:not(:disabled) {
        opacity: 0.9;
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.12);
    }

    .feedback-btn.active {
        opacity: 1;
        background: rgba(212, 168, 83, 0.12);
        border-color: rgba(212, 168, 83, 0.3);
    }

    .feedback-btn:disabled {
        cursor: wait;
        opacity: 0.3;
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

        .header-actions {
            width: 100%;
            justify-content: stretch;
        }

        .header-actions .btn {
            flex: 1;
        }

        .footer-actions {
            flex-direction: column;
        }

        .quick-tips-grid {
            grid-template-columns: 1fr;
        }

        .timeline-estimate {
            flex-direction: column;
            gap: 0.25rem;
        }
    }
</style>
