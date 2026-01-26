<script lang="ts">
    import { reveal } from '../actions/reveal';

    let email = $state('');
    let submitted = $state(false);
    let loading = $state(false);

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (!email.trim()) return;
        loading = true;
        await new Promise(r => setTimeout(r, 800));
        submitted = true;
        loading = false;
    }
</script>

<section id="waitlist" class="final-cta section" use:reveal={{ threshold: 0.3 }}>
    <div class="cta-glow"></div>
    <div class="container cta-content">
        <h2>Ready to stop guessing?</h2>
        <p>Join the waitlist. Be first to know when PreFlight launches.</p>

        <div class="form-wrapper">
            {#if submitted}
                <div class="success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <path d="M5 12l5 5L20 7"/>
                    </svg>
                    <span>You're on the list!</span>
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
                    </button>
                </form>
            {/if}
        </div>
    </div>
</section>

<style>
    .final-cta {
        padding: 160px 0;
        position: relative;
        overflow: hidden;
    }

    .cta-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        height: 80%;
        background: radial-gradient(ellipse at center, rgba(212, 168, 83, 0.05) 0%, transparent 70%);
        pointer-events: none;
    }

    .cta-content {
        position: relative;
        text-align: center;
    }

    h2 {
        font-size: 3rem;
        letter-spacing: -0.03em;
        margin-bottom: 12px;
    }

    p {
        font-size: 1.125rem;
        color: var(--gray-300);
        margin-bottom: 40px;
    }

    .form-wrapper {
        max-width: 460px;
        margin: 0 auto;
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
        animation: scaleIn 0.4s var(--ease-spring);
    }

    @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 768px) {
        h2 { font-size: 2rem; }
        .final-cta { padding: 80px 0; }
        .waitlist-form {
            flex-direction: column;
        }
    }
</style>
