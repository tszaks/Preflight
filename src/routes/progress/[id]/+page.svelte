<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { ProgressEvent } from '$lib/types/progress';
    import { PROGRESS_CHECKS } from '$lib/types/progress';

    let { data } = $props();

    // Progress state
    let progress = $state(0);
    let currentMessage = $state('Initializing analysis...');
    let currentPhase = $state<string | null>(null);
    let isComplete = $state(false);
    let hasError = $state(false);
    let errorMessage = $state<string | null>(null);
    let reportId = $state<string | null>(null);

    // Check status tracking
    interface CheckStatus {
        id: string;
        label: string;
        status: 'pending' | 'running' | 'complete' | 'error';
        issuesFound?: number;
    }

    let hardRulesChecks = $state<CheckStatus[]>([
        { id: PROGRESS_CHECKS.METADATA, label: 'App Metadata', status: 'pending' },
        { id: PROGRESS_CHECKS.SCREENSHOTS, label: `Screenshots (${data.submission.screenshot_count})`, status: 'pending' },
        { id: PROGRESS_CHECKS.PRIVACY_MANIFEST, label: 'Privacy Manifest', status: 'pending' },
        { id: PROGRESS_CHECKS.INFO_PLIST, label: 'Info.plist', status: 'pending' },
        { id: PROGRESS_CHECKS.URLS, label: 'URL Validation', status: 'pending' },
    ]);

    let softRulesChecks = $state<CheckStatus[]>([
        { id: PROGRESS_CHECKS.DESCRIPTION, label: 'Description Review', status: 'pending' },
        { id: PROGRESS_CHECKS.CONTENT_POLICY, label: 'Content Policy', status: 'pending' },
        { id: PROGRESS_CHECKS.SCREENSHOTS_AI, label: 'Screenshot Content', status: 'pending' },
        { id: PROGRESS_CHECKS.PRIVACY_POLICY, label: 'Privacy Policy', status: 'pending' },
        { id: PROGRESS_CHECKS.METADATA_QUALITY, label: 'ASO Analysis', status: 'pending' },
    ]);

    let reportChecks = $state<CheckStatus[]>([
        { id: PROGRESS_CHECKS.SCORING, label: 'Calculate Scores', status: 'pending' },
        { id: PROGRESS_CHECKS.SAVING, label: 'Generate Report', status: 'pending' },
    ]);

    // Log stream for the live feed
    let logEntries = $state<Array<{ time: string; message: string; type: 'info' | 'success' | 'error' }>>([]);

    function addLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        logEntries = [...logEntries.slice(-50), { time, message, type }]; // Keep last 50 entries
        // Auto-scroll log to bottom
        requestAnimationFrame(() => {
            const el = document.getElementById('log-container');
            if (el) el.scrollTop = el.scrollHeight;
        });
    }

    function updateCheckStatus(checkId: string, status: CheckStatus['status'], issuesFound?: number) {
        // Search in all check arrays
        for (const checks of [hardRulesChecks, softRulesChecks, reportChecks]) {
            const idx = checks.findIndex(c => c.id === checkId);
            if (idx !== -1) {
                checks[idx] = { ...checks[idx], status, issuesFound };
                return;
            }
        }
    }

    function handleProgressEvent(event: ProgressEvent) {
        progress = Math.max(progress, event.progress);
        currentMessage = event.message;

        if (event.phase) {
            currentPhase = event.phase;
        }

        // Update check statuses
        if (event.check) {
            if (event.type === 'check_start') {
                updateCheckStatus(event.check, 'running');
                addLog(event.message, 'info');
            } else if (event.type === 'check_complete') {
                updateCheckStatus(event.check, 'complete', event.data?.checksFound);
                addLog(event.message, 'success');
            }
        }

        // Phase events
        if (event.type === 'phase_start') {
            addLog(`=== ${event.message} ===`, 'info');
        } else if (event.type === 'phase_complete') {
            addLog(event.message, 'success');
        }

        // Terminal events
        if (event.type === 'complete') {
            isComplete = true;
            reportId = event.data?.reportId || null;
            addLog('Analysis complete!', 'success');

            // Auto-redirect after celebration
            if (reportId) {
                setTimeout(() => {
                    goto(`/report/${reportId}`);
                }, 1500);
            }
        } else if (event.type === 'error') {
            hasError = true;
            errorMessage = event.data?.error || event.message;
            addLog(`Error: ${errorMessage}`, 'error');
        }
    }

    let eventSource: EventSource | null = null;

    onMount(() => {
        const submissionId = $page.params.id;
        addLog('Connecting to analysis stream...', 'info');

        eventSource = new EventSource(`/api/analysis-stream/${submissionId}`);

        eventSource.onmessage = (e) => {
            try {
                const event = JSON.parse(e.data) as ProgressEvent;
                handleProgressEvent(event);
            } catch (err) {
                console.error('Failed to parse SSE event:', err);
            }
        };

        eventSource.onerror = () => {
            if (!isComplete && !hasError) {
                addLog('Connection lost. Reconnecting...', 'error');
            }
        };
    });

    onDestroy(() => {
        eventSource?.close();
    });

    // Phase label formatting
    function getPhaseLabel(phase: string | null): string {
        switch (phase) {
            case 'hard_rules': return 'COMPLIANCE CHECKS';
            case 'soft_rules': return 'PREFLIGHT ANALYSIS';
            case 'report_generation': return 'REPORT GENERATION';
            default: return 'INITIALIZING';
        }
    }
