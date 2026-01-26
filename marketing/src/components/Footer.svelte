<footer class="footer">
    <div class="container footer-inner">
        <div class="footer-brand">
            <span class="logo">PREFLIGHT<span class="dot">.</span></span>
            <p>Your pre-submission copilot.</p>
        </div>

        <div class="footer-links">
            <div class="link-col">
                <h4>Product</h4>
                <a href="#how-it-works">How it Works</a>
                <a href="#pricing">Pricing</a>
                <a href="#faq">FAQ</a>
            </div>
            <div class="link-col">
                <h4>Company</h4>
                <a href="mailto:hello@mypreflight.app">Contact</a>
            </div>
            <div class="link-col">
                <h4>Legal</h4>
                <a href="/privacy">Privacy</a>
                <a href="/terms">Terms</a>
            </div>
        </div>
    </div>

    <div class="container footer-bottom">
        <span>&copy; 2026 PREFLIGHT. All rights reserved.</span>
    </div>
</footer>

<style>
    .footer {
        border-top: 1px solid var(--gray-800);
        padding: 48px 0 32px;
    }

    .footer-inner {
        display: flex;
        justify-content: space-between;
        margin-bottom: 48px;
    }

    .footer-brand {
        max-width: 200px;
    }

    .logo {
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        font-size: 1.125rem;
    }

    .dot {
        color: var(--accent);
    }

    .footer-brand p {
        margin-top: 8px;
        font-size: 0.875rem;
        color: var(--gray-500);
    }

    .footer-links {
        display: flex;
        gap: 64px;
    }

    .link-col h4 {
        font-family: 'Outfit', sans-serif;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--gray-300);
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .link-col a {
        display: block;
        font-size: 0.875rem;
        color: var(--gray-500);
        padding: 4px 0;
        transition: color 0.2s;
    }

    .link-col a:hover {
        color: var(--fg);
    }

    .footer-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 24px;
        border-top: 1px solid var(--gray-800);
    }

    .footer-bottom span {
        font-size: 0.8125rem;
        color: var(--gray-500);
    }

    @media (max-width: 768px) {
        .footer-inner {
            flex-direction: column;
            gap: 32px;
        }

        .footer-links {
            gap: 32px;
        }
    }
</style>
