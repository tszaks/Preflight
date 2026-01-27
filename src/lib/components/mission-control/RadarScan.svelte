<script lang="ts">
    import { onMount } from "svelte";

    let { active = true } = $props();
</script>

<div class="radar-container">
    <!-- Grid Background -->
    <div class="grid-lines"></div>

    <!-- Rotating Scanner -->
    <div class="scanner" class:active></div>

    <!-- Pulse Rings -->
    <div class="ring ring-1"></div>
    <div class="ring ring-2"></div>
    <div class="ring ring-3"></div>

    <!-- Central Target -->
    <div class="target">
        <div class="crosshair"></div>
        <slot></slot>
        <!-- App Icon goes here -->
    </div>
</div>

<style>
    .radar-container {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 50%;
        background: radial-gradient(
            circle at center,
            var(--accent-glow) 0%,
            rgba(0, 0, 0, 0) 70%
        );
        box-shadow: 0 0 30px var(--accent-glow) inset;
    }

    .grid-lines {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(
                rgba(255, 255, 255, 0.03) 1px,
                transparent 1px
            ),
            linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.03) 1px,
                transparent 1px
            );
        background-size: 40px 40px;
        background-position: center;
        opacity: 0.3;
        border-radius: 50%;
    }

    .scanner {
        position: absolute;
        inset: 0;
        background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 270deg,
            var(--accent-subtle) 300deg,
            var(--accent) 360deg
        );
        border-radius: 50%;
        opacity: 0;
    }

    .scanner.active {
        opacity: 1;
        animation: scan 4s linear infinite;
    }

    .ring {
        position: absolute;
        border: 1px solid rgba(255, 255, 255, 0.03);
        border-radius: 50%;
    }

    .ring-1 {
        width: 40%;
        height: 40%;
    }
    .ring-2 {
        width: 70%;
        height: 70%;
    }
    .ring-3 {
        width: 95%;
        height: 95%;
        border-style: dashed;
    }

    .target {
        position: relative;
        z-index: 2;
        display: grid;
        place-items: center;
    }

    .crosshair {
        position: absolute;
        width: 20px;
        height: 20px;
        border: 1px solid var(--accent);
        opacity: 0.5;
    }

    .crosshair::before,
    .crosshair::after {
        content: "";
        position: absolute;
        background: var(--accent);
    }

    .crosshair::before {
        top: 9px;
        left: -4px;
        right: -4px;
        height: 1px;
    }
    .crosshair::after {
        left: 9px;
        top: -4px;
        bottom: -4px;
        width: 1px;
    }

    @keyframes scan {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
