<script lang="ts">
    import { onMount } from "svelte";
    import { invalidateAll } from "$app/navigation";
    import MissionControl from "$lib/components/mission-control/MissionControl.svelte";
    import CockpitPanel from "$lib/components/CockpitPanel.svelte";
    import StatusLight from "$lib/components/StatusLight.svelte";
    import LaunchChecklist from "$lib/components/LaunchChecklist.svelte";
    import { LAUNCH_CHECKLIST } from "$lib/engine/knowledge-base/launch-checklist";
    import {
        REVIEW_TIMES_BY_CATEGORY,
        SUBMISSION_TIMING,
        estimateReviewTime,
        FASTER_APPROVAL_TIPS,
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

    // Tab navigation for premium features
    type PremiumTab = "timeline" | "checklist";
    let activeTab = $state<PremiumTab>("timeline");

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
            isNewApp: true, // Assume new apps for first-time publishers
            hasIAP:
                submission.description
                    ?.toLowerCase()
                    .includes("in-app purchase") ?? false,
            hasSubscription:
                submission.description
                    ?.toLowerCase()
                    .includes("subscription") ?? false,
            hasUGC:
                submission.description?.toLowerCase().includes("user") ?? false,
            isNewDeveloper: true, // Target audience is first-time publishers
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
                                <span class="label">READY_SCORE</span>
                            </div>
                        </div>
                    </div>

                    <!-- Core Info Section -->
                    <div class="hud-info-group">
                        <div class="hud-meta-tags">
                            <span class="hud-tag"
                                >ID: {submission.id
                                    .slice(0, 8)
                                    .toUpperCase()}</span
                            >
                            <span class="hud-tag"
                                >SCAN_TYPE: {submission.review_type.toUpperCase()}</span
                            >
                        </div>
                        <div
                            class="hud-status-box"
                            style="--status-color: {scoreColor(
                                report.score_overall,
                                criticalItems.length > 0,
                            )}"
                        >
                            <div class="status-label">SYSTEM_CONDITION</div>
                            <div class="hud-verdict">
                                {scoreEmoji(
                                    report.score_overall,
                                    criticalItems.length > 0,
                                ).toUpperCase()}
                            </div>
                            <div
                                class="hud-alert-msg {criticalItems.length > 0
                                    ? 'critical'
                                    : warningItems.length > 0
                                      ? 'warning'
                                      : 'safe'}"
                            >
                                {#if criticalItems.length > 0}
                                    <span class="msg">HAZARD_DETECTED</span>
                                {:else if warningItems.length > 0}
                                    <span class="msg">CAUTION_ADVISED</span>
                                {:else}
                                    <span class="msg">NOMINAL_OPERATIONS</span>
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
                                <span class="readout-label">C_ERROR</span>
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
                                <span class="readout-label">W_WARN</span>
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
                                <span class="readout-label">I_INFO</span>
                                <StatusLight
                                    status={report.total_info > 0
                                        ? "ready"
                                        : "neutral"}
                                    size="sm"
                                />
                            </div>
                            <span class="readout-value"
                                >{report.total_info}</span
                            >
                        </div>
                    </div>

                    <!-- Technical Noise Accents -->
                    <div class="hud-noise top-left">GRID_REF: 4022.99</div>
                    <div class="hud-noise top-right">SCAN_DEPTH: 100%</div>
                    <div class="hud-noise bottom-left">LAT: 37.7749</div>
                    <div class="hud-noise bottom-right">LNG: -122.4194</div>
                </div>
            </CockpitPanel>
        </section>

        <!-- What You Need to Do (simplified action items) -->
        {#if criticalItems.length > 0 || warningItems.length > 0}
            <section class="action-section">
                <div class="section-label">DIAGNOSTIC_ALERTS</div>

                {#if criticalItems.length > 0}
                    <div class="action-group">
                        <div class="group-header critical">
                            <StatusLight status="critical" size="sm" pulse />
                            <div class="header-text">
                                <h3>CRITICAL_PRIORITY</h3>
                                <div class="sub-label">
                                    IMMEDIATE_RESOLUTION_REQUIRED
                                </div>
                            </div>
                        </div>
                        {#each criticalItems as item}
                            <CockpitPanel class="action-item critical-item">
                                <div class="action-content">
                                    <div class="item-meta">
                                        CAT: {item.category.toUpperCase()}
                                    </div>
                                    <strong>{item.title}</strong>
                                    <p>{item.description}</p>
                                    {#if item.fix_suggestion}
                                        <div class="fix-tip">
                                            <div class="tip-header">
                                                REMEDIATION_PROTOCOL
                                            </div>
                                            <div class="tip-body">
                                                {item.fix_suggestion}
                                            </div>
                                        </div>
                                    {/if}
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
                                <h3>ADVISORY_CAUTION</h3>
                                <div class="sub-label">
                                    SYSTEM_WARNING_LOGGED
                                </div>
                            </div>
                        </div>
                        {#each warningItems as item}
                            <CockpitPanel class="action-item warning-item">
                                <div class="action-content">
                                    <div class="item-meta">
                                        CAT: {item.category.toUpperCase()}
                                    </div>
                                    <strong>{item.title}</strong>
                                    <p>{item.description}</p>
                                    {#if item.fix_suggestion}
                                        <div class="fix-tip">
                                            <div class="tip-header">
                                                REMEDIATION_PROTOCOL
                                            </div>
                                            <div class="tip-body">
                                                {item.fix_suggestion}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </CockpitPanel>
                        {/each}
                    </div>
                {/if}
            </section>
        {/if}

        <!-- Category Scores -->
        <section class="performance-matrix">
            <div class="section-label">PERFORMANCE_BREAKDOWN</div>
            <div class="matrix-grid">
                {#each ["metadata", "screenshots", "privacy_manifest", "info_plist", "urls", "content_policy"] as cat, i}
                    {@const score = categoryScore(cat)}
                    <CockpitPanel class="matrix-cell">
                        <div class="matrix-header">
                            <div class="matrix-id">
                                ID_{i.toString().padStart(2, "0")}
                            </div>
                            <div class="matrix-label">
                                {categoryLabel(cat).toUpperCase()}
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
                            <span class="matrix-status"
                                >{score === null
                                    ? "PENDING"
                                    : score >= 80
                                      ? "OPTIMAL"
                                      : score >= 50
                                        ? "ADVISORY"
                                        : "CRITICAL"}</span
                            >
                        </div>
                    </CockpitPanel>
                {/each}
            </div>
        </section>

        <!-- Suggestions (non-blocking) -->
        {#if infoItems.length > 0}
            <section class="suggestions-section">
                <h2>Suggestions to Improve</h2>
                <p class="section-subtitle">
                    These won't cause rejection, but could help your app succeed
                </p>

                <div class="suggestions-list">
                    {#each infoItems as item}
                        <details class="suggestion-card card">
                            <summary class="suggestion-summary">
                                <span class="suggestion-icon">i</span>
                                <span class="suggestion-title"
                                    >{item.title}</span
                                >
                                <span class="suggestion-category"
                                    >{categoryLabel(item.category)}</span
                                >
                            </summary>
                            <div class="suggestion-body">
                                <p>{item.description}</p>
                            </div>
                        </details>
                    {/each}
                </div>
            </section>
        {/if}

        <!-- All Good State -->
        {#if items.length === 0}
            <section class="success-section">
                <div class="success-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="#22c55e"
                            stroke-width="3"
                        />
                        <path
                            d="M20 32l8 8 16-16"
                            stroke="#22c55e"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </div>
                <h2>Looking Great!</h2>
                <p>
                    No issues found. Your app appears ready for App Store
                    submission.
                </p>
            </section>
        {/if}

        <!-- What's Next - Simple, encouraging next steps -->
        <section class="whats-next-section">
            <h2>What's Next</h2>
            <div class="next-steps">
                {#if criticalItems.length > 0}
                    <div class="next-step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <strong
                                >Fix the {criticalItems.length} critical issue{criticalItems.length >
                                1
                                    ? "s"
                                    : ""} above</strong
                            >
                            <p>These will cause Apple to reject your app.</p>
                        </div>
                    </div>
                    <div class="next-step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <strong>Re-run this review</strong>
                            <p>
                                Make sure everything passes before submitting.
                            </p>
                        </div>
                    </div>
                {:else if warningItems.length > 0}
                    <div class="next-step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <strong
                                >Consider fixing the {warningItems.length} warning{warningItems.length >
                                1
                                    ? "s"
                                    : ""}</strong
                            >
                            <p>Not required, but reduces rejection risk.</p>
                        </div>
                    </div>
                    <div class="next-step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <strong>Submit to App Store Connect</strong>
                            <p>You're ready to go.</p>
                        </div>
                    </div>
                {:else}
                    <div class="next-step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <strong>Submit to App Store Connect</strong>
                            <p>Your app looks ready.</p>
                        </div>
                    </div>
                {/if}
                <div class="next-step">
                    <span class="step-number"
                        >{criticalItems.length > 0
                            ? "3"
                            : warningItems.length > 0
                              ? "3"
                              : "2"}</span
                    >
                    <div class="step-content">
                        <strong>Wait for Apple's review</strong>
                        <p>
                            Usually 24-48 hours. Check the Timeline tab below
                            for details.
                        </p>
                    </div>
                </div>
            </div>
            <p class="encouragement">You've got this.</p>
        </section>

        <!-- Premium Features Section with Tabs -->
        <div class="premium-features">
            <div class="premium-header">
                <span class="premium-badge">PREMIUM INSIGHTS</span>
                <h2>Everything You Need to Launch</h2>
                <p>
                    First-time publisher? We've got you covered with expert
                    guidance.
                </p>
            </div>

            <!-- Tab Navigation -->
            <nav class="premium-tabs">
                <button
                    class="tab-btn"
                    class:active={activeTab === "timeline"}
                    onclick={() => (activeTab = "timeline")}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <circle cx="12" cy="12" r="10" /><polyline
                            points="12 6 12 12 16 14"
                        />
                    </svg>
                    Timeline
                </button>
                <button
                    class="tab-btn"
                    class:active={activeTab === "checklist"}
                    onclick={() => (activeTab = "checklist")}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline
                            points="22 4 12 14.01 9 11.01"
                        />
                    </svg>
                    Checklist
                </button>
            </nav>

            <!-- Tab Content -->
            <div class="tab-content">
                {#if activeTab === "timeline"}
                    <section class="review-timeline-section">
                        <div class="timeline-content">
                            <div class="timeline-estimate">
                                <span class="estimate-range"
                                    >{reviewTimeEstimate.minHours}-{reviewTimeEstimate.maxHours}</span
                                >
                                <span class="estimate-unit"
                                    >hours estimated review time</span
                                >
                            </div>
                            <div class="timeline-factors">
                                <h4>Factors affecting your review:</h4>
                                <ul>
                                    {#each reviewTimeEstimate.factors as factor}
                                        <li>{factor}</li>
                                    {/each}
                                </ul>
                            </div>
                            {#if todayRecommendation}
                                <div
                                    class="today-recommendation"
                                    class:good={todayRecommendation.recommendation ===
                                        "excellent" ||
                                        todayRecommendation.recommendation ===
                                            "good"}
                                    class:avoid={todayRecommendation.recommendation ===
                                        "avoid"}
                                >
                                    <strong>Submit Today?</strong>
                                    <span
                                        class="rec-badge rec-{todayRecommendation.recommendation}"
                                        >{todayRecommendation.recommendation}</span
                                    >
                                    <p>{todayRecommendation.notes}</p>
                                </div>
                            {/if}
                        </div>

                        <!-- Quick Tips inline with timeline -->
                        <div class="quick-tips-inline">
                            <h4>Quick Tips for Faster Approval</h4>
                            <div class="quick-tips-grid">
                                {#each FASTER_APPROVAL_TIPS.slice(0, 4) as tip}
                                    <div
                                        class="quick-tip-card"
                                        class:high-impact={tip.impact ===
                                            "high"}
                                    >
                                        <span
                                            class="impact-badge impact-{tip.impact}"
                                            >{tip.impact}</span
                                        >
                                        <h4>{tip.title}</h4>
                                        <p>{tip.description}</p>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </section>
                {:else if activeTab === "checklist"}
                    <section class="checklist-section">
                        <LaunchChecklist items={LAUNCH_CHECKLIST} />
                    </section>
                {/if}
            </div>
        </div>

        <div class="report-footer">
            <div class="footer-actions">
                {#if report.total_critical > 0 || report.total_warnings > 0}
                    <a
                        href="/submit?resubmit={submission.id}"
                        class="btn btn-accent btn-lg"
                    >
                        Fix Issues & Re-Review (25 credits)
                    </a>
                {/if}
                <a href="/submit" class="btn btn-secondary">New Review</a>
            </div>
            <p class="footer-hint">
                Need help fixing these issues? Click "Export for AI" above and
                paste into ChatGPT or Claude.
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
        padding: 32px;
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
        padding: 32px;
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
        color: var(--gray-500);
        letter-spacing: 0.1em;
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
        padding: 16px 24px;
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
        font-size: 1.5rem;
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

    .hud-noise {
        position: absolute;
        font-family: "Instrument Mono", monospace;
        font-size: 0.55rem;
        color: var(--gray-700);
        opacity: 0.5;
        pointer-events: none;
    }

    .hud-noise.top-left {
        top: 8px;
        left: 8px;
    }
    .hud-noise.top-right {
        top: 8px;
        right: 8px;
    }
    .hud-noise.bottom-left {
        bottom: 8px;
        left: 8px;
    }
    .hud-noise.bottom-right {
        bottom: 8px;
        right: 8px;
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

    .matrix-id {
        font-family: "Instrument Mono", monospace;
        font-size: 0.55rem;
        color: var(--gray-600);
        background: rgba(255, 255, 255, 0.03);
        padding: 2px 4px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .matrix-label {
        font-family: "Instrument Mono", monospace;
        font-size: 0.7rem;
        font-weight: 700;
        flex: 1;
        letter-spacing: 0.05em;
        color: var(--gray-400);
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

    .matrix-val {
        font-family: "Instrument Mono", monospace;
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--gray-100);
    }

    .matrix-status {
        font-family: "Instrument Mono", monospace;
        font-size: 0.55rem;
        font-weight: 800;
        color: var(--gray-500);
        letter-spacing: 0.1em;
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
        background: rgba(200, 200, 255, 0.1);
        color: hsl(200, 90%, 70%);
        border: 1px solid hsla(200, 90%, 70%, 0.2);
        border-radius: 50%;
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
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

    .action-item p {
        font-size: 0.9rem;
        color: var(--gray-400);
        margin-bottom: 16px;
        line-height: 1.5;
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
        font-size: 0.55rem;
        font-weight: 800;
        color: var(--gray-500);
        letter-spacing: 0.15em;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .tip-header::before {
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
    }

    .tip-body {
        font-size: 0.85rem;
        color: var(--gray-300);
        line-height: 1.4;
    }

    .action-item p {
        font-size: 0.9rem;
        color: var(--gray-400);
        line-height: 1.6;
    }

    .fix-tip {
        margin-top: 16px;
        padding: 12px 16px;
        background: rgba(212, 168, 83, 0.03);
        border: 1px solid rgba(212, 168, 83, 0.1);
        border-radius: 2px;
        display: flex;
        gap: 12px;
        font-size: 0.85rem;
        color: var(--gray-300);
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

    /* Success State */
    .success-section {
        text-align: center;
        padding: 4rem 2rem;
    }

    .success-icon {
        margin-bottom: 1.5rem;
    }

    .success-section h2 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }

    .success-section p {
        color: var(--gray-300);
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

    /* Premium Features Section */
    .premium-features {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 2px solid rgba(212, 168, 83, 0.2);
    }

    .premium-header {
        text-align: center;
        margin-bottom: 2.5rem;
    }

    .premium-badge {
        display: inline-block;
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        color: var(--bg);
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        padding: 0.35rem 0.875rem;
        border-radius: 20px;
        margin-bottom: 1rem;
    }

    .premium-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--fg);
        margin-bottom: 0.5rem;
    }

    .premium-header p {
        font-size: 0.95rem;
        color: var(--gray-400);
    }

    /* Tab Navigation */
    .premium-tabs {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 12px;
        margin-bottom: 1.5rem;
    }

    .tab-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: var(--gray-400);
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .tab-btn:hover {
        color: var(--gray-200);
        background: rgba(255, 255, 255, 0.04);
    }

    .tab-btn.active {
        color: var(--fg);
        background: rgba(212, 168, 83, 0.15);
        border: 1px solid rgba(212, 168, 83, 0.3);
    }

    .tab-btn svg {
        flex-shrink: 0;
    }

    .tab-count {
        font-size: 0.7rem;
        font-weight: 600;
        background: rgba(212, 168, 83, 0.2);
        color: var(--accent);
        padding: 0.15rem 0.4rem;
        border-radius: 10px;
        margin-left: 0.25rem;
    }

    .tab-content {
        min-height: 400px;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--gray-400);
    }

    .quick-tips-inline {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .quick-tips-inline h4 {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--gray-200);
        margin-bottom: 1rem;
    }

    .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--gray-200);
        margin-bottom: 1rem;
    }

    /* Review Timeline Section */
    .review-timeline-section {
        padding: 1.5rem;
        margin-bottom: 2rem;
    }

    .timeline-header {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 1.25rem;
    }

    .timeline-icon {
        font-size: 1.75rem;
        flex-shrink: 0;
    }

    .timeline-header h3 {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        color: var(--fg);
    }

    .timeline-subtitle {
        font-size: 0.8rem;
        color: var(--gray-400);
        margin: 0.25rem 0 0 0;
    }

    .timeline-content {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .timeline-estimate {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
    }

    .estimate-range {
        font-family: "Outfit", sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .estimate-unit {
        font-size: 1rem;
        color: var(--gray-400);
    }

    .timeline-factors {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        padding: 1rem;
    }

    .timeline-factors h4 {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--gray-300);
        margin: 0 0 0.75rem 0;
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

    .today-recommendation {
        padding: 1rem;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.02);
        border-left: 3px solid var(--gray-600);
    }

    .today-recommendation.good {
        background: rgba(34, 197, 94, 0.08);
        border-left-color: #22c55e;
    }

    .today-recommendation.avoid {
        background: rgba(239, 68, 68, 0.08);
        border-left-color: #ef4444;
    }

    .today-recommendation strong {
        font-size: 0.85rem;
        color: var(--gray-200);
    }

    .rec-badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        margin-left: 0.5rem;
    }

    .rec-excellent,
    .rec-good {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
    }

    .rec-okay {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
    }

    .rec-avoid {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
    }

    .today-recommendation p {
        font-size: 0.85rem;
        color: var(--gray-400);
        margin: 0.5rem 0 0 0;
        line-height: 1.5;
    }

    /* What's Next Section */
    .whats-next-section {
        margin-bottom: 2.5rem;
        padding: 1.5rem;
        background: rgba(34, 197, 94, 0.05);
        border: 1px solid rgba(34, 197, 94, 0.15);
        border-radius: 12px;
    }

    .whats-next-section h2 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--fg);
        margin-bottom: 1rem;
    }

    .next-steps {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .next-step {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
    }

    .step-number {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        flex-shrink: 0;
    }

    .step-content strong {
        display: block;
        font-size: 0.9rem;
        color: var(--fg);
        margin-bottom: 0.15rem;
    }

    .step-content p {
        font-size: 0.8rem;
        color: var(--gray-400);
        margin: 0;
    }

    .encouragement {
        margin-top: 1rem;
        font-size: 0.85rem;
        font-weight: 500;
        color: #4ade80;
        text-align: center;
    }

    /* Tab Content Sections */
    .checklist-section,
    .quick-tips-section {
        margin-bottom: 2rem;
    }

    /* Quick Tips Grid */
    .quick-tips-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .quick-tip-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 1.25rem;
        transition:
            transform 0.2s ease,
            border-color 0.2s ease;
    }

    .quick-tip-card:hover {
        transform: translateY(-2px);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .quick-tip-card.high-impact {
        border-color: rgba(212, 168, 83, 0.3);
    }

    .quick-tip-card h4 {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--fg);
        margin: 0.75rem 0 0.5rem 0;
    }

    .quick-tip-card p {
        font-size: 0.8rem;
        color: var(--gray-400);
        line-height: 1.5;
        margin: 0;
    }

    .impact-badge {
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
    }

    .impact-high {
        background: rgba(212, 168, 83, 0.2);
        color: #d4a853;
    }

    .impact-medium {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
    }

    .impact-low {
        background: rgba(107, 114, 128, 0.2);
        color: #9ca3af;
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
