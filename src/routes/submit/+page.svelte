<script lang="ts">
    import { scanProjectFolder, formatPath, type ScanResults } from "$lib/utils/project-scanner";

    let step = $state(1);
    let loading = $state(false);
    let errorMsg = $state("");

    // Form data
    let appName = $state("");
    let subtitle = $state("");
    let description = $state("");
    let keywords = $state("");
    let category = $state("");
    let ageRating = $state("4+");
    let privacyUrl = $state("");

    let screenshots: File[] = $state([]);
    let privacyManifest: File | null = $state(null);
    let infoPlist: File | null = $state(null);

    // Review type
    let reviewType = $state<"quick" | "full">("full");

    // Project scanner state
    let scanResults: ScanResults | null = $state(null);
    let showScanResults = $state(false);
    let scanning = $state(false);

    function handleFolderSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        scanning = true;
        // Use setTimeout to let the UI update before processing
        setTimeout(() => {
            scanResults = scanProjectFolder(input.files!);
            scanning = false;
            showScanResults = true;
        }, 50);
    }

    function applyScanResults() {
        if (!scanResults) return;

        if (scanResults.infoPlist) {
            infoPlist = scanResults.infoPlist;
        }
        if (scanResults.privacyManifest) {
            privacyManifest = scanResults.privacyManifest;
        }

        showScanResults = false;
    }

    function closeScanResults() {
        showScanResults = false;
        scanResults = null;
    }

    function handleScreenshots(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files) {
            screenshots = [...screenshots, ...Array.from(input.files)].slice(
                0,
                10,
            );
        }
    }

    function removeScreenshot(index: number) {
        screenshots = screenshots.filter((_, i) => i !== index);
    }

    function handleManifest(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.[0]) {
            privacyManifest = input.files[0];
        }
    }

    function handlePlist(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.[0]) {
            infoPlist = input.files[0];
        }
    }

    async function submit() {
        loading = true;
        errorMsg = "";

        try {
            // Step 1: Create submission record
            const createForm = new FormData();
            createForm.set('app_name', appName);
            if (subtitle) createForm.set('subtitle', subtitle);
            if (description) createForm.set('description', description);
            if (keywords) createForm.set('keywords', keywords);
            if (category) createForm.set('category', category);
            createForm.set('age_rating', ageRating);
            if (privacyUrl) createForm.set('privacy_url', privacyUrl);
            createForm.set('review_type', reviewType);

            const createRes = await fetch('/submit?/createSubmission', {
                method: 'POST',
                body: createForm,
            });

            const createResult = await createRes.json();
            const createData = JSON.parse(createResult.data?.[1] || '{}');

            if (!createData.submissionId) {
                throw new Error(createData.message || 'Failed to create submission');
            }

            const submissionId = createData.submissionId;

            // Step 2: Upload files
            if (screenshots.length > 0 || privacyManifest || infoPlist) {
                const uploadForm = new FormData();
                uploadForm.set('submission_id', submissionId);

                for (const file of screenshots) {
                    uploadForm.append('screenshots', file);
                }
                if (privacyManifest) {
                    uploadForm.set('manifest', privacyManifest);
                }
                if (infoPlist) {
                    uploadForm.set('plist', infoPlist);
                }

                await fetch('/submit?/uploadFiles', {
                    method: 'POST',
                    body: uploadForm,
                });
            }

            // Step 3: Redirect to Stripe checkout
            const checkoutRes = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submission_id: submissionId,
                    review_type: reviewType,
                }),
            });

            const checkoutData = await checkoutRes.json();

            if (checkoutData.url) {
                window.location.href = checkoutData.url;
            } else {
                throw new Error('Failed to create checkout session');
            }
        } catch (err) {
            errorMsg = err instanceof Error ? err.message : 'Something went wrong';
            loading = false;
        }
    }
</script>

