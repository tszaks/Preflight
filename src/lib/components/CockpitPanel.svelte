<script lang="ts">
    /**
     * CockpitPanel.svelte
     *
     * The primary container for the "Glass Cockpit" aesthetic.
     * enhancing the standard .card with deeper blur, subtle borders,
     * and optional inner glow states.
     */

    interface Props {
        children?: any;
        variant?: "default" | "elevated" | "alert";
        active?: boolean; // If true, simulating a "live" or focused instrument
        class?: string;
    }

    let {
        children,
        variant = "default",
        active = false,
        class: className = "",
    }: Props = $props();
</script>

<div class="cockpit-panel {variant} {className}" class:active>
    <!-- Background Grid Texture -->
    <div class="panel-grid"></div>

    <div class="panel-content">
        {@render children?.()}
    </div>

    <!-- Technical corners/accents (Decorative) -->
    <div class="corner-accents">
        <div class="corner tl"></div>
        <div class="corner tr"></div>
        <div class="corner bl"></div>
        <div class="corner br"></div>
    </div>
</div>

<style>
    .cockpit-panel {
        position: relative;
        background: rgba(10, 10, 12, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-top: 1px solid rgba(255, 255, 255, 0.12); /* Lighting simulation */
        border-radius: 4px; /* Shorter radius for a more technical look */
        padding: 24px;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 0 1px 1px rgba(255, 255, 255, 0.02);
        transition: all 400ms cubic-bezier(0.23, 1, 0.32, 1);
        overflow: hidden;
    }

    .panel-grid {
        position: absolute;
        inset: 0;
        background-image: radial-gradient(
            rgba(255, 255, 255, 0.02) 1px,
            transparent 1px
        );
        background-size: 24px 24px;
        pointer-events: none;
        opacity: 0.3;
    }

    .panel-content {
        position: relative;
        z-index: 1;
    }

    /* Elevated Variant */
    .cockpit-panel.elevated {
        background: rgba(15, 15, 18, 0.8);
        border-color: rgba(212, 168, 83, 0.15);
    }

    /* Active State */
    .cockpit-panel.active {
        border-color: rgba(212, 168, 83, 0.4);
        background: rgba(15, 15, 18, 0.85);
    }

    /* Corner Accents */
    .corner-accents {
        position: absolute;
        inset: 4px;
        pointer-events: none;
        z-index: 2;
    }

    .corner {
        position: absolute;
        width: 8px;
        height: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.4s ease;
    }

    .tl {
        top: 0;
        left: 0;
        border-right: none;
        border-bottom: none;
    }
    .tr {
        top: 0;
        right: 0;
        border-left: none;
        border-bottom: none;
    }
    .bl {
        bottom: 0;
        left: 0;
        border-right: none;
        border-top: none;
    }
    .br {
        bottom: 0;
        right: 0;
        border-left: none;
        border-top: none;
    }

    .cockpit-panel.active .corner {
        border-color: var(--accent);
        border-width: 1.5px;
        width: 12px;
        height: 12px;
    }
</style>
