<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    let logs = $state<string[]>([]);
    let interval: ReturnType<typeof setInterval>;

    const LOG_MESSAGES = [
        "Initializing secure connection...",
        "Handshake established (TLS 1.3)",
        "Downloading submission payload...",
        "Decompressing archive...",
        "Parsing Info.plist structure...",
        "Verifying bundle identifier...",
        "Checking CFBundleVersion format...",
        "Scanning for UIRequiredDeviceCapabilities...",
        "Analyzing asset catalog...",
        "Verifying alpha channels in icons...",
        "Checking launch storyboard presence...",
        "Parsing PrivacyInfo.xcprivacy...",
        "Cross-referencing API usage...",
        "Detecting UserDefaults access...",
        "Scanning for FileTimestamp APIs...",
        "Validating tracking domains...",
        "Checking NSPrivacyCollectedDataTypes...",
        "Analyzing App Store metadata...",
        "Verifying screenshot resolutions...",
        "Checking description formatting...",
        "Validating keyword density...",
        "Compiling risk assessment report...",
        "Generating compliance score...",
        "Finalizing report...",
    ];

    onMount(() => {
        let index = 0;

        // Initial burst
        logs = ["> " + LOG_MESSAGES[0]];

        interval = setInterval(() => {
            if (index < LOG_MESSAGES.length - 1) {
                index++;
                logs = [...logs, "> " + LOG_MESSAGES[index]];

                // Keep only last 8 lines
                if (logs.length > 8) {
                    logs = logs.slice(-8);
                }
            }
        }, 800);
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });
</script>

<div class="log-terminal">
    <div class="terminal-header">
        <span class="status-dot"></span> SYSTEM LOG // LIVE
    </div>
    <div class="log-content">
        {#each logs as log}
            <div class="log-line">{log}</div>
        {/each}
        <div class="cursor-line">
            <span class="cursor">_</span>
        </div>
    </div>
</div>

<style>
    .log-terminal {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(34, 197, 94, 0.2);
        border-radius: 8px;
        padding: 16px;
        font-family: "JetBrains Mono", "Fira Code", monospace;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .terminal-header {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--status-ready-fg, #22c55e);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(34, 197, 94, 0.1);
    }

    .status-dot {
        width: 6px;
        height: 6px;
        background: currentColor;
        border-radius: 50%;
        box-shadow: 0 0 8px currentColor;
        animation: pulse 2s infinite;
    }

    .log-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        gap: 4px;
        font-size: 0.85rem;
        color: rgba(34, 197, 94, 0.9);
    }

    .log-line {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        animation: fadeIn 0.3s ease-out;
    }

    .cursor {
        display: inline-block;
        animation: blink 1s step-end infinite;
        font-weight: bold;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }

    @keyframes blink {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0;
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
