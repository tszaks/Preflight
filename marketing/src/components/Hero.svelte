<script lang="ts">
    let email = $state('');
    let submitted = $state(false);
    let loading = $state(false);
    let error = $state('');
    let mounted = $state(false);

    $effect(() => {
        mounted = true;
    });

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (!email.trim()) return;

        loading = true;
        error = '';

        try {
            // For now, just simulate - will connect to real API
            await new Promise(r => setTimeout(r, 800));
            submitted = true;
        } catch {
            error = 'Something went wrong. Please try again.';
        } finally {
            loading = false;
        }
    }
</script>

<section class="hero">
    <div class="hero-glow"></div>
    <div class="hero-grid"></div>

    <div class="hero-content" class:mounted>
        <div class="badge" style="--delay: 0ms">
            <span>For indie iOS developers</span>
        </div>

        <h1>
            <span class="line" style="--delay: 150ms">Never get rejected for</span>
            <span class="line" style="--delay: 300ms">something <span class="highlight">you could've caught.</span></span>
        </h1>

        <p class="subhead" style="--delay: 600ms">
            PREFLIGHT runs 50+ of Apple's review checks on your submission
            before you hit Send. Fix issues in minutes, not weeks.
        </p>

        <div class="form-wrapper" style="--delay: 800ms" id="waitlist">
            {#if submitted}
                <div class="success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12l5 5L20 7"/>
                    </svg>
                    <span>You're on the list! We'll notify you at launch.</span>
                </div>
            {:else}
                <form class="waitlist-form" onsubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        bind:value={email}
                        required
                        aria-label="Email address"
                    />
                    <button type="submit" class="btn btn-primary" disabled={loading}>
                        {loading ? 'Joining...' : 'Join the Waitlist'}
                        {#if !loading}
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <path d="M3 8h10M9 4l4 4-4 4"/>
                            </svg>
                        {/if}
                    </button>
                </form>
                {#if error}
                    <p class="error-msg">{error}</p>
                {/if}
            {/if}
        </div>

        <p class="trust" style="--delay: 1000ms">
            <span class="avatars">
                {#each Array(4) as _, i}
                    <span class="avatar" style="--i: {i}">
                        {['T', 'J', 'S', 'M'][i]}
                    </span>
                {/each}
            </span>
            <span class="trust-text">Join 200+ developers on the waitlist</span>
        </p>
    </div>
</section>

<style>
    .hero {
        min-height: 100svh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        padding: 100px 24px 60px;
    }

    .hero-glow {
        position: absolute;
        top: -20%;
        left: 50%;
        transform: translateX(-50%);
        width: 120%;
        height: 70%;
        background: radial-gradient(ellipse at center, rgba(212, 168, 83, 0.04) 0%, transparent 70%);
        pointer-events: none;
    }

    .hero-grid {
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        background-size: 80px 80px;
        mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        pointer-events: none;
    }

    .hero-content {
        position: relative;
        text-align: center;
        max-width: 720px;
    }

    /* Staggered entrance animations */
    .hero-content .badge,
    .hero-content h1 .line,
    .hero-content .subhead,
    .hero-content .form-wrapper,
    .hero-content .trust {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 800ms var(--ease-out-expo) var(--delay, 0ms),
                    transform 800ms var(--ease-out-expo) var(--delay, 0ms);
    }

    .hero-content.mounted .badge,
    .hero-content.mounted h1 .line,
    .hero-content.mounted .subhead,
    .hero-content.mounted .form-wrapper,
    .hero-content.mounted .trust {
        opacity: 1;
        transform: translateY(0);
    }

    .badge {
        display: inline-flex;
        margin-bottom: 24px;
    }

    .badge span {
        font-family: 'Outfit', sans-serif;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--accent);
        padding: 8px 18px;
        border: 1px solid rgba(212, 168, 83, 0.3);
        border-radius: var(--radius-full);
        background: rgba(212, 168, 83, 0.06);
    }

    h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 4.5rem;
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.04em;
        margin-bottom: 24px;
        color: var(--fg);
    }

    h1 .line {
        display: block;
    }

    .highlight {
        background: var(--gradient-gold);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .subhead {
        font-size: 1.25rem;
        color: var(--gray-300);
        line-height: 1.6;
        max-width: 540px;
        margin: 0 auto 40px;
    }

    .form-wrapper {
        max-width: 460px;
        margin: 0 auto 32px;
    }

    .waitlist-form {
        display: flex;
        gap: 12px;
    }

    .waitlist-form input {
        flex: 1;
        height: 54px;
        padding: 0 20px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-full);
        color: var(--fg);
        font-size: 1rem;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .waitlist-form input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.1);
    }

    .waitlist-form input::placeholder {
        color: var(--gray-500);
    }

    .waitlist-form .btn {
        height: 54px;
        min-width: 160px;
        padding: 0 24px;
        flex-shrink: 0;
    }

    .success {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: center;
        padding: 16px 24px;
        background: rgba(34, 197, 94, 0.08);
        border: 1px solid rgba(34, 197, 94, 0.2);
        border-radius: var(--radius-full);
        color: var(--success);
        font-size: 0.95rem;
        animation: scaleIn 0.4s var(--ease-spring);
    }

    @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }

    .error-msg {
        margin-top: 8px;
        font-size: 0.85rem;
        color: var(--error);
    }

    .trust {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
    }

    .avatars {
        display: flex;
    }

    .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--bg-elevated);
        border: 2px solid var(--bg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Outfit', sans-serif;
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--gray-300);
        margin-left: calc(var(--i) * -1px * 6);
    }

    .avatar:nth-child(1) { background: #2a2520; }
    .avatar:nth-child(2) { background: #1e2520; }
    .avatar:nth-child(3) { background: #201e25; }
    .avatar:nth-child(4) { background: #252020; }

    .trust-text {
        font-size: 0.8125rem;
        color: var(--gray-500);
    }

    @media (max-width: 768px) {
        h1 { font-size: 2.75rem; }
        .subhead { font-size: 1.1rem; }

        .waitlist-form {
            flex-direction: column;
        }

        .waitlist-form .btn {
            width: 100%;
            min-width: auto;
        }
    }
</style>
