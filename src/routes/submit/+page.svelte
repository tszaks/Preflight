<script lang="ts">
    import { deserialize } from "$app/forms";
    import {
        scanProjectFolder,
        formatPath,
        type ScanResults,
    } from "$lib/utils/project-scanner";
    import CockpitPanel from "$lib/components/CockpitPanel.svelte";

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

    // Pricing (single tier for now, recheck discount coming later)
    const PRICE = 49;

    // Required files validation
    let missingFiles = $derived.by(() => {
        const missing: string[] = [];
        if (screenshots.length === 0) missing.push("At least 1 screenshot");
        if (!privacyManifest)
            missing.push("Privacy manifest (PrivacyInfo.xcprivacy)");
        if (!infoPlist) missing.push("Info.plist");
        return missing;
    });
    let canSubmit = $derived(missingFiles.length === 0);

    // Project scanner state
    let scanResults: ScanResults | null = $state(null);
    let showScanResults = $state(false);
    let scanning = $state(false);
    let scanProgress = $state("");
    let applyingFiles = $state(false);

    function handleFolderSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const fileCount = input.files.length;
        scanning = true;
        scanProgress = `Scanning ${fileCount.toLocaleString()} files...`;

        // Use setTimeout to let the UI update before processing
        setTimeout(() => {
            scanResults = scanProjectFolder(input.files!);
            scanning = false;
            scanProgress = "";
            showScanResults = true;
        }, 50);
    }

    function applyScanResults() {
        if (!scanResults) return;

        applyingFiles = true;
        showScanResults = false;

        // Small delay to show loading state, then apply files
        setTimeout(() => {
            if (scanResults?.infoPlist) {
                infoPlist = scanResults.infoPlist;
            }
            if (scanResults?.privacyManifest) {
                privacyManifest = scanResults.privacyManifest;
            }
            applyingFiles = false;
        }, 100);
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
        // Validate required files
        if (!canSubmit) {
            errorMsg = `Missing required files: ${missingFiles.join(", ")}`;
            return;
        }

        loading = true;
        errorMsg = "";

        try {
            // Step 1: Create submission record
            const createForm = new FormData();
            createForm.set("app_name", appName);
            if (subtitle) createForm.set("subtitle", subtitle);
            if (description) createForm.set("description", description);
            if (keywords) createForm.set("keywords", keywords);
            if (category) createForm.set("category", category);
            createForm.set("age_rating", ageRating);
            if (privacyUrl) createForm.set("privacy_url", privacyUrl);
            createForm.set("review_type", "full");

            const createRes = await fetch("/submit?/createSubmission", {
                method: "POST",
                body: createForm,
            });

            const createResult = deserialize(await createRes.text());

            if (createResult.type === "failure") {
                throw new Error(
                    (createResult.data as { message?: string })?.message ||
                        "Failed to create submission",
                );
            }

            if (
                createResult.type !== "success" ||
                !createResult.data?.submissionId
            ) {
                throw new Error("Failed to create submission");
            }

            const submissionId = createResult.data.submissionId as string;

            // Step 2: Upload files
            if (screenshots.length > 0 || privacyManifest || infoPlist) {
                const uploadForm = new FormData();
                uploadForm.set("submission_id", submissionId);

                for (const file of screenshots) {
                    uploadForm.append("screenshots", file);
                }
                if (privacyManifest) {
                    uploadForm.set("manifest", privacyManifest);
                }
                if (infoPlist) {
                    uploadForm.set("plist", infoPlist);
                }

                await fetch("/submit?/uploadFiles", {
                    method: "POST",
                    body: uploadForm,
                });
            }

            // Step 3: Redirect to Stripe checkout
            const checkoutRes = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submission_id: submissionId,
                    review_type: "full",
                }),
            });

            const checkoutData = await checkoutRes.json();

            if (!checkoutRes.ok) {
                throw new Error(
                    checkoutData.message ||
                        `Checkout failed: ${checkoutRes.status}`,
                );
            }

            if (checkoutData.url) {
                window.location.href = checkoutData.url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (err) {
            errorMsg =
                err instanceof Error ? err.message : "Something went wrong";
            loading = false;
        }
    }

    async function testSubmit() {
        // Validate required files
        if (!canSubmit) {
            errorMsg = `Missing required files: ${missingFiles.join(", ")}`;
            return;
        }

        loading = true;
        errorMsg = "";

        try {
            const formData = new FormData();
            formData.set("app_name", appName);
            if (subtitle) formData.set("subtitle", subtitle);
            if (description) formData.set("description", description);
            if (keywords) formData.set("keywords", keywords);
            if (category) formData.set("category", category);
            formData.set("age_rating", ageRating);
            if (privacyUrl) formData.set("privacy_url", privacyUrl);

            for (const file of screenshots) {
                formData.append("screenshots", file);
            }
            if (privacyManifest) {
                formData.set("manifest", privacyManifest);
            }
            if (infoPlist) {
                formData.set("plist", infoPlist);
            }

            const response = await fetch("/submit?/testSubmit", {
                method: "POST",
                body: formData,
            });

            // Handle redirect
            if (response.redirected) {
                window.location.href = response.url;
                return;
            }

            const result = await response.text();
            const parsedResult = deserialize(result);

            if (parsedResult.type === "failure") {
                throw new Error(
                    (parsedResult.data as { message?: string })?.message ||
                        "Test submission failed",
                );
            }
        } catch (err) {
            errorMsg =
                err instanceof Error ? err.message : "Something went wrong";
            loading = false;
        }
    }
