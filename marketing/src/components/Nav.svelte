<script lang="ts">
    let scrolled = $state(false);

    function handleScroll() {
        scrolled = window.scrollY > 50;
    }

    $effect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    });
</script>

<nav class="nav" class:scrolled>
    <div class="nav-inner">
        <a href="/" class="logo">
            PreFlight<span class="dot">.</span>
        </a>
        <div class="nav-actions">
            <a href="/auth/login" class="nav-link">Log in</a>
            <a href="#waitlist" class="btn btn-primary btn-sm">Join Waitlist</a>
        </div>
    </div>
</nav>

<style>
    .nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        height: 64px;
        display: flex;
        align-items: center;
        background: rgba(8, 8, 10, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        transition: box-shadow 0.3s ease;
    }

    .nav.scrolled {
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    }

    .nav-inner {
        max-width: 1200px;
        width: 100%;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .logo {
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        font-size: 1.25rem;
        color: var(--fg);
        letter-spacing: -0.02em;
    }

    .dot {
        color: var(--accent);
        display: inline-block;
        transition: transform 0.3s var(--ease-spring);
    }

    .logo:hover .dot {
        transform: scale(1.4);
    }

    .nav-actions {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .nav-link {
        font-family: 'Instrument Sans', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: var(--gray-300);
        transition: color 0.15s ease;
    }

    .nav-link:hover {
        color: var(--fg);
    }
</style>
