<script lang="ts">
    /**
     * StatusLight.svelte
     *
     * A small LED-style indicator light for system status.
     * Replaces standard colored badges or text.
     */

    interface Props {
        status: "ready" | "processing" | "warning" | "critical" | "neutral";
        label?: string;
        pulse?: boolean;
        size?: "sm" | "md" | "lg";
    }

    let {
        status = "neutral",
        label,
        pulse = false,
        size = "md",
    }: Props = $props();

    const colorMap = {
        ready: "var(--status-complete-fg)", // Green
        processing: "var(--status-processing-fg)", // Blue
        warning: "var(--status-queued-fg)", // Gold/Amber
        critical: "var(--status-failed-fg)", // Red
        neutral: "var(--gray-500)",
    };

    let color = $derived(colorMap[status]);
</script>

<div class="status-indicator {size}">
    <div class="light-container">
        <div
            class="light"
            class:pulse={pulse ||
                status === "processing" ||
                status === "critical"}
            style="--light-color: {color}"
        ></div>
        {#if pulse || status === "processing" || status === "critical"}
            <div class="glow-ring" style="--light-color: {color}"></div>
        {/if}
    </div>

    {#if label}
        <span
            class="label"
            style:color={status === "neutral" ? "var(--gray-400)" : color}
        >
            {label}
        </span>
    {/if}
</div>

<style>
    .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .light-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Sizes */
    .status-indicator.sm .light-container {
        width: 8px;
        height: 8px;
    }
    .status-indicator.md .light-container {
        width: 12px;
        height: 12px;
    }
    .status-indicator.lg .light-container {
        width: 16px;
        height: 16px;
    }

    .light {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: var(--light-color);
        box-shadow: 0 0 8px var(--light-color);
        z-index: 2;
    }

    .glow-ring {
        position: absolute;
        width: 200%;
        height: 200%;
        border-radius: 50%;
        background: var(--light-color);
        opacity: 0.2;
        animation: pulse 2s infinite ease-in-out;
        z-index: 1;
    }

    .label {
        font-family: "Instrument Mono", monospace;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .sm .label {
        font-size: 0.55rem;
    }
    .md .label {
        font-size: 0.6rem;
    }
    .lg .label {
        font-size: 0.7rem;
    }

    @keyframes pulse {
        0% {
            transform: scale(0.8);
            opacity: 0.1;
        }
        50% {
            transform: scale(1.2);
            opacity: 0.3;
        }
        100% {
            transform: scale(0.8);
            opacity: 0.1;
        }
    }
</style>
