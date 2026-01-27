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
        variant?: 'default' | 'elevated' | 'alert';
        active?: boolean; // If true, simulating a "live" or focused instrument
        class?: string;
    }

    let { 
        children, 
        variant = 'default', 
        active = false,
        class: className = '' 
    }: Props = $props();
</script>

<div 
    class="cockpit-panel {variant} {className}"
    class:active={active}
>
    {@render children?.()}
    
    <!-- Technical corners/accents (Decorative) -->
    <div class="corner-accents"></div>
</div>

<style>
    .cockpit-panel {
        position: relative;
        background: rgba(15, 15, 18, 0.6);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-lg, 16px);
        padding: var(--space-6, 24px);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
        transition: all var(--duration-normal, 250ms) var(--ease, ease);
        overflow: hidden; /* For inner glow containment */
    }

    /* Elevated Variant (floating higher) */
    .cockpit-panel.elevated {
        background: rgba(20, 20, 24, 0.7);
        border-color: rgba(255, 255, 255, 0.12);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    /* Alert Variant */
    .cockpit-panel.alert {
        background: rgba(239, 68, 68, 0.05); /* Red tint */
        border-color: rgba(239, 68, 68, 0.2);
    }

    /* Active State (Glow) */
    .cockpit-panel.active {
        border-color: rgba(212, 168, 83, 0.3); /* Gold border */
        box-shadow: 
            0 4px 24px rgba(0, 0, 0, 0.3),
            inset 0 0 20px rgba(212, 168, 83, 0.05); /* Inner gold glow */
    }

    /* Decorative Corners (Subtle tech markings) */
    .corner-accents {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        opacity: 0.3;
        mix-blend-mode: overlay;
    }

    .corner-accents::before,
    .corner-accents::after {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        transition: border-color 0.3s ease;
    }

    .corner-accents::before {
        top: 8px;
        left: 8px;
        border-right: none;
        border-bottom: none;
    }

    .corner-accents::after {
        bottom: 8px;
        right: 8px;
        border-left: none;
        border-top: none;
    }

    .cockpit-panel.active .corner-accents::before,
    .cockpit-panel.active .corner-accents::after {
        border-color: var(--accent);
    }
</style>