<main class="submit-page">
    <div class="container">
        <header class="submit-header">
            <h1>New Review</h1>
            <p class="text-muted">Step {step} of 3</p>
        </header>

        <!-- Progress bar -->
        <div class="progress-bar">
            <div class="progress-fill" style="width: {(step / 3) * 100}%"></div>
        </div>

        {#if step === 1}
            <!-- Step 1: Metadata -->
            <div class="step-content">
                <h2>App Metadata</h2>
                <p class="text-muted mb-4">
                    Enter the information from your App Store listing
                </p>

                <div class="form-row">
                    <div class="form-group">
                        <label for="appName" class="form-label"
                            >App Name *</label
                        >
                        <input
                            type="text"
                            id="appName"
                            class="input"
                            bind:value={appName}
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="subtitle" class="form-label">Subtitle</label
                        >
                        <input
                            type="text"
                            id="subtitle"
                            class="input"
                            bind:value={subtitle}
                        />
                    </div>
                </div>

                <div class="form-group">
                    <label for="description" class="form-label"
                        >Description *</label
                    >
                    <textarea
                        id="description"
                        class="input textarea"
                        bind:value={description}
                        rows="5"
                        required
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="keywords" class="form-label">Keywords</label>
                    <input
                        type="text"
                        id="keywords"
                        class="input"
                        bind:value={keywords}
                        placeholder="Comma separated"
                    />
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="category" class="form-label">Category</label
                        >
                        <select
                            id="category"
                            class="input"
                            bind:value={category}
                        >
                            <option value="">Select category</option>
                            <option value="games">Games</option>
                            <option value="productivity">Productivity</option>
                            <option value="utilities">Utilities</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="health">Health & Fitness</option>
                            <option value="finance">Finance</option>
                            <option value="education">Education</option>
                            <option value="social">Social Networking</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="ageRating" class="form-label"
                            >Age Rating</label
                        >
                        <select
                            id="ageRating"
                            class="input"
                            bind:value={ageRating}
                        >
                            <option value="4+">4+</option>
                            <option value="9+">9+</option>
                            <option value="12+">12+</option>
                            <option value="17+">17+</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="privacyUrl" class="form-label"
                        >Privacy Policy URL</label
                    >
                    <input
                        type="url"
                        id="privacyUrl"
                        class="input"
                        bind:value={privacyUrl}
                    />
                </div>

                <div class="step-actions">
                    <a href="/dashboard" class="btn btn-secondary">Cancel</a>
                    <button
                        class="btn btn-primary"
                        onclick={() => (step = 2)}
                        disabled={!appName || !description}
                    >
                        Continue
                    </button>
                </div>
            </div>
        {:else if step === 2}
            <!-- Step 2: Files -->
            <div class="step-content">
                <h2>Screenshots & Files</h2>
                <p class="text-muted mb-4">Upload your App Store assets</p>

                <div class="form-group">
                    <label class="form-label">Screenshots (up to 10)</label>
                    <div class="file-upload">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onchange={handleScreenshots}
                        />
                        <p>Drop screenshots here or click to browse</p>
                    </div>

                    {#if screenshots.length > 0}
                        <div class="file-list">
                            {#each screenshots as file, i}
                                <div class="file-item">
                                    <span>{file.name}</span>
                                    <button
                                        class="remove-btn"
                                        onclick={() => removeScreenshot(i)}
                                        >×</button
                                    >
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>

                <!-- Config Files Section -->
                <div class="config-files-section">
                    <div class="config-header">
                        <div>
                            <h3>Config Files</h3>
                            <p class="text-muted">Info.plist and Privacy Manifest</p>
                        </div>
                        <label class="btn btn-secondary btn-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            {scanning ? "Scanning..." : "Scan Project"}
                            <input
                                type="file"
                                webkitdirectory
                                onchange={handleFolderSelect}
                                disabled={scanning}
                                style="display: none;"
                            />
                        </label>
                    </div>

                    <div class="config-files-list">
                        <!-- Info.plist -->
                        <div class="config-file-row">
                            <div class="config-file-info">
                                <strong>Info.plist</strong>
                                <span class="tooltip-trigger" title="Your app's configuration file containing bundle ID, permissions, and settings.">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 16v-4"/>
                                        <path d="M12 8h.01"/>
                                    </svg>
                                </span>
                            </div>
                            {#if infoPlist}
                                <div class="config-file-status success">
                                    <span>{infoPlist.name}</span>
                                    <button class="remove-btn" onclick={() => infoPlist = null}>×</button>
                                </div>
                            {:else}
                                <label class="config-file-status empty">
                                    <span>Not added</span>
                                    <span class="upload-link">upload</span>
                                    <input type="file" accept=".plist,.xml" onchange={handlePlist} style="display: none;" />
                                </label>
                            {/if}
                        </div>

                        <!-- Privacy Manifest -->
                        <div class="config-file-row">
                            <div class="config-file-info">
                                <strong>Privacy Manifest</strong>
                                <span class="tooltip-trigger" title="Required for iOS 17+. Declares which privacy-sensitive APIs your app uses.">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 16v-4"/>
                                        <path d="M12 8h.01"/>
                                    </svg>
                                </span>
                            </div>
                            {#if privacyManifest}
                                <div class="config-file-status success">
                                    <span>{privacyManifest.name}</span>
                                    <button class="remove-btn" onclick={() => privacyManifest = null}>×</button>
                                </div>
                            {:else}
                                <label class="config-file-status empty">
                                    <span>Not added</span>
                                    <span class="upload-link">upload</span>
                                    <input type="file" accept=".xcprivacy,.plist,.xml" onchange={handleManifest} style="display: none;" />
                                </label>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <button class="btn btn-secondary" onclick={() => (step = 1)}
                        >Back</button
                    >
                    <button class="btn btn-primary" onclick={() => (step = 3)}
                        >Continue</button
                    >
                </div>
            </div>

            <!-- Scan Results Modal -->
            {#if showScanResults && scanResults}
                <div class="modal-overlay" onclick={closeScanResults}>
                    <div class="modal" onclick={(e) => e.stopPropagation()}>
                        <div class="modal-header">
                            <h3>
                                {#if scanResults.infoPlist || scanResults.privacyManifest}
                                    Found files in {scanResults.projectName}/
                                {:else}
                                    No config files found
                                {/if}
                            </h3>
                            <button class="modal-close" onclick={closeScanResults}>×</button>
                        </div>

                        <div class="modal-body">
                            {#if scanResults.infoPlist}
                                <div class="scan-result-item success">
                                    <div class="result-icon">✓</div>
                                    <div class="result-content">
                                        <strong>Info.plist</strong>
                                        <span class="result-path">{formatPath(scanResults.infoPlistPath || '')}</span>
                                    </div>
                                </div>
                            {:else}
                                <div class="scan-result-item warning">
                                    <div class="result-icon">!</div>
                                    <div class="result-content">
                                        <strong>Info.plist</strong>
                                        <span class="result-path">Not found - upload manually</span>
                                    </div>
                                </div>
                            {/if}

                            {#if scanResults.privacyManifest}
                                <div class="scan-result-item success">
                                    <div class="result-icon">✓</div>
                                    <div class="result-content">
                                        <strong>Privacy Manifest</strong>
                                        <span class="result-path">{formatPath(scanResults.privacyManifestPath || '')}</span>
                                    </div>
                                </div>
                            {:else}
                                <div class="scan-result-item warning">
                                    <div class="result-icon">!</div>
                                    <div class="result-content">
                                        <strong>Privacy Manifest</strong>
                                        <span class="result-path">Not found - may not be required for your app</span>
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick={closeScanResults}>Cancel</button>
                            {#if scanResults.infoPlist || scanResults.privacyManifest}
                                <button class="btn btn-primary" onclick={applyScanResults}>Use These Files</button>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        {:else if step === 3}
            <!-- Step 3: Review type & checkout -->
            <div class="step-content">
                <h2>Choose Review Type</h2>
                <p class="text-muted mb-4">Select the depth of analysis</p>

                <div class="review-options">
                    <label
                        class="review-option"
                        class:selected={reviewType === "quick"}
                    >
                        <input
                            type="radio"
                            name="reviewType"
                            value="quick"
                            bind:group={reviewType}
                        />
                        <div class="option-content">
                            <div class="option-header">
                                <h3>Quick Review</h3>
                                <span class="price">$29</span>
                            </div>
                            <p class="text-muted">
                                Metadata & screenshot analysis
                            </p>
                        </div>
                    </label>

                    <label
                        class="review-option"
                        class:selected={reviewType === "full"}
                    >
                        <input
                            type="radio"
                            name="reviewType"
                            value="full"
                            bind:group={reviewType}
                        />
                        <div class="option-content">
                            <div class="option-header">
                                <h3>Full Review</h3>
                                <span class="price">$49</span>
                            </div>
                            <p class="text-muted">
                                + Privacy manifest deep analysis
                            </p>
                        </div>
                    </label>
                </div>

                <div class="summary-card card">
                    <h3>Summary</h3>
                    <div class="summary-row">
                        <span>App</span>
                        <span>{appName}</span>
                    </div>
                    <div class="summary-row">
                        <span>Screenshots</span>
                        <span>{screenshots.length} files</span>
                    </div>
                    <div class="summary-row">
                        <span>Privacy manifest</span>
                        <span>{privacyManifest ? "Included" : "Not included"}</span>
                    </div>
                    <div class="summary-row">
                        <span>Info.plist</span>
                        <span>{infoPlist ? "Included" : "Not included"}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total</span>
                        <span>{reviewType === "quick" ? "$29" : "$49"}</span>
                    </div>
                </div>

                {#if errorMsg}
                    <div class="error-msg">{errorMsg}</div>
                {/if}

                <div class="step-actions">
                    <button class="btn btn-secondary" onclick={() => (step = 2)}
                        >Back</button
                    >
                    <button
                        class="btn btn-primary"
                        onclick={submit}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Continue to Payment"}
                    </button>
                </div>
            </div>
        {/if}
    </div>
</main>

<style>
    .submit-page {
        padding: 120px 0 60px;
        min-height: 100vh;
    }

    .submit-header {
        margin-bottom: 1.5rem;
    }

    .submit-header h1 {
        font-size: 2rem;
        margin-bottom: 0.25rem;
    }

    .progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        margin-bottom: 3rem;
    }

    .progress-fill {
        height: 100%;
        background: var(--accent);
        border-radius: 2px;
        transition: width 0.3s ease;
    }

    .step-content {
        max-width: 600px;
    }

    .step-content h2 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    @media (max-width: 600px) {
        .form-row {
            grid-template-columns: 1fr;
        }
    }

    .textarea {
        resize: vertical;
        min-height: 120px;
    }

    select.input {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b6862' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 14px center;
        padding-right: 40px;
    }

    .file-upload {
        border: 2px dashed rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        position: relative;
        transition: border-color 0.2s;
    }

    .file-upload:hover {
        border-color: var(--accent);
    }

    .file-upload input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
    }

    .file-upload p {
        color: var(--gray-500);
    }

    .file-list {
        margin-top: 1rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .file-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
    }

    .remove-btn {
        background: none;
        border: none;
        color: var(--gray-500);
        cursor: pointer;
        font-size: 1.2rem;
        line-height: 1;
    }

    .remove-btn:hover {
        color: #ef4444;
    }

    .step-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .review-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .review-option {
        display: block;
        cursor: pointer;
    }

    .review-option input {
        display: none;
    }

    .option-content {
        padding: 1.25rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        transition: all 0.2s;
    }

    .review-option.selected .option-content {
        border-color: var(--accent);
        background: rgba(212, 168, 83, 0.05);
    }

    .option-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
    }

    .option-header h3 {
        font-size: 1rem;
    }

    .price {
        font-family: "Outfit", sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
    }

    .summary-card {
        margin-top: 2rem;
    }

    .summary-card h3 {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--gray-500);
        margin-bottom: 1rem;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .summary-row.total {
        border-bottom: none;
        font-weight: 600;
        font-size: 1.1rem;
    }

    .error-msg {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 8px;
        color: #ef4444;
        font-size: 0.9rem;
    }

    /* Config Files Section */
    .config-files-section {
        margin-top: 2rem;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
    }

    .config-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .config-header h3 {
        font-size: 1rem;
        margin: 0 0 0.25rem 0;
    }

    .config-header p {
        font-size: 0.85rem;
        margin: 0;
    }

    .btn-sm {
        padding: 0.5rem 0.875rem;
        font-size: 0.85rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .config-files-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .config-file-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
    }

    .config-file-info {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .config-file-info strong {
        font-size: 0.9rem;
        font-weight: 500;
    }

    .config-file-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
    }

    .config-file-status.empty {
        color: var(--gray-500);
        cursor: pointer;
    }

    .config-file-status.success {
        color: #22c55e;
        background: rgba(34, 197, 94, 0.1);
        padding: 0.375rem 0.625rem;
        border-radius: 6px;
    }

    .upload-link {
        color: var(--accent);
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    .config-file-status.empty:hover .upload-link {
        color: white;
    }

    /* Tooltip */
    .tooltip-trigger {
        display: inline-flex;
        align-items: center;
        margin-left: 0.25rem;
        color: var(--gray-500);
        cursor: help;
        vertical-align: middle;
    }

    .tooltip-trigger:hover {
        color: var(--accent);
    }

    .file-item-success {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.2);
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }

    .modal {
        background: var(--bg-dark);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        width: 100%;
        max-width: 420px;
        overflow: hidden;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .modal-header h3 {
        font-size: 1rem;
        margin: 0;
    }

    .modal-close {
        background: none;
        border: none;
        color: var(--gray-500);
        font-size: 1.5rem;
        cursor: pointer;
        line-height: 1;
        padding: 0;
    }

    .modal-close:hover {
        color: white;
    }

    .modal-body {
        padding: 1.25rem;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    /* Scan Results */
    .scan-result-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 8px;
        margin-bottom: 0.75rem;
    }

    .scan-result-item:last-child {
        margin-bottom: 0;
    }

    .scan-result-item.success {
        background: rgba(34, 197, 94, 0.08);
    }

    .scan-result-item.warning {
        background: rgba(251, 191, 36, 0.08);
    }

    .result-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
        flex-shrink: 0;
    }

    .scan-result-item.success .result-icon {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
    }

    .scan-result-item.warning .result-icon {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
    }

    .result-content {
        flex: 1;
        min-width: 0;
    }

    .result-content strong {
        display: block;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }

    .result-path {
        font-size: 0.8rem;
        color: var(--gray-500);
        word-break: break-all;
    }
</style>
