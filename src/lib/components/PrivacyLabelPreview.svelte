<script lang="ts">
    import type { PrivacyLabelData } from "$lib/utils/privacy-label-parser";
    import { categorizePrivacyData } from "$lib/utils/privacy-label-parser";

    interface Props {
        privacyData: PrivacyLabelData | null;
        appName?: string;
    }

    let { privacyData, appName = "Your App" }: Props = $props();

    let categories = $derived(
        privacyData ? categorizePrivacyData(privacyData) : null,
    );
    let hasAnyData = $derived(
        categories &&
            (categories.dataUsedToTrack.length > 0 ||
                categories.dataLinkedToYou.length > 0 ||
                categories.dataNotLinkedToYou.length > 0),
    );
</script>

<div class="privacy-preview">
    <div class="preview-header">
        <div class="section-label">PREVIEW // PRIVACY_STRICTURES</div>
        <h3>System Privacy Signature</h3>
        <p class="step-meta">SIMULATED_STORE_PRESENTATION // V2.1</p>
    </div>

    <CockpitPanel class="app-store-panel">
        <div class="panel-header">
            <span class="panel-id">DATA_COLLECTION_MANIFEST</span>
            <h2>App Privacy Summary</h2>
        </div>

        <p class="developer-text">
            The developer, <strong>{appName}</strong>, indicated that the app's
            privacy practices may include handling of data as described below.
            For more information, see the developer's privacy policy.
        </p>

        {#if !privacyData}
            <div class="no-manifest-warning">
                <div class="warning-icon">!</div>
                <div>
                    <strong>No Privacy Manifest Uploaded</strong>
                    <p>
                        Upload your PrivacyInfo.xcprivacy file to see a preview
                        of your privacy label.
                    </p>
                </div>
            </div>
        {:else if !hasAnyData}
            <div class="privacy-section no-data">
                <div class="section-icon green">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                </div>
                <div class="section-content">
                    <h4>No Data Collected</h4>
                    <p>
                        The developer does not collect any data from this app.
                    </p>
                </div>
            </div>
        {:else}
            <!-- Data Used to Track You -->
            {#if categories && categories.dataUsedToTrack.length > 0}
                <div class="privacy-section tracking">
                    <div class="section-icon red">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <div class="section-content">
                        <h4>Data Used to Track You</h4>
                        <p class="section-description">
                            The following data may be used to track you across
                            apps and websites owned by other companies:
                        </p>
                        <div class="data-tags">
                            {#each categories.dataUsedToTrack as dataType}
                                <span class="data-tag">{dataType}</span>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Data Linked to You -->
            {#if categories && categories.dataLinkedToYou.length > 0}
                <div class="privacy-section linked">
                    <div class="section-icon orange">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                            ></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div class="section-content">
                        <h4>Data Linked to You</h4>
                        <p class="section-description">
                            The following data may be collected and linked to
                            your identity:
                        </p>
                        <div class="data-tags">
                            {#each categories.dataLinkedToYou as dataType}
                                <span class="data-tag">{dataType}</span>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Data Not Linked to You -->
            {#if categories && categories.dataNotLinkedToYou.length > 0}
                <div class="privacy-section not-linked">
                    <div class="section-icon blue">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                            ></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                    </div>
                    <div class="section-content">
                        <h4>Data Not Linked to You</h4>
                        <p class="section-description">
                            The following data may be collected but it is not
                            linked to your identity:
                        </p>
                        <div class="data-tags">
                            {#each categories.dataNotLinkedToYou as dataType}
                                <span class="data-tag">{dataType}</span>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}
        {/if}

        <!-- API Usage Section -->
        {#if privacyData && privacyData.accessedAPITypes.length > 0}
            <div class="api-section">
                <h4>Required Reason APIs</h4>
                <p class="api-description">
                    Your app uses the following system APIs that require
                    declared reasons:
                </p>
                <div class="api-list">
                    {#each privacyData.accessedAPITypes as api}
                        <div class="api-item">
                            <span class="api-name">{api.displayName}</span>
                            <ul class="api-reasons">
                                {#each api.reasonDescriptions as reason}
                                    <li>{reason}</li>
                                {/each}
                            </ul>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <p class="privacy-footer">
            Privacy practices may vary based on, for example, the features you
            use or your age.
            <a
                href="https://developer.apple.com/app-store/app-privacy-details/"
                target="_blank"
                rel="noopener"
            >
                [LINK_PROTOCOL: DOCUMENTATION]
            </a>
        </p>
    </CockpitPanel>

    <!-- Educational Note -->
    <div class="education-note">
        <div class="note-icon">
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        </div>
        <div>
            <strong>Why this matters</strong>
            <p>
                Users check this section before downloading apps. A clear,
                minimal privacy label builds trust. Apps that collect less data
                often see higher download rates.
            </p>
        </div>
    </div>
</div>

<style>
    .privacy-preview {
        padding: 0;
    }

    .preview-header {
        margin-bottom: 2rem;
    }

    .preview-header h3 {
        font-family: "Outfit", sans-serif;
        font-size: 1.8rem;
        font-weight: 800;
        margin-top: 8px;
        letter-spacing: -0.02em;
        color: var(--gray-100);
    }

    .step-meta {
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--gray-600);
        letter-spacing: 0.1em;
        margin-top: 4px;
        text-transform: uppercase;
    }

    .app-store-panel {
        padding: 24px !important;
    }

    .panel-header {
        margin-bottom: 1.5rem;
    }

    .panel-id {
        font-family: "Instrument Mono", monospace;
        font-size: 0.55rem;
        font-weight: 700;
        color: var(--gray-600);
        letter-spacing: 0.15em;
        text-transform: uppercase;
        display: block;
        margin-bottom: 4px;
    }

    .app-store-panel h2 {
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--gray-100);
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
    }

    .lock-icon {
        color: #6366f1;
    }

    .header-title {
        font-size: 17px;
        font-weight: 600;
        color: #1e293b;
    }

    .developer-text {
        font-size: 0.9rem;
        color: var(--gray-400);
        line-height: 1.5;
        margin-bottom: 2rem;
    }

    .developer-text strong {
        color: var(--gray-100);
    }

    .no-manifest-warning {
        display: flex;
        gap: 16px;
        background: rgba(245, 158, 11, 0.05);
        border: 1px solid rgba(245, 158, 11, 0.1);
        border-radius: 4px;
        padding: 20px;
        margin-bottom: 24px;
    }

    .warning-icon {
        width: 20px;
        height: 20px;
        background: #f59e0b;
        color: #000;
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 12px;
        flex-shrink: 0;
    }

    .no-manifest-warning strong {
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        color: #f59e0b;
        text-transform: uppercase;
        display: block;
        margin-bottom: 4px;
    }

    .no-manifest-warning p {
        font-size: 0.85rem;
        color: #f59e0b;
        opacity: 0.8;
        margin: 0;
    }

    .privacy-section {
        display: flex;
        gap: 16px;
        padding: 24px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .privacy-section.no-data {
        border-bottom: none;
    }

    .section-icon {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .section-icon.red {
        background: rgba(239, 68, 68, 0.05);
        color: #f87171;
        border-color: rgba(239, 68, 68, 0.1);
    }

    .section-icon.orange {
        background: rgba(245, 158, 11, 0.05);
        color: #fbbf24;
        border-color: rgba(245, 158, 11, 0.1);
    }

    .section-icon.blue {
        background: rgba(59, 130, 246, 0.05);
        color: #60a5fa;
        border-color: rgba(59, 130, 246, 0.1);
    }

    .section-icon.green {
        background: rgba(34, 197, 94, 0.05);
        color: #4ade80;
        border-color: rgba(34, 197, 94, 0.1);
    }

    .section-content h4 {
        font-family: "Outfit", sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--gray-100);
        margin: 0 0 6px 0;
    }

    .section-description {
        font-size: 0.9rem;
        color: var(--gray-400);
        margin: 0 0 12px 0;
        line-height: 1.5;
    }

    .data-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .data-tag {
        font-family: "Instrument Mono", monospace;
        background: rgba(255, 255, 255, 0.03);
        color: var(--gray-400);
        font-size: 0.65rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 2px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .api-section {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .api-section h4 {
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 8px;
    }

    .api-description {
        font-size: 0.9rem;
        color: var(--gray-400);
        margin: 0 0 1.5rem 0;
        line-height: 1.5;
    }

    .api-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .api-item {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.03);
        border-radius: 4px;
        padding: 16px;
    }

    .api-name {
        font-family: "Instrument Mono", monospace;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--gray-200);
        display: block;
        margin-bottom: 12px;
        text-transform: uppercase;
    }

    .api-reasons {
        margin: 0;
        padding-left: 18px;
    }

    .api-reasons li {
        font-size: 0.85rem;
        color: var(--gray-400);
        margin-bottom: 6px;
    }

    .privacy-footer {
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        color: var(--gray-600);
        margin-top: 2rem;
        margin-bottom: 0;
        line-height: 1.6;
    }

    .privacy-footer a {
        color: var(--accent);
        text-decoration: none;
        font-weight: 700;
    }

    .privacy-footer a:hover {
        text-decoration: underline;
    }

    .education-note {
        display: flex;
        gap: 16px;
        background: var(--accent-subtle);
        border: 1px solid var(--accent-glow);
        border-radius: 4px;
        padding: 20px;
        margin-top: 2rem;
    }

    .note-icon {
        color: var(--accent);
        flex-shrink: 0;
        margin-top: 2px;
    }

    .education-note strong {
        font-family: "Instrument Mono", monospace;
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--accent);
        display: block;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .education-note p {
        font-size: 0.9rem;
        color: var(--gray-300);
        margin: 0;
        line-height: 1.6;
    }
</style>
