<script lang="ts">
    import { reveal } from '../actions/reveal';

    const faqs = [
        {
            q: 'How does PreFlight work?',
            a: 'Upload your app\'s metadata (or .ipa file for Full Review). Our AI simulates Apple\'s review guidelines against your submission, checking 50+ potential rejection reasons. You get a detailed report in under 5 minutes.',
        },
        {
            q: 'Is this guaranteed to prevent rejection?',
            a: 'No tool can guarantee approval - Apple\'s review is ultimately human. But PreFlight catches the most common rejection reasons (metadata issues, missing privacy declarations, screenshot violations) that account for ~70% of first-time rejections.',
        },
        {
            q: 'What\'s the difference between Quick and Full?',
            a: 'Quick Review checks your metadata, screenshots, and URLs. Full Review adds deep privacy manifest analysis, content policy checking, and provides specific fix instructions for every issue found.',
        },
        {
            q: 'Do you store my app data?',
            a: 'Your submission data is encrypted in transit and at rest. We retain it only for the duration of the review (typically under 5 minutes) and delete it within 24 hours. We never share your data.',
        },
        {
            q: 'Can I use this for app updates too?',
            a: 'Absolutely. Many developers run PreFlight before every update, not just initial submissions. The guidelines change frequently, and PreFlight stays current.',
        },
        {
            q: 'When does PreFlight launch?',
            a: 'We\'re currently in private beta. Join the waitlist to get early access and a launch discount.',
        },
    ];

    let openIndex = $state<number | null>(null);

    function toggle(i: number) {
        openIndex = openIndex === i ? null : i;
    }
</script>

<section id="faq" class="faq section">
    <div class="container faq-container">
        <div class="section-header" use:reveal>
            <span class="overline">FAQ</span>
            <h2>Questions? Answered.</h2>
        </div>

        <div class="faq-list">
            {#each faqs as faq, i}
                <div class="faq-item" class:open={openIndex === i}>
                    <button
                        class="faq-trigger"
                        onclick={() => toggle(i)}
                        aria-expanded={openIndex === i}
                    >
                        <span class="faq-question">{faq.q}</span>
                        <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M5 7.5l5 5 5-5"/>
                        </svg>
                    </button>
                    {#if openIndex === i}
                        <div class="faq-answer">
                            <p>{faq.a}</p>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</section>

<style>
    .faq-container {
        max-width: 700px;
    }

    .section-header {
        text-align: center;
        margin-bottom: 48px;
    }

    .section-header h2 {
        font-size: 3rem;
        margin-top: 12px;
        letter-spacing: -0.03em;
    }

    .faq-item {
        border-bottom: 1px solid var(--gray-800);
    }

    .faq-trigger {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 0;
        text-align: left;
        color: var(--fg);
        background: none;
        border: none;
        cursor: pointer;
    }

    .faq-question {
        font-family: 'Outfit', sans-serif;
        font-size: 1.0625rem;
        font-weight: 500;
    }

    .chevron {
        color: var(--gray-500);
        transition: transform 0.3s var(--ease-out-expo);
        flex-shrink: 0;
    }

    .faq-item.open .chevron {
        transform: rotate(180deg);
    }

    .faq-answer {
        padding-bottom: 24px;
        animation: slideDown 0.3s var(--ease-out-expo);
    }

    .faq-answer p {
        font-size: 0.9375rem;
        color: var(--gray-300);
        line-height: 1.6;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 768px) {
        .section-header h2 { font-size: 2rem; }
    }
</style>