</script>

<main class="submit-page">
    <div class="container">
        <header class="submit-header">
            <div class="section-label">PRE_FLIGHT_INITIALIZATION</div>
            <h1>Mission Parameters</h1>
            <p class="step-meta">
                STEP_{step.toString().padStart(2, "0")} // SEQ_CMD_{step}
            </p>
        </header>

        <!-- Progress bar -->
        <div class="progress-container">
            <div class="progress-fill" style="width: {(step / 3) * 100}%"></div>
            <div class="progress-grid"></div>
        </div>

        {#if step === 1}
            <!-- Step 1: Metadata -->
            <CockpitPanel class="step-content">
                <div class="panel-header">
                    <span class="panel-id">CFG_METADATA</span>
                    <h2>App Metadata</h2>
                </div>
                <p class="step-desc">
                    Enter the information from your App Store listing
                </p>

                <div class="form-row">
                    <div class="form-group">
                        <label for="appName" class="form-label"
                            >APP_IDENTIFIER *</label
                        >
                        <input
                            type="text"
                            id="appName"
                            class="input"
                            bind:value={appName}
                            required
                            placeholder="Enter application name..."
                        />
                    </div>

                    <div class="form-group">
                        <label for="subtitle" class="form-label"
                            >APP_SUBTITLE</label
                        >
                        <input
                            type="text"
                            id="subtitle"
                            class="input"
                            bind:value={subtitle}
                            placeholder="Enter subtitle (optional)..."
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
            </CockpitPanel>
        {:else if step === 2}
            <!-- Step 2: Files -->
            <CockpitPanel class="step-content">
                <h2>Screenshots & Files</h2>
                <p class="text-muted mb-4">Upload your App Store assets</p>

                <div class="form-group">
                    <label class="form-label">VISUAL_ASSETS (UP_TO_10)</label>
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
                            <h3>TECHNICAL_CONFIG</h3>
                            <p class="step-desc">
                                Info.plist and Privacy Manifest
                            </p>
                        </div>
                        <label class="btn btn-secondary btn-sm">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                <circle cx="12" cy="12" r="3" />
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
                                <span
                                    class="tooltip-trigger"
                                    title="Your app's configuration file containing bundle ID, permissions, and settings."
                                >
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                </span>
                            </div>
                            {#if infoPlist}
                                <div class="config-file-status success">
                                    <span>{infoPlist.name}</span>
                                    <button
                                        class="remove-btn"
                                        onclick={() => (infoPlist = null)}
                                        >×</button
                                    >
                                </div>
                            {:else}
                                <label class="config-file-status empty">
                                    <span>Not added</span>
                                    <span class="upload-link">upload</span>
                                    <input
                                        type="file"
                                        accept=".plist,.xml"
                                        onchange={handlePlist}
                                        style="display: none;"
                                    />
                                </label>
                            {/if}
                        </div>

                        <!-- Privacy Manifest -->
                        <div class="config-file-row">
                            <div class="config-file-info">
                                <strong>Privacy Manifest</strong>
                                <span
                                    class="tooltip-trigger"
                                    title="Required for iOS 17+. Declares which privacy-sensitive APIs your app uses."
                                >
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                </span>
                            </div>
                            {#if privacyManifest}
                                <div class="config-file-status success">
                                    <span>{privacyManifest.name}</span>
                                    <button
                                        class="remove-btn"
                                        onclick={() => (privacyManifest = null)}
                                        >×</button
                                    >
                                </div>
                            {:else}
                                <label class="config-file-status empty">
                                    <span>Not added</span>
                                    <span class="upload-link">upload</span>
                                    <input
                                        type="file"
                                        accept=".xcprivacy,.plist,.xml"
                                        onchange={handleManifest}
                                        style="display: none;"
                                    />
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
            </CockpitPanel>

            <!-- Scanning/Applying Overlay -->
            {#if scanning || applyingFiles}
                <div class="loading-overlay">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">
                            {#if scanning}
                                {scanProgress || "Scanning project..."}
                            {:else}
                                Applying files...
                            {/if}
                        </p>
                    </div>
                </div>
            {/if}

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
                            <button
                                class="modal-close"
                                onclick={closeScanResults}>×</button
                            >
                        </div>

                        <div class="modal-body">
                            {#if scanResults.infoPlist}
                                <div class="scan-result-item success">
                                    <div class="result-icon">✓</div>
                                    <div class="result-content">
                                        <strong>Info.plist</strong>
                                        <span class="result-path"
                                            >{formatPath(
                                                scanResults.infoPlistPath || "",
                                            )}</span
                                        >
                                    </div>
                                </div>
                            {:else}
                                <div class="scan-result-item warning">
                                    <div class="result-icon">!</div>
                                    <div class="result-content">
                                        <strong>Info.plist</strong>
                                        <span class="result-path"
                                            >Not found - upload manually</span
                                        >
                                    </div>
                                </div>
                            {/if}

                            {#if scanResults.privacyManifest}
                                <div class="scan-result-item success">
                                    <div class="result-icon">✓</div>
                                    <div class="result-content">
                                        <strong>Privacy Manifest</strong>
                                        <span class="result-path"
                                            >{formatPath(
                                                scanResults.privacyManifestPath ||
                                                    "",
                                            )}</span
                                        >
                                    </div>
                                </div>
                            {:else}
                                <div class="scan-result-item warning">
                                    <div class="result-icon">!</div>
                                    <div class="result-content">
                                        <strong>Privacy Manifest</strong>
                                        <span class="result-path"
                                            >Not found - may not be required for
                                            your app</span
                                        >
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <div class="modal-footer">
                            <button
                                class="btn btn-secondary"
                                onclick={closeScanResults}>Cancel</button
                            >
                            {#if scanResults.infoPlist || scanResults.privacyManifest}
                                <button
                                    class="btn btn-primary"
                                    onclick={applyScanResults}
                                    >Use These Files</button
                                >
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        {:else if step === 3}
            <!-- Step 3: Confirm & checkout -->
            <div class="step-content">
                <div class="panel-header">
                    <span class="panel-id">CFG_VERIFICATION</span>
                    <h2>Final Pre-Flight Check</h2>
                </div>
                <p class="step-desc">
                    Review your submission parameters for deployment
                </p>

                <CockpitPanel class="summary-card">
                    <div class="section-label">READOUT_SUMMARY</div>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">APP_IDENTIFIER</span>
                            <span class="summary-value">{appName}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">ASSET_COUNT</span>
                            <span class="summary-value"
                                >{screenshots.length} FILES</span
                            >
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">PRIVACY_MANIFEST</span>
                            <span
                                class="summary-value status-{privacyManifest
                                    ? 'ready'
                                    : 'warning'}"
                            >
                                {privacyManifest ? "ATTACHED" : "MISSING"}
                            </span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">INFO_PLIST</span>
                            <span
                                class="summary-value status-{infoPlist
                                    ? 'ready'
                                    : 'warning'}"
                            >
                                {infoPlist ? "ATTACHED" : "MISSING"}
                            </span>
                        </div>
                        <div class="summary-item total">
                            <span class="summary-label">TOTAL_FEE</span>
                            <span class="summary-value">${PRICE}.00</span>
                        </div>
                    </div>
                </CockpitPanel>

                <CockpitPanel class="whats-included">
                    <h3>What's Included</h3>
                    <ul>
                        <li>
                            Full metadata analysis (name, description, keywords)
                        </li>
                        <li>Screenshot review for guideline compliance</li>
                        <li>Privacy manifest deep analysis</li>
                        <li>Info.plist validation</li>
                        <li>Actionable fix recommendations</li>
                    </ul>
                </CockpitPanel>

                {#if errorMsg}
                    <div class="error-msg">{errorMsg}</div>
                {/if}

                {#if !canSubmit}
                    <div class="missing-files-warning">
                        <strong>Missing required files:</strong>
                        {missingFiles.join(", ")}
                    </div>
                {/if}

                <div class="step-actions">
                    <button class="btn btn-secondary" onclick={() => (step = 2)}
                        >Back</button
                    >
                    <div class="action-group">
                        <button
                            class="btn btn-accent"
                            onclick={testSubmit}
                            disabled={loading || !canSubmit}
                        >
                            {loading
                                ? "Analyzing..."
                                : "Test Mode (Skip Payment)"}
                        </button>
                        <button
                            class="btn btn-primary"
                            onclick={submit}
                            disabled={loading || !canSubmit}
                        >
                            {loading ? "Processing..." : "Continue to Payment"}
                        </button>
                    </div>
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
        margin-bottom: 2.5rem;
    }

    .submit-header h1 {
        font-family: "Outfit", sans-serif;
        font-size: 2.2rem;
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
    }

    .progress-container {
        height: 6px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 2px;
        margin-bottom: 3.5rem;
        position: relative;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: var(--accent);
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 1;
    }

    .progress-grid {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
            ),
            linear-gradient(
                0deg,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
            );
        background-size: 10px 100%;
        z-index: 2;
        pointer-events: none;
    }

    .step-content {
        max-width: 600px;
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

    .step-content h2 {
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--gray-100);
    }

    .step-desc {
        font-size: 0.95rem;
        color: var(--gray-400);
        margin-bottom: 2rem;
        line-height: 1.5;
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

    .action-group {
        display: flex;
        gap: 1rem;
    }

    .btn-accent {
        background: linear-gradient(135deg, #d4a853 0%, #c4963d 100%);
        color: var(--bg);
        font-weight: 600;
        border: none;
        padding: 0.875rem 1.75rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s var(--ease);
    }

    .btn-accent:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(212, 168, 83, 0.3);
    }

    .btn-accent:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
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
        padding: 24px !important;
    }

    .summary-grid {
        display: flex;
        flex-direction: column;
        gap: 0;
        border: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(255, 255, 255, 0.01);
    }

    .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .summary-label {
        font-family: "Instrument Mono", monospace;
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--gray-600);
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .summary-value {
        font-family: "Instrument Mono", monospace;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--gray-200);
    }

    .summary-value.status-ready {
        color: #4ade80;
    }
    .summary-value.status-warning {
        color: #fbbf24;
    }

    .summary-item.total {
        background: rgba(212, 168, 83, 0.05);
        border-bottom: none;
    }

    .summary-item.total .summary-label {
        color: var(--accent);
    }

    .summary-item.total .summary-value {
        font-size: 1.25rem;
        color: var(--accent);
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

    .missing-files-warning {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid rgba(245, 158, 11, 0.2);
        border-radius: 8px;
        color: #f59e0b;
        font-size: 0.9rem;
    }

    .missing-files-warning strong {
        font-weight: 600;
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

    /* Loading Overlay */
    .loading-overlay {
        position: fixed;
        inset: 0;
        background: rgba(8, 8, 10, 0.9);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
    }

    .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    .loading-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(212, 168, 83, 0.2);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .loading-text {
        font-size: 1rem;
        color: var(--gray-300);
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
