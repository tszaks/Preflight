<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    let cpu = $state(20);
    let mem = $state(45);
    let net = $state(10);
    let interval: ReturnType<typeof setInterval>;

    function randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    onMount(() => {
        interval = setInterval(() => {
            cpu = randomInt(15, 60);
            mem = randomInt(40, 55);
            net = randomInt(5, 80);
        }, 1000);
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });
</script>

<div class="system-status">
    <div class="header">TELEMETRY</div>

    <div class="metric">
        <div class="label">
            <span>CPU</span>
            <span>{cpu}%</span>
        </div>
        <div class="bar-container">
            <div class="bar" style="width: {cpu}%"></div>
        </div>
    </div>

    <div class="metric">
        <div class="label">
            <span>MEM</span>
            <span>{mem}%</span>
        </div>
        <div class="bar-container">
            <div class="bar" style="width: {mem}%"></div>
        </div>
    </div>

    <div class="metric">
        <div class="label">
            <span>NET</span>
            <span>{net} MB/s</span>
        </div>
        <div class="bar-container">
            <div class="bar" style="width: {net}%"></div>
        </div>
    </div>
</div>

<style>
    .system-status {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(34, 197, 94, 0.2);
        border-radius: 8px;
        padding: 16px;
        font-family: "JetBrains Mono", "Fira Code", monospace;
    }

    .header {
        font-size: 0.75rem;
        font-weight: 700;
        color: rgba(34, 197, 94, 0.6);
        letter-spacing: 0.1em;
        margin-bottom: 16px;
    }

    .metric {
        margin-bottom: 12px;
    }

    .metric:last-child {
        margin-bottom: 0;
    }

    .label {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: rgba(34, 197, 94, 0.9);
        margin-bottom: 4px;
    }

    .bar-container {
        height: 4px;
        background: rgba(34, 197, 94, 0.1);
        border-radius: 2px;
        overflow: hidden;
    }

    .bar {
        height: 100%;
        background: var(--status-ready-fg, #22c55e);
        transition: width 0.5s ease-out;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
    }
</style>
