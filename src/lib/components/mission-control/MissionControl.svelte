<script lang="ts">
    import { onMount } from "svelte";
    import RadarScan from "./RadarScan.svelte";
    import LogStream from "./LogStream.svelte";
    import SystemStatus from "./SystemStatus.svelte";
    import CockpitPanel from "$lib/components/CockpitPanel.svelte";

    let { appName = "Target App" } = $props();

    let scanProgress = $state(0);

    onMount(() => {
        // Slow progress bar simulation
        const interval = setInterval(() => {
            if (scanProgress < 100) {
                scanProgress += 0.5;
            } else {
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    });
</script>

<div class="mission-control">
    <CockpitPanel class="analysis-panel">
        <div class="analysis-content">
            <div class="analysis-header">
                <h2>Analyzing {appName}</h2>
                <span class="status-badge analyzing">ANALYZING</span>
            </div>

            <div class="progress-section">
                <div class="progress-bar-container">
                    <div
                        class="progress-bar"
                        style="width: {scanProgress}%"
                    ></div>
                </div>
                <div class="progress-label">
                    <span>{Math.floor(scanProgress)}% Complete</span>
                </div>
            </div>

            <p class="analysis-message">Your app is being reviewed against Apple's guidelines...</p>
        </div>
    </CockpitPanel>
</div>

<style>
    .mission-control {
        position: fixed;
        inset: 0;
        background: rgba(8, 8, 10, 0.95);
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 24px;
        backdrop-filter: blur(10px);
    }

    .mission-control :global(.analysis-panel) {
        width: 100%;
        max-width: 500px;
    }

    .analysis-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .analysis-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }

    .analysis-header h2 {
        font-family: "Outfit", sans-serif;
        font-size: 1.8rem;
        font-weight: 700;
        margin: 0;
    }

    .status-badge {
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        padding: 6px 12px;
        border-radius: 4px;
        text-transform: uppercase;
        white-space: nowrap;
    }

    .status-badge.analyzing {
        background: rgba(212, 168, 83, 0.15);
        color: var(--accent);
        border: 1px solid rgba(212, 168, 83, 0.3);
        animation: status-pulse 2s ease-in-out infinite;
    }

    @keyframes status-pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
    }

    .progress-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .progress-bar-container {
        height: 4px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-bar {
        height: 100%;
        background: var(--accent);
        transition: width 0.1s linear;
    }

    .progress-label {
        font-family: "Instrument Mono", monospace;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--gray-400);
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    .analysis-message {
        font-size: 0.95rem;
        color: var(--gray-300);
        line-height: 1.6;
        margin: 0;
    }

    @media (max-width: 600px) {
        .mission-control {
            padding: 20px;
        }

        .analysis-header {
            flex-direction: column;
            align-items: flex-start;
        }

        .analysis-header h2 {
            font-size: 1.5rem;
        }
    }
</style>