</script>

<svelte:head>
    <title>Analyzing {data.submission.app_name} | Preflight</title>
</svelte:head>

<div class="progress-page">
    <div class="progress-container">
        <!-- Header -->
        <header class="progress-header">
            {#if data.submission.app_icon_url}
                <img class="app-icon app-icon-img" src={data.submission.app_icon_url} alt="{data.submission.app_name} icon" />
            {:else}
                <div class="app-icon app-icon-fallback">
                    {data.submission.app_name.charAt(0).toUpperCase()}
                </div>
            {/if}
            <div class="app-info">
                <h1>{data.submission.app_name}</h1>
                <span class="review-type">{data.submission.review_type === 'full' ? 'Full Review' : 'Quick Review'}</span>
            </div>
        </header>

        <!-- Main Progress Bar -->
        <div class="main-progress">
            <div class="progress-bar-container">
                <div
                    class="progress-bar"
                    class:complete={isComplete}
                    class:error={hasError}
                    class:active={!isComplete && !hasError}
                    style="width: {Math.max(0, progress)}%"
                ></div>
            </div>
            <div class="progress-info">
                <span class="progress-message">
                    {currentMessage}{#if !isComplete && !hasError}<span class="animated-dots"></span>{/if}
                </span>
                <span class="progress-percent">{Math.floor(progress)}%</span>
            </div>
        </div>

        <!-- Phase Indicator -->
        <div class="phase-indicator">
            <span class="phase-label">{getPhaseLabel(currentPhase)}</span>
        </div>

        <!-- Checklist Grid -->
        <div class="checklist-grid">
            <!-- Hard Rules -->
            <section class="checklist-section">
                <h2>Compliance Checks</h2>
                <ul class="checklist">
                    {#each hardRulesChecks as check}
                        <li class="check-item" class:running={check.status === 'running'} class:complete={check.status === 'complete'}>
                            <span class="check-icon">
                                {#if check.status === 'pending'}
                                    <span class="icon-pending"></span>
                                {:else if check.status === 'running'}
                                    <span class="icon-running"></span>
                                {:else if check.status === 'complete'}
                                    <span class="icon-complete">&#10003;</span>
                                {:else}
                                    <span class="icon-error">!</span>
                                {/if}
                            </span>
                            <span class="check-label">{check.label}</span>
                            {#if check.issuesFound !== undefined && check.status === 'complete'}
                                <span class="check-count">{check.issuesFound} issues</span>
                            {/if}
                        </li>
                    {/each}
                </ul>
            </section>

            <!-- Soft Rules -->
            <section class="checklist-section">
                <h2>PreFlight Analysis</h2>
                <ul class="checklist">
                    {#each softRulesChecks as check}
                        <li class="check-item" class:running={check.status === 'running'} class:complete={check.status === 'complete'}>
                            <span class="check-icon">
                                {#if check.status === 'pending'}
                                    <span class="icon-pending"></span>
                                {:else if check.status === 'running'}
                                    <span class="icon-running"></span>
                                {:else if check.status === 'complete'}
                                    <span class="icon-complete">&#10003;</span>
                                {:else}
                                    <span class="icon-error">!</span>
                                {/if}
                            </span>
                            <span class="check-label">{check.label}</span>
                        </li>
                    {/each}
                </ul>
            </section>

            <!-- Report -->
            <section class="checklist-section">
                <h2>Report</h2>
                <ul class="checklist">
                    {#each reportChecks as check}
                        <li class="check-item" class:running={check.status === 'running'} class:complete={check.status === 'complete'}>
                            <span class="check-icon">
                                {#if check.status === 'pending'}
                                    <span class="icon-pending"></span>
                                {:else if check.status === 'running'}
                                    <span class="icon-running"></span>
                                {:else if check.status === 'complete'}
                                    <span class="icon-complete">&#10003;</span>
                                {:else}
                                    <span class="icon-error">!</span>
                                {/if}
                            </span>
                            <span class="check-label">{check.label}</span>
                        </li>
                    {/each}
                </ul>
            </section>
        </div>

        <!-- Log Stream -->
        <section class="log-stream">
            <h2>Live Log</h2>
            <div class="log-container" id="log-container">
                {#each logEntries as entry}
                    <div class="log-entry" class:success={entry.type === 'success'} class:error={entry.type === 'error'}>
                        <span class="log-time">[{entry.time}]</span>
                        <span class="log-message">{entry.message}</span>
                    </div>
                {/each}
                {#if !isComplete && !hasError}
                    <div class="log-cursor-line">
                        <span class="log-cursor">▊</span>
                    </div>
                {/if}
            </div>
        </section>

        <!-- Completion / Error State -->
        {#if isComplete}
            <div class="completion-banner success">
                <h2>Analysis Complete!</h2>
                <p>Redirecting to your report...</p>
                {#if reportId}
                    <a href="/report/{reportId}" class="view-report-btn">View Report Now</a>
                {/if}
            </div>
        {/if}

        {#if hasError}
            <div class="completion-banner error">
                <h2>Analysis Failed</h2>
                <p>{errorMessage}</p>
                <a href="/submit" class="retry-btn">Try Again</a>
            </div>
        {/if}
    </div>
</div>

<style>
    .progress-page {
        min-height: 100vh;
        background: var(--bg, #050505);
        color: var(--fg, #fff);
        padding: 40px 20px;
        font-family: 'Outfit', sans-serif;
    }

    .progress-container {
        max-width: 900px;
        margin: 0 auto;
    }

    /* Header */
    .progress-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 40px;
    }

    .app-icon {
        width: 72px;
        height: 72px;
        border-radius: 16px;
        flex-shrink: 0;
    }

    .app-icon-img {
        object-fit: cover;
    }

    .app-icon-fallback {
        background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
        color: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.75rem;
        font-weight: 800;
    }

    .app-info h1 {
        margin: 0 0 4px;
        font-size: 1.5rem;
        font-weight: 700;
    }

    .review-type {
        font-size: 0.75rem;
        color: var(--gray-500, #888);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    /* Main Progress Bar */
    .main-progress {
        margin-bottom: 24px;
    }

    .progress-bar-container {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
    }

    .progress-bar {
        height: 100%;
        background: var(--accent, #00ff88);
        box-shadow: 0 0 20px var(--accent-glow, rgba(0, 255, 136, 0.5));
        transition: width 0.3s ease-out;
        border-radius: 4px;
    }

    .progress-bar.active {
        animation: barPulse 2s ease-in-out infinite;
    }

    .progress-bar.complete {
        background: #00ff88;
        animation: none;
    }

    .progress-bar.error {
        background: #ff4444;
        box-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
        animation: none;
    }

    .progress-info {
        display: flex;
        justify-content: space-between;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.8rem;
    }

    .progress-message {
        color: var(--fg, #fff);
    }

    .progress-percent {
        color: var(--accent, #00ff88);
        font-weight: 600;
    }

    /* Phase Indicator */
    .phase-indicator {
        text-align: center;
        margin-bottom: 32px;
    }

    .phase-label {
        display: inline-block;
        padding: 8px 20px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        color: var(--accent, #00ff88);
    }

    /* Checklist Grid */
    .checklist-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-bottom: 32px;
    }

    @media (max-width: 768px) {
        .checklist-grid {
            grid-template-columns: 1fr;
        }
    }

    .checklist-section {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 20px;
    }

    .checklist-section h2 {
        margin: 0 0 16px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--gray-500, #888);
    }

    .checklist {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .check-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 0.85rem;
        transition: all 0.2s;
    }

    .check-item:last-child {
        border-bottom: none;
    }

    .check-item.running {
        color: var(--accent, #00ff88);
    }

    .check-item.complete {
        color: var(--gray-400, #999);
    }

    .check-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .icon-pending {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
    }

    .icon-running {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--accent, #00ff88);
        animation: pulse 1s ease-in-out infinite;
    }

    .icon-complete {
        color: var(--accent, #00ff88);
        font-weight: bold;
    }

    .icon-error {
        color: #ff4444;
        font-weight: bold;
    }

    .check-label {
        flex: 1;
    }

    .check-count {
        font-size: 0.7rem;
        color: var(--gray-500, #888);
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
    }

    /* Log Stream */
    .log-stream {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 32px;
    }

    .log-stream h2 {
        margin: 0 0 16px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--gray-500, #888);
    }

    .log-container {
        min-height: 300px;
        max-height: 50vh;
        overflow-y: auto;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.8rem;
        line-height: 1.8;
        padding-right: 8px;
    }

    /* Custom scrollbar for the log */
    .log-container::-webkit-scrollbar {
        width: 6px;
    }

    .log-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 3px;
    }

    .log-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
    }

    .log-container::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.25);
    }

    .log-entry {
        display: flex;
        gap: 8px;
        color: var(--gray-400, #999);
    }

    .log-entry.success {
        color: var(--accent, #00ff88);
    }

    .log-entry.error {
        color: #ff4444;
    }

    .log-time {
        color: var(--gray-600, #666);
        flex-shrink: 0;
    }

    /* Completion Banners */
    .completion-banner {
        text-align: center;
        padding: 40px;
        border-radius: 16px;
        animation: slideUp 0.5s ease-out;
    }

    .completion-banner.success {
        background: linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 200, 100, 0.05) 100%);
        border: 1px solid rgba(0, 255, 136, 0.2);
    }

    .completion-banner.error {
        background: linear-gradient(135deg, rgba(255, 68, 68, 0.1) 0%, rgba(200, 50, 50, 0.05) 100%);
        border: 1px solid rgba(255, 68, 68, 0.2);
    }

    .completion-banner h2 {
        margin: 0 0 8px;
        font-size: 1.5rem;
    }

    .completion-banner p {
        margin: 0 0 20px;
        color: var(--gray-400, #999);
    }

    .view-report-btn, .retry-btn {
        display: inline-block;
        padding: 12px 32px;
        border-radius: 8px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s;
    }

    .view-report-btn {
        background: var(--accent, #00ff88);
        color: #000;
    }

    .view-report-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 255, 136, 0.3);
    }

    .retry-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .retry-btn:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Persistent motion: progress bar breathing glow */
    @keyframes barPulse {
        0%, 100% {
            box-shadow: 0 0 12px var(--accent-glow, rgba(0, 255, 136, 0.4));
        }
        50% {
            box-shadow: 0 0 28px var(--accent-glow, rgba(0, 255, 136, 0.7));
        }
    }

    /* Persistent motion: animated dots after status message */
    .animated-dots::after {
        content: '';
        animation: dots 1.5s steps(4, end) infinite;
    }

    @keyframes dots {
        0%  { content: ''; }
        25% { content: '.'; }
        50% { content: '..'; }
        75% { content: '...'; }
    }

    /* Persistent motion: blinking terminal cursor */
    .log-cursor-line {
        padding: 4px 0;
    }

    .log-cursor {
        color: var(--accent, #00ff88);
        animation: blink 1s step-end infinite;
        font-family: 'Instrument Mono', monospace;
        font-size: 0.8rem;
    }

    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
    }
</style>
