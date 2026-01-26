<script lang="ts">
    import type { PrivacyLabelData } from '$lib/utils/privacy-label-parser';
    import { categorizePrivacyData } from '$lib/utils/privacy-label-parser';

    interface Props {
        privacyData: PrivacyLabelData | null;
        appName?: string;
    }

    let { privacyData, appName = 'Your App' }: Props = $props();

    let categories = $derived(privacyData ? categorizePrivacyData(privacyData) : null);
    let hasAnyData = $derived(
        categories &&
        (categories.dataUsedToTrack.length > 0 ||
            categories.dataLinkedToYou.length > 0 ||
            categories.dataNotLinkedToYou.length > 0)
    );
</script>

<div class="privacy-preview">
    <div class="preview-header">
        <div class="preview-badge">PREVIEW</div>
        <h3>App Privacy</h3>
        <p class="preview-subtitle">
            This is how your privacy section will appear on the App Store
        </p>
    </div>

    <div class="app-store-card">
        <div class="card-header">
            <span class="lock-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            </span>
            <span class="header-title">App Privacy</span>
        </div>

        <p class="developer-text">
            The developer, <strong>{appName}</strong>, indicated that the app's privacy practices may include
            handling of data as described below. For more information, see the developer's privacy policy.
        </p>

        {#if !privacyData}
            <div class="no-manifest-warning">
                <div class="warning-icon">!</div>
                <div>
                    <strong>No Privacy Manifest Uploaded</strong>
                    <p>Upload your PrivacyInfo.xcprivacy file to see a preview of your privacy label.</p>
                </div>
            </div>
        {:else if !hasAnyData}
            <div class="privacy-section no-data">
                <div class="section-icon green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                </div>
                <div class="section-content">
                    <h4>No Data Collected</h4>
                    <p>The developer does not collect any data from this app.</p>
                </div>
            </div>
        {:else}
            <!-- Data Used to Track You -->
            {#if categories && categories.dataUsedToTrack.length > 0}
                <div class="privacy-section tracking">
                    <div class="section-icon red">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <div class="section-content">
                        <h4>Data Used to Track You</h4>
                        <p class="section-description">
                            The following data may be used to track you across apps and websites owned by other companies:
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div class="section-content">
                        <h4>Data Linked to You</h4>
                        <p class="section-description">
                            The following data may be collected and linked to your identity:
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                    </div>
                    <div class="section-content">
                        <h4>Data Not Linked to You</h4>
                        <p class="section-description">
                            The following data may be collected but it is not linked to your identity:
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
                    Your app uses the following system APIs that require declared reasons:
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
            Privacy practices may vary based on, for example, the features you use or your age.
            <a href="https://developer.apple.com/app-store/app-privacy-details/" target="_blank" rel="noopener">
                Learn More
            </a>
        </p>
    </div>

    <!-- Educational Note -->
    <div class="education-note">
        <div class="note-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        </div>
        <div>
            <strong>Why this matters</strong>
            <p>
                Users check this section before downloading apps. A clear, minimal privacy label builds trust.
                Apps that collect less data often see higher download rates.
            </p>
        </div>
    </div>
</div>

<style>
    .privacy-preview {
        background: #f8fafc;
        border-radius: 16px;
        padding: 24px;
    }

    .preview-header {
        margin-bottom: 20px;
    }

    .preview-badge {
        display: inline-block;
        background: #6366f1;
        color: white;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
        margin-bottom: 8px;
    }

    .preview-header h3 {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 4px 0;
    }

    .preview-subtitle {
        font-size: 13px;
        color: #64748b;
        margin: 0;
    }

    .app-store-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
        font-size: 13px;
        color: #64748b;
        line-height: 1.5;
        margin-bottom: 16px;
    }

    .developer-text strong {
        color: #334155;
    }

    .no-manifest-warning {
        display: flex;
        gap: 12px;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
    }

    .warning-icon {
        width: 24px;
        height: 24px;
        background: #f59e0b;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        flex-shrink: 0;
    }

    .no-manifest-warning strong {
        color: #92400e;
    }

    .no-manifest-warning p {
        font-size: 13px;
        color: #92400e;
        margin: 4px 0 0 0;
    }

    .privacy-section {
        display: flex;
        gap: 12px;
        padding: 16px 0;
        border-bottom: 1px solid #e2e8f0;
    }

    .privacy-section.no-data {
        border-bottom: none;
    }

    .section-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .section-icon.red {
        background: #fee2e2;
        color: #dc2626;
    }

    .section-icon.orange {
        background: #ffedd5;
        color: #ea580c;
    }

    .section-icon.blue {
        background: #dbeafe;
        color: #2563eb;
    }

    .section-icon.green {
        background: #dcfce7;
        color: #16a34a;
    }

    .section-content h4 {
        font-size: 15px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 4px 0;
    }

    .section-description {
        font-size: 13px;
        color: #64748b;
        margin: 0 0 8px 0;
    }

    .data-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .data-tag {
        background: #f1f5f9;
        color: #475569;
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 12px;
    }

    .api-section {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
    }

    .api-section h4 {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 8px 0;
    }

    .api-description {
        font-size: 13px;
        color: #64748b;
        margin: 0 0 12px 0;
    }

    .api-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .api-item {
        background: #f8fafc;
        border-radius: 8px;
        padding: 12px;
    }

    .api-name {
        font-size: 13px;
        font-weight: 500;
        color: #334155;
    }

    .api-reasons {
        margin: 8px 0 0 0;
        padding-left: 16px;
    }

    .api-reasons li {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 4px;
    }

    .privacy-footer {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 16px;
        margin-bottom: 0;
    }

    .privacy-footer a {
        color: #6366f1;
        text-decoration: none;
    }

    .privacy-footer a:hover {
        text-decoration: underline;
    }

    .education-note {
        display: flex;
        gap: 12px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;
    }

    .note-icon {
        color: #3b82f6;
        flex-shrink: 0;
    }

    .education-note strong {
        font-size: 13px;
        color: #1e40af;
    }

    .education-note p {
        font-size: 13px;
        color: #1e40af;
        margin: 4px 0 0 0;
        line-height: 1.5;
    }
</style>
