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
    <div class="control-grid">
        <!-- Left Panel: Status & Telemetry -->
        <div class="panel-left">
            <CockpitPanel class="telemetry-panel">
                <SystemStatus />
            </CockpitPanel>

            <CockpitPanel class="info-panel">
                <div class="target-info">
                    <span class="label">TARGET</span>
                    <span class="value">{appName}</span>
                </div>
                <div class="target-info">
                    <span class="label">STATUS</span>
                    <span class="value blink">ANALYZING</span>
                </div>
                <div class="target-info">
                    <span class="label">MODE</span>
                    <span class="value">DEEP SCAN</span>
                </div>
            </CockpitPanel>
        </div>

        <!-- Center: Radar -->
        <div class="panel-center">
            <div class="radar-wrapper">
                <RadarScan>
                    <div class="app-icon-placeholder">
                        {appName.charAt(0)}
                    </div>
                </RadarScan>
            </div>

            <div class="progress-section">
                <div class="progress-bar-container">
                    <div
                        class="progress-bar"
                        style="width: {scanProgress}%"
                    ></div>
                </div>
                <div class="progress-label">
                    <span>SECURITY SCAN IN PROGRESS</span>
                    <span>{Math.floor(scanProgress)}%</span>
                </div>
            </div>
        </div>

        <!-- Right: Logs -->
        <div class="panel-right">
            <LogStream />
        </div>
    </div>
</div>

<style>
    .mission-control {
        position: fixed;
        inset: 0;
        background: #050505;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        font-family: "Outfit", sans-serif;
    }

    .control-grid {
        display: grid;
        grid-template-columns: 300px 1fr 350px;
        gap: 24px;
        width: 100%;
        max-width: 1400px;
        height: 700px;
    }

    .panel-left {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .mission-control :global(.telemetry-panel),
    .mission-control :global(.info-panel) {
        background: rgba(10, 10, 10, 0.6);
    }

    .target-info {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        font-family: "Instrument Mono", monospace;
    }

    .target-info:last-child {
        border-bottom: none;
    }

    .label {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--gray-600);
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .value {
        font-family: "Instrument Mono", monospace;
        font-size: 0.85rem;
        color: var(--fg);
        font-weight: 700;
        text-transform: uppercase;
    }

    .blink {
        color: var(--accent);
        animation: blink 1.5s step-end infinite;
    }

    .panel-center {
        display: flex;
        flex-direction: column;
        gap: 32px;
        align-items: center;
        justify-content: center;
    }

    .radar-wrapper {
        width: 400px;
        height: 400px;
    }

    .app-icon-placeholder {
        width: 80px;
        height: 80px;
        background: #fff;
        color: #000;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: 800;
    }

    .progress-section {
        width: 100%;
        max-width: 500px;
    }

    .progress-bar-container {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 12px;
    }

    .progress-bar {
        height: 100%;
        background: var(--accent);
        box-shadow: 0 0 12px var(--accent-glow);
        transition: width 0.1s linear;
    }

    .progress-label {
        display: flex;
        justify-content: space-between;
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--accent);
        letter-spacing: 0.1em;
    }

    .panel-right {
        height: 100%;
    }

    @keyframes blink {
        50% {
            opacity: 0;
        }
    }

    @media (max-width: 1024px) {
        .control-grid {
            grid-template-columns: 1fr;
            height: auto;
            overflow-y: auto;
        }
    }
</style>
