<script lang="ts">
    /**
     * App Store Listing Preview
     *
     * Shows users exactly what their app listing will look like on the App Store.
     * This helps first-time publishers visualize their submission before submitting.
     */

    interface Props {
        appName: string;
        subtitle?: string;
        description?: string;
        category?: string;
        ageRating?: string;
        screenshotUrls?: string[];
        developerName?: string;
    }

    let {
        appName,
        subtitle = '',
        description = '',
        category = 'App',
        ageRating = '4+',
        screenshotUrls = [],
        developerName = 'Your Name',
    }: Props = $props();

    // Truncate description for preview (App Store shows ~3 lines before "more")
    let truncatedDescription = $derived(
        description.length > 150 ? description.slice(0, 150) + '...' : description
    );

    // Show first 3 screenshots in preview
    let previewScreenshots = $derived(screenshotUrls.slice(0, 3));
</script>

<div class="listing-preview">
    <div class="preview-header">
        <div class="preview-badge">PREVIEW</div>
        <h3>App Store Listing</h3>
        <p class="preview-subtitle">
            This is approximately how your app will appear on the App Store
        </p>
    </div>

    <div class="app-store-card">
        <!-- App Header -->
        <div class="app-header">
            <div class="app-icon">
                <div class="icon-placeholder">
                    <span>{appName.charAt(0).toUpperCase()}</span>
                </div>
            </div>
            <div class="app-info">
                <h2 class="app-name">{appName}</h2>
                {#if subtitle}
                    <p class="app-subtitle">{subtitle}</p>
                {/if}
                <p class="app-developer">{developerName}</p>
            </div>
            <div class="get-button-container">
                <button class="get-button">GET</button>
                <span class="iap-label">In-App Purchases</span>
            </div>
        </div>

        <!-- Rating & Category Bar -->
        <div class="meta-bar">
            <div class="meta-item">
                <span class="meta-value">--</span>
                <span class="meta-label">No Ratings Yet</span>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
                <span class="meta-value">{ageRating}</span>
                <span class="meta-label">Age</span>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
                <span class="meta-value category-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                        <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                    </svg>
                </span>
                <span class="meta-label">{category}</span>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
                <span class="meta-value">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                    </svg>
                </span>
                <span class="meta-label">Developer</span>
            </div>
        </div>

        <!-- Screenshots -->
        {#if previewScreenshots.length > 0}
            <div class="screenshots-section">
                <h4>Preview</h4>
                <div class="screenshots-scroll">
                    {#each previewScreenshots as url, i}
                        <div class="screenshot-frame">
                            <img src={url} alt="Screenshot {i + 1}" />
                        </div>
                    {/each}
                    {#if screenshotUrls.length > 3}
                        <div class="screenshot-more">
                            +{screenshotUrls.length - 3} more
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="screenshots-section empty">
                <h4>Preview</h4>
                <div class="screenshots-empty">
                    <div class="empty-screenshot"></div>
                    <div class="empty-screenshot"></div>
                    <div class="empty-screenshot"></div>
                    <p class="empty-text">No screenshots uploaded</p>
                </div>
            </div>
        {/if}

        <!-- Description -->
        <div class="description-section">
            {#if description}
                <p class="description-text">
                    {truncatedDescription}
                    {#if description.length > 150}
                        <button class="more-link">more</button>
                    {/if}
                </p>
            {:else}
                <p class="description-placeholder">
                    No description provided. Your app description will appear here.
                </p>
            {/if}
        </div>

        <!-- What's New (Placeholder) -->
        <div class="whats-new-section">
            <h4>What's New</h4>
            <div class="version-info">
                <span class="version">Version 1.0</span>
                <span class="date">Just now</span>
            </div>
            <p class="whats-new-text">Initial release</p>
        </div>

        <!-- Information Section -->
        <div class="info-section">
            <h4>Information</h4>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Seller</span>
                    <span class="info-value">{developerName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Size</span>
                    <span class="info-value">-- MB</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category</span>
                    <span class="info-value">{category}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Compatibility</span>
                    <span class="info-value">iPhone, iPad</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Age Rating</span>
                    <span class="info-value">{ageRating}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Price</span>
                    <span class="info-value">Free</span>
                </div>
            </div>
        </div>
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
            <strong>First Impressions Matter</strong>
            <p>
                Users spend about 7 seconds deciding whether to download. Your app name, icon, and first screenshot
                are the most important elements. Make sure they clearly communicate what your app does.
            </p>
        </div>
    </div>
</div>

<style>
    .listing-preview {
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

    /* App Header */
    .app-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
    }

    .app-icon {
        flex-shrink: 0;
    }

    .icon-placeholder {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .icon-placeholder span {
        color: white;
        font-size: 28px;
        font-weight: 600;
    }

    .app-info {
        flex: 1;
        min-width: 0;
    }

    .app-name {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .app-subtitle {
        font-size: 13px;
        color: #64748b;
        margin: 2px 0 0 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .app-developer {
        font-size: 12px;
        color: #3b82f6;
        margin: 4px 0 0 0;
    }

    .get-button-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .get-button {
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 16px;
        padding: 6px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
    }

    .iap-label {
        font-size: 9px;
        color: #94a3b8;
    }

    /* Meta Bar */
    .meta-bar {
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 12px 0;
        border-top: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 16px;
    }

    .meta-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }

    .meta-value {
        font-size: 14px;
        font-weight: 600;
        color: #64748b;
    }

    .meta-label {
        font-size: 10px;
        color: #94a3b8;
        text-transform: uppercase;
    }

    .meta-divider {
        width: 1px;
        height: 24px;
        background: #e2e8f0;
    }

    .category-icon {
        color: #3b82f6;
    }

    /* Screenshots */
    .screenshots-section {
        margin-bottom: 16px;
    }

    .screenshots-section h4 {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 12px 0;
    }

    .screenshots-scroll {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 8px;
    }

    .screenshot-frame {
        flex-shrink: 0;
        width: 100px;
        height: 217px;
        background: #f1f5f9;
        border-radius: 8px;
        overflow: hidden;
    }

    .screenshot-frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .screenshot-more {
        flex-shrink: 0;
        width: 60px;
        height: 217px;
        background: #f1f5f9;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #64748b;
    }

    .screenshots-empty {
        display: flex;
        gap: 8px;
        position: relative;
    }

    .empty-screenshot {
        width: 100px;
        height: 217px;
        background: #f1f5f9;
        border-radius: 8px;
        border: 2px dashed #cbd5e1;
    }

    .screenshots-section.empty .empty-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
        color: #94a3b8;
        white-space: nowrap;
    }

    /* Description */
    .description-section {
        margin-bottom: 16px;
    }

    .description-text {
        font-size: 14px;
        color: #475569;
        line-height: 1.5;
        margin: 0;
    }

    .more-link {
        background: none;
        border: none;
        color: #3b82f6;
        font-size: 14px;
        cursor: pointer;
        padding: 0;
    }

    .description-placeholder {
        font-size: 14px;
        color: #94a3b8;
        font-style: italic;
        margin: 0;
    }

    /* What's New */
    .whats-new-section {
        padding: 16px 0;
        border-top: 1px solid #e2e8f0;
        margin-bottom: 16px;
    }

    .whats-new-section h4 {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 8px 0;
    }

    .version-info {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
    }

    .version {
        font-size: 12px;
        color: #64748b;
    }

    .date {
        font-size: 12px;
        color: #94a3b8;
    }

    .whats-new-text {
        font-size: 14px;
        color: #475569;
        margin: 0;
    }

    /* Information Section */
    .info-section {
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
    }

    .info-section h4 {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 12px 0;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .info-label {
        font-size: 11px;
        color: #94a3b8;
    }

    .info-value {
        font-size: 13px;
        color: #475569;
    }

    /* Education Note */
    .education-note {
        display: flex;
        gap: 12px;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;
    }

    .note-icon {
        color: #d97706;
        flex-shrink: 0;
    }

    .education-note strong {
        font-size: 13px;
        color: #92400e;
    }

    .education-note p {
        font-size: 13px;
        color: #92400e;
        margin: 4px 0 0 0;
        line-height: 1.5;
    }
</style>
