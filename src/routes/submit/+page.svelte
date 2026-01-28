<script lang="ts">
    import { deserialize } from "$app/forms";
    import { goto } from "$app/navigation";
    import {
        scanProjectFolder,
        formatPath,
        type ScanResults,
    } from "$lib/utils/project-scanner";
    import CockpitPanel from "$lib/components/CockpitPanel.svelte";

    // Props from server
    let { data } = $props();

    // Get pre-fill data from draft or original submission
    const prefill = data.draftSubmission || data.originalSubmission;

    // Track draft ID for updating existing drafts
    let draftId: string | null = $state(data.draftSubmission?.id || null);
    let isEditingDraft = $derived(!!data.draftSubmission);

    let step = $state(1);
    let loading = $state(false);
    let savingDraft = $state(false);
    let draftSaved = $state(false);
    let errorMsg = $state("");

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Your App (Basic Information)
    // ═══════════════════════════════════════════════════════════════
    let appName = $state(prefill?.app_name || "");
    let subtitle = $state(prefill?.subtitle || "");
    let description = $state(prefill?.description || "");
    let promotionalText = $state(prefill?.promotional_text || "");  // 170 chars max
    let keywords = $state(prefill?.keywords || "");
    let category = $state(prefill?.category || "");
    let secondaryCategory = $state(prefill?.secondary_category || "");
    let version = $state(prefill?.version || "1.0");
    let copyright = $state(prefill?.copyright || "");

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Your Files
    // ═══════════════════════════════════════════════════════════════
    let screenshots: File[] = $state([]);
    let appIcon: File | null = $state(null);
    let privacyManifest: File | null = $state(null);
    let infoPlist: File | null = $state(null);

    // Saved file paths from draft (already uploaded to Supabase Storage)
    let savedScreenshotPaths: string[] = $state(prefill?.screenshot_paths || []);
    let savedManifestPath: string | null = $state(prefill?.manifest_path || null);
    let savedPlistPath: string | null = $state(prefill?.plist_path || null);
    let savedIconPath: string | null = $state(prefill?.app_icon_path || null);

    // Combined file counts (new uploads + saved)
    let totalScreenshotCount = $derived(screenshots.length + savedScreenshotPaths.length);
    let hasManifest = $derived(!!privacyManifest || !!savedManifestPath);
    let hasPlist = $derived(!!infoPlist || !!savedPlistPath);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Settings & Access - Collapsible Sections
    // ═══════════════════════════════════════════════════════════════

    // Collapse states for accordion sections
    let urlsExpanded = $state(true);
    let ageRatingExpanded = $state(false);
    let privacyExpanded = $state(false);
    let reviewAccessExpanded = $state(false);

    // URLs (Apple validates these are reachable)
    let privacyUrl = $state(prefill?.privacy_url || "");
    let supportUrl = $state(prefill?.support_url || "");
    let marketingUrl = $state(prefill?.marketing_url || "");

    // Age Rating Questionnaire - Each answer: "none", "infrequent", "frequent"
    const defaultAgeRatingAnswers = {
        cartoonViolence: "none",
        realisticViolence: "none",
        prolongedViolence: "none",
        sexualContentNudity: "none",
        matureSuggestive: "none",
        profanityCrudeHumor: "none",
        alcoholTobaccoDrugs: "none",
        gamblingSimulated: "none",
        horrorFear: "none",
        medicalTreatment: "none",
        gamblingContests: "none",
        unrestrictedWebAccess: false,
        madeForKids: false,
    };
    const savedAgeRatingAnswers = prefill?.age_rating_answers
        ? (() => { try { return JSON.parse(prefill.age_rating_answers); } catch { return null; } })()
        : null;
    let ageRatingAnswers = $state(savedAgeRatingAnswers || defaultAgeRatingAnswers);

    // Calculated age rating based on answers
    let calculatedAgeRating = $derived.by(() => {
        const a = ageRatingAnswers;
        // 17+ triggers
        if (a.prolongedViolence === "frequent" ||
            a.sexualContentNudity === "frequent" ||
            a.gamblingSimulated === "frequent") return "17+";
        // 12+ triggers
        if (a.realisticViolence !== "none" ||
            a.sexualContentNudity !== "none" ||
            a.matureSuggestive === "frequent" ||
            a.alcoholTobaccoDrugs === "frequent" ||
            a.gamblingSimulated !== "none") return "12+";
        // 9+ triggers
        if (a.cartoonViolence === "frequent" ||
            a.matureSuggestive !== "none" ||
            a.profanityCrudeHumor === "frequent" ||
            a.horrorFear === "frequent") return "9+";
        // Default 4+
        return "4+";
    });

    // App Privacy (Data Collection) - Must match Privacy Manifest or Apple rejects
    const defaultDataCollection = {
        contactInfo: { collected: false, linked: false, tracking: false },
        healthFitness: { collected: false, linked: false, tracking: false },
        financialInfo: { collected: false, linked: false, tracking: false },
        locationData: { collected: false, linked: false, tracking: false },
        sensitiveInfo: { collected: false, linked: false, tracking: false },
        contacts: { collected: false, linked: false, tracking: false },
        userContent: { collected: false, linked: false, tracking: false },
        browsingHistory: { collected: false, linked: false, tracking: false },
        searchHistory: { collected: false, linked: false, tracking: false },
        identifiers: { collected: false, linked: false, tracking: false },
        purchases: { collected: false, linked: false, tracking: false },
        usageData: { collected: false, linked: false, tracking: false },
        diagnostics: { collected: false, linked: false, tracking: false },
    };
    const savedDataCollection = prefill?.data_collection
        ? (() => { try { return JSON.parse(prefill.data_collection); } catch { return null; } })()
        : null;
    let dataCollection = $state(savedDataCollection || defaultDataCollection);

    // In-App Purchases & Monetization
    let hasInAppPurchases = $state(prefill?.has_iap || false);
    let hasSubscriptions = $state(prefill?.has_subscriptions || false);
    let hasAds = $state(prefill?.has_ads || false);
    let hasThirdPartyLogin = $state(prefill?.has_third_party_login || false);

    // App Review Information (Demo credentials)
    let signInRequired = $state(prefill?.sign_in_required || false);
    let demoUsername = $state(prefill?.demo_username || "");
    let demoPassword = $state(prefill?.demo_password || "");
    let reviewNotes = $state(prefill?.review_notes || "");
    const reviewerContactPrefill = prefill?.reviewer_contact ? JSON.parse(prefill.reviewer_contact) : null;
    let reviewerContact = $state({
        firstName: reviewerContactPrefill?.firstName || "",
        lastName: reviewerContactPrefill?.lastName || "",
        phone: reviewerContactPrefill?.phone || "",
        email: reviewerContactPrefill?.email || "",
    });

    // Pricing (single tier for now)
    const PRICE = 49;

    // Required files validation
    let missingFiles = $derived.by(() => {
        const missing: string[] = [];
        if (screenshots.length === 0 && savedScreenshotPaths.length === 0) missing.push("At least 1 screenshot");
        if (!privacyManifest && !savedManifestPath) missing.push("Privacy manifest (PrivacyInfo.xcprivacy)");
        if (!infoPlist && !savedPlistPath) missing.push("Info.plist");
        return missing;
    });

    // Step validation (updated for 4 steps)
    let step1Valid = $derived(
        appName.trim().length > 0 &&
        appName.trim().length <= 30 &&
        description.trim().length > 0 &&
        category !== ""
    );

    let step2Valid = $derived(missingFiles.length === 0);

    let step3Valid = $derived(
        privacyUrl.trim().length > 0 &&
        supportUrl.trim().length > 0 &&
        (!signInRequired || (demoUsername.trim().length > 0 && demoPassword.trim().length > 0))
    );

    let canSubmit = $derived(step1Valid && step2Valid && step3Valid);

    // Character count helpers
    let appNameCount = $derived(appName.length);
    let subtitleCount = $derived(subtitle.length);
    let promotionalTextCount = $derived(promotionalText.length);
    let keywordsCount = $derived(keywords.length);
    let descriptionCount = $derived(description.length);

    // Project scanner state
    let scanResults: ScanResults | null = $state(null);
    let showScanResults = $state(false);
    let scanning = $state(false);
    let scanProgress = $state("");
    let applyingFiles = $state(false);

    // Step labels for the progress indicator
    const stepLabels = ["Your App", "Your Files", "Settings & Access", "Review & Submit"];

    function handleFolderSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const fileCount = input.files.length;
        scanning = true;
        scanProgress = `Scanning ${fileCount.toLocaleString()} files...`;

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

    function getFilename(path: string): string {
        return path.split('/').pop() || path;
    }

    function handleScreenshots(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files) {
            const maxNew = 10 - savedScreenshotPaths.length;
            screenshots = [...screenshots, ...Array.from(input.files)].slice(0, maxNew);
        }
    }

    function removeScreenshot(index: number) {
        screenshots = screenshots.filter((_, i) => i !== index);
    }

    function removeSavedScreenshot(index: number) {
        savedScreenshotPaths = savedScreenshotPaths.filter((_, i) => i !== index);
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

    function handleIcon(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.[0]) {
            appIcon = input.files[0];
        }
    }

    async function submit() {
        if (!canSubmit) {
            errorMsg = `Missing required fields or files`;
            return;
        }

        loading = true;
        errorMsg = "";

        try {
            const createForm = new FormData();

            // Basic Info
            createForm.set("app_name", appName);
            createForm.set("subtitle", subtitle);
            createForm.set("description", description);
            createForm.set("promotional_text", promotionalText);
            createForm.set("keywords", keywords);
            createForm.set("category", category);
            createForm.set("secondary_category", secondaryCategory);
            createForm.set("version", version);
            createForm.set("copyright", copyright);

            // URLs
            createForm.set("privacy_url", privacyUrl);
            createForm.set("support_url", supportUrl);
            createForm.set("marketing_url", marketingUrl);

            // Age Rating
            createForm.set("age_rating", calculatedAgeRating);
            createForm.set("age_rating_answers", JSON.stringify(ageRatingAnswers));

            // App Privacy / Data Collection
            createForm.set("data_collection", JSON.stringify(dataCollection));

            // App Review Info
            createForm.set("sign_in_required", signInRequired.toString());
            createForm.set("demo_username", demoUsername);
            createForm.set("demo_password", demoPassword);
            createForm.set("review_notes", reviewNotes);
            createForm.set("reviewer_contact", JSON.stringify(reviewerContact));

            // Monetization & Login
            createForm.set("has_iap", hasInAppPurchases.toString());
            createForm.set("has_subscriptions", hasSubscriptions.toString());
            createForm.set("has_ads", hasAds.toString());
            createForm.set("has_third_party_login", hasThirdPartyLogin.toString());

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

            // Upload files
            if (screenshots.length > 0 || privacyManifest || infoPlist || appIcon) {
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
                if (appIcon) {
                    uploadForm.set("icon", appIcon);
                }

                await fetch("/submit?/uploadFiles", {
                    method: "POST",
                    body: uploadForm,
                });
            }

            // Redirect to Stripe checkout
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
        if (!canSubmit) {
            errorMsg = `Missing required fields or files`;
            return;
        }

        loading = true;
        errorMsg = "";

        try {
            const formData = new FormData();

            // Pass draft ID if editing existing (server will UPDATE instead of INSERT)
            if (draftId) {
                formData.set("draft_id", draftId);
            }

            // Basic Info
            formData.set("app_name", appName);
            formData.set("subtitle", subtitle);
            formData.set("description", description);
            formData.set("promotional_text", promotionalText);
            formData.set("keywords", keywords);
            formData.set("category", category);
            formData.set("secondary_category", secondaryCategory);
            formData.set("version", version);
            formData.set("copyright", copyright);

            // URLs
            formData.set("privacy_url", privacyUrl);
            formData.set("support_url", supportUrl);
            formData.set("marketing_url", marketingUrl);

            // Age Rating
            formData.set("age_rating", calculatedAgeRating);
            formData.set("age_rating_answers", JSON.stringify(ageRatingAnswers));

            // App Privacy
            formData.set("data_collection", JSON.stringify(dataCollection));

            // App Review Info
            formData.set("sign_in_required", signInRequired.toString());
            formData.set("demo_username", demoUsername);
            formData.set("demo_password", demoPassword);
            formData.set("review_notes", reviewNotes);
            formData.set("reviewer_contact", JSON.stringify(reviewerContact));

            // Monetization & Login
            formData.set("has_iap", hasInAppPurchases.toString());
            formData.set("has_subscriptions", hasSubscriptions.toString());
            formData.set("has_ads", hasAds.toString());
            formData.set("has_third_party_login", hasThirdPartyLogin.toString());

            // Already-saved file paths (so server keeps them)
            formData.set("saved_screenshot_paths", JSON.stringify(savedScreenshotPaths));
            if (savedManifestPath) formData.set("saved_manifest_path", savedManifestPath);
            if (savedPlistPath) formData.set("saved_plist_path", savedPlistPath);
            if (savedIconPath) formData.set("saved_icon_path", savedIconPath);

            // New files only
            for (const file of screenshots) {
                formData.append("screenshots", file);
            }
            if (privacyManifest) {
                formData.set("manifest", privacyManifest);
            }
            if (infoPlist) {
                formData.set("plist", infoPlist);
            }
            if (appIcon) {
                formData.set("icon", appIcon);
            }

            const response = await fetch("/submit?/testSubmit", {
                method: "POST",
                body: formData,
            });

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

    async function saveDraft() {
        savingDraft = true;
        draftSaved = false;
        errorMsg = "";

        try {
            const formData = new FormData();

            // Include draft ID if editing existing
            if (draftId) {
                formData.set("draft_id", draftId);
            }

            // Basic Info
            formData.set("app_name", appName);
            formData.set("subtitle", subtitle);
            formData.set("description", description);
            formData.set("promotional_text", promotionalText);
            formData.set("keywords", keywords);
            formData.set("category", category);
            formData.set("secondary_category", secondaryCategory);
            formData.set("version", version);
            formData.set("copyright", copyright);

            // URLs
            formData.set("privacy_url", privacyUrl);
            formData.set("support_url", supportUrl);
            formData.set("marketing_url", marketingUrl);

            // Age Rating
            formData.set("age_rating", calculatedAgeRating);
            formData.set("age_rating_answers", JSON.stringify(ageRatingAnswers));

            // App Privacy
            formData.set("data_collection", JSON.stringify(dataCollection));

            // App Review Info
            formData.set("sign_in_required", signInRequired.toString());
            formData.set("demo_username", demoUsername);
            formData.set("demo_password", demoPassword);
            formData.set("review_notes", reviewNotes);
            formData.set("reviewer_contact", JSON.stringify(reviewerContact));

            // Monetization & Login
            formData.set("has_iap", hasInAppPurchases.toString());
            formData.set("has_subscriptions", hasSubscriptions.toString());
            formData.set("has_ads", hasAds.toString());
            formData.set("has_third_party_login", hasThirdPartyLogin.toString());

            // Already-saved file paths (so server knows what to keep)
            formData.set("saved_screenshot_paths", JSON.stringify(savedScreenshotPaths));
            if (savedManifestPath) formData.set("saved_manifest_path", savedManifestPath);
            if (savedPlistPath) formData.set("saved_plist_path", savedPlistPath);
            if (savedIconPath) formData.set("saved_icon_path", savedIconPath);

            // New files only
            for (const file of screenshots) {
                formData.append("screenshots", file);
            }
            if (privacyManifest) {
                formData.set("manifest", privacyManifest);
            }
            if (infoPlist) {
                formData.set("plist", infoPlist);
            }
            if (appIcon) {
                formData.set("icon", appIcon);
            }

            const response = await fetch("/submit?/saveDraft", {
                method: "POST",
                body: formData,
            });

            const result = await response.text();
            const parsedResult = deserialize(result);

            if (parsedResult.type === "failure") {
                throw new Error(
                    (parsedResult.data as { message?: string })?.message ||
                        "Failed to save draft",
                );
            }

            if (parsedResult.type === "success" && parsedResult.data) {
                const resultData = parsedResult.data as { draftId?: string; message?: string };
                // Update draftId if this was a new draft
                if (resultData.draftId) {
                    draftId = resultData.draftId;
                    // Update URL to include draft parameter without navigation
                    const url = new URL(window.location.href);
                    url.searchParams.set("draft", draftId);
                    window.history.replaceState({}, "", url.toString());
                }
                draftSaved = true;
                // Clear the saved indicator after 3 seconds
                setTimeout(() => { draftSaved = false; }, 3000);
            }
        } catch (err) {
            errorMsg =
                err instanceof Error ? err.message : "Failed to save draft";
        } finally {
            savingDraft = false;
        }
    }
</script>

<main class="submit-page">
    <div class="container">
        <header class="submit-header">
            <h1>Pre-Flight Check</h1>
            {#if isEditingDraft}
                <div class="draft-badge">
                    <span>Editing Draft: {appName || "Untitled"}</span>
                </div>
            {:else}
                <p class="subtitle">We'll analyze everything Apple checks - so you catch issues before they do.</p>
            {/if}
        </header>

        <!-- Simple Progress Indicator -->
        <div class="progress-indicator">
            <span class="progress-text">Step {step} of 4</span>
            <span class="progress-divider">·</span>
            <span class="progress-label">{stepLabels[step - 1]}</span>
        </div>

        {#if step === 1}
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <!-- STEP 1: Your App -->
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <CockpitPanel class="step-content">
                <div class="step-intro">
                    <h2>Your App</h2>
                    <p class="step-reassurance">Let's start with the basics. This is how your app will appear on the App Store.</p>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="appName" class="form-label">
                            App Name <span class="required">*</span>
                            <span class="char-count" class:over={appNameCount > 30}>{appNameCount}/30</span>
                        </label>
                        <input
                            type="text"
                            id="appName"
                            class="input"
                            bind:value={appName}
                            maxlength="30"
                            required
                            placeholder="Your app's name"
                        />
                    </div>

                    <div class="form-group">
                        <label for="subtitle" class="form-label">
                            Subtitle
                            <span class="char-count" class:over={subtitleCount > 30}>{subtitleCount}/30</span>
                        </label>
                        <input
                            type="text"
                            id="subtitle"
                            class="input"
                            bind:value={subtitle}
                            maxlength="30"
                            placeholder="Brief tagline"
                        />
                    </div>
                </div>

                <div class="form-group">
                    <label for="promotionalText" class="form-label">
                        Promotional Text
                        <span class="char-count" class:over={promotionalTextCount > 170}>{promotionalTextCount}/170</span>
                    </label>
                    <textarea
                        id="promotionalText"
                        class="input textarea"
                        bind:value={promotionalText}
                        maxlength="170"
                        rows="2"
                        placeholder="Short promotional message (can be updated without new app version)"
                    ></textarea>
                    <p class="field-hint">This appears above your description and can be changed anytime.</p>
                </div>

                <div class="form-group">
                    <label for="description" class="form-label">
                        Description <span class="required">*</span>
                        <span class="char-count" class:over={descriptionCount > 4000}>{descriptionCount}/4000</span>
                    </label>
                    <textarea
                        id="description"
                        class="input textarea"
                        bind:value={description}
                        maxlength="4000"
                        rows="6"
                        required
                        placeholder="Describe your app's features and functionality..."
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="keywords" class="form-label">
                        Keywords
                        <span class="char-count" class:over={keywordsCount > 100}>{keywordsCount}/100</span>
                    </label>
                    <input
                        type="text"
                        id="keywords"
                        class="input"
                        bind:value={keywords}
                        maxlength="100"
                        placeholder="budget,finance,tracker,money (comma separated)"
                    />
                    <p class="field-hint">Separate with commas. Don't repeat your app name or category.</p>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="category" class="form-label">Primary Category <span class="required">*</span></label>
                        <select id="category" class="input" bind:value={category}>
                            <option value="">Select category</option>
                            <option value="books">Books</option>
                            <option value="business">Business</option>
                            <option value="developer-tools">Developer Tools</option>
                            <option value="education">Education</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="finance">Finance</option>
                            <option value="food-drink">Food & Drink</option>
                            <option value="games">Games</option>
                            <option value="graphics-design">Graphics & Design</option>
                            <option value="health-fitness">Health & Fitness</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="magazines-newspapers">Magazines & Newspapers</option>
                            <option value="medical">Medical</option>
                            <option value="music">Music</option>
                            <option value="navigation">Navigation</option>
                            <option value="news">News</option>
                            <option value="photo-video">Photo & Video</option>
                            <option value="productivity">Productivity</option>
                            <option value="reference">Reference</option>
                            <option value="shopping">Shopping</option>
                            <option value="social-networking">Social Networking</option>
                            <option value="sports">Sports</option>
                            <option value="travel">Travel</option>
                            <option value="utilities">Utilities</option>
                            <option value="weather">Weather</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="secondaryCategory" class="form-label">Secondary Category</label>
                        <select id="secondaryCategory" class="input" bind:value={secondaryCategory}>
                            <option value="">None</option>
                            <option value="books">Books</option>
                            <option value="business">Business</option>
                            <option value="developer-tools">Developer Tools</option>
                            <option value="education">Education</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="finance">Finance</option>
                            <option value="food-drink">Food & Drink</option>
                            <option value="games">Games</option>
                            <option value="graphics-design">Graphics & Design</option>
                            <option value="health-fitness">Health & Fitness</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="magazines-newspapers">Magazines & Newspapers</option>
                            <option value="medical">Medical</option>
                            <option value="music">Music</option>
                            <option value="navigation">Navigation</option>
                            <option value="news">News</option>
                            <option value="photo-video">Photo & Video</option>
                            <option value="productivity">Productivity</option>
                            <option value="reference">Reference</option>
                            <option value="shopping">Shopping</option>
                            <option value="social-networking">Social Networking</option>
                            <option value="sports">Sports</option>
                            <option value="travel">Travel</option>
                            <option value="utilities">Utilities</option>
                            <option value="weather">Weather</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="version" class="form-label">Version</label>
                        <input
                            type="text"
                            id="version"
                            class="input"
                            bind:value={version}
                            placeholder="1.0"
                        />
                    </div>
                    <div class="form-group">
                        <label for="copyright" class="form-label">Copyright</label>
                        <input
                            type="text"
                            id="copyright"
                            class="input"
                            bind:value={copyright}
                            placeholder="2026 Your Name or Company"
                        />
                    </div>
                </div>

                <div class="step-actions">
                    <a href="/dashboard" class="btn btn-secondary">Cancel</a>
                    <div class="action-group">
                        <button
                            class="btn btn-outline"
                            onclick={saveDraft}
                            disabled={savingDraft || loading}
                        >
                            {#if savingDraft}
                                Saving...
                            {:else if draftSaved}
                                Saved
                            {:else}
                                Save Draft
                            {/if}
                        </button>
                        <button
                            class="btn btn-primary"
                            onclick={() => (step = 2)}
                            disabled={!step1Valid}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </CockpitPanel>

        {:else if step === 2}
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <!-- STEP 2: Your Files -->
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <CockpitPanel class="step-content">
                <div class="step-intro">
                    <h2>Your Files</h2>
                    <p class="step-reassurance">Upload your files and we'll analyze them for common issues.</p>
                </div>

                <div class="form-group">
                    <label class="form-label">Screenshots <span class="required">*</span> ({totalScreenshotCount}/10)</label>
                    {#if totalScreenshotCount < 10}
                        <div class="file-upload">
                            <input type="file" accept="image/*" multiple onchange={handleScreenshots} />
                            <p>Drop screenshots here or click to browse</p>
                        </div>
                    {/if}

                    {#if savedScreenshotPaths.length > 0 || screenshots.length > 0}
                        <div class="screenshot-previews">
                            {#each savedScreenshotPaths as path, i}
                                <div class="screenshot-preview saved">
                                    <div class="screenshot-saved-placeholder">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <path d="M21 15l-5-5L5 21" />
                                        </svg>
                                    </div>
                                    <button class="screenshot-remove" onclick={() => removeSavedScreenshot(i)} title="Remove">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                    <span class="screenshot-name">{getFilename(path)}</span>
                                </div>
                            {/each}
                            {#each screenshots as file, i}
                                <div class="screenshot-preview">
                                    <img src={URL.createObjectURL(file)} alt={file.name} />
                                    <button class="screenshot-remove" onclick={() => removeScreenshot(i)} title="Remove">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                    <span class="screenshot-name">{file.name}</span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div class="config-files-section">
                    <div class="config-header">
                        <div>
                            <h3>Technical Files</h3>
                            <p class="step-desc">Info.plist and Privacy Manifest</p>
                        </div>
                        <label class="btn btn-secondary btn-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            {scanning ? "Scanning..." : "Scan Project"}
                            <input type="file" webkitdirectory onchange={handleFolderSelect} disabled={scanning} style="display: none;" />
                        </label>
                    </div>

                    <div class="config-files-list">
                        <div class="config-file-row">
                            <div class="config-file-info">
                                <strong>Info.plist</strong>
                                <span class="required">*</span>
                            </div>
                            {#if infoPlist}
                                <div class="config-file-status success">
                                    <span>{infoPlist.name}</span>
                                    <button class="remove-btn" onclick={() => (infoPlist = null)}>×</button>
                                </div>
                            {:else if savedPlistPath}
                                <div class="config-file-status success">
                                    <span>{getFilename(savedPlistPath)}</span>
                                    <button class="remove-btn" onclick={() => (savedPlistPath = null)}>×</button>
                                </div>
                            {:else}
                                <label class="config-file-status empty">
                                    <span>Not added</span>
                                    <span class="upload-link">upload</span>
                                    <input type="file" accept=".plist,.xml" onchange={handlePlist} style="display: none;" />
                                </label>
                            {/if}
                        </div>

                        <div class="config-file-row">
                            <div class="config-file-info">
                                <strong>Privacy Manifest</strong>
                                <span class="required">*</span>
                            </div>
                            {#if privacyManifest}
                                <div class="config-file-status success">
                                    <span>{privacyManifest.name}</span>
                                    <button class="remove-btn" onclick={() => (privacyManifest = null)}>×</button>
                                </div>
                            {:else if savedManifestPath}
                                <div class="config-file-status success">
                                    <span>{getFilename(savedManifestPath)}</span>
                                    <button class="remove-btn" onclick={() => (savedManifestPath = null)}>×</button>
                                </div>
                            {:else}
                                <label class="config-file-status empty">
                                    <span>Not added</span>
                                    <span class="upload-link">upload</span>
                                    <input type="file" accept=".xcprivacy,.plist,.xml" onchange={handleManifest} style="display: none;" />
                                </label>
                            {/if}
                        </div>

                        <div class="config-file-row">
                            <div class="config-file-info">
                                <strong>App Icon</strong>
                            </div>
                            {#if appIcon}
                                <div class="config-file-status success">
                                    <span>{appIcon.name}</span>
                                    <button class="remove-btn" onclick={() => (appIcon = null)}>×</button>
                                </div>
                            {:else if savedIconPath}
                                <div class="config-file-status success">
                                    <span>{getFilename(savedIconPath)}</span>
                                    <button class="remove-btn" onclick={() => (savedIconPath = null)}>×</button>
                                </div>
                            {:else}
                                <label class="config-file-status empty">
                                    <span>Not added</span>
                                    <span class="upload-link">upload</span>
                                    <input type="file" accept="image/*" onchange={handleIcon} style="display: none;" />
                                </label>
                            {/if}
                        </div>
                    </div>
                </div>

                {#if missingFiles.length > 0}
                    <div class="missing-files-warning">
                        <strong>Missing required files:</strong> {missingFiles.join(", ")}
                    </div>
                {/if}

                <div class="step-actions">
                    <button class="btn btn-secondary" onclick={() => (step = 1)}>Back</button>
                    <div class="action-group">
                        <button
                            class="btn btn-outline"
                            onclick={saveDraft}
                            disabled={savingDraft || loading}
                        >
                            {#if savingDraft}
                                Saving...
                            {:else if draftSaved}
                                Saved
                            {:else}
                                Save Draft
                            {/if}
                        </button>
                        <button class="btn btn-primary" onclick={() => (step = 3)} disabled={!step2Valid}>Continue</button>
                    </div>
                </div>
            </CockpitPanel>

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
                                        <span class="result-path">{formatPath(scanResults.infoPlistPath || "")}</span>
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
                                        <span class="result-path">{formatPath(scanResults.privacyManifestPath || "")}</span>
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
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <!-- STEP 3: Settings & Access (Collapsible Sections) -->
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <CockpitPanel class="step-content">
                <div class="step-intro">
                    <h2>Settings & Access</h2>
                    <p class="step-reassurance">A few settings to match what Apple expects. We'll flag anything that looks off.</p>
                </div>

                <!-- URLs Section -->
                <div class="collapsible-section">
                    <button
                        class="collapsible-header"
                        class:expanded={urlsExpanded}
                        onclick={() => urlsExpanded = !urlsExpanded}
                    >
                        <div class="collapsible-title">
                            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                            <span>URLs</span>
                            <span class="section-hint">Privacy Policy, Support, Marketing</span>
                        </div>
                        <div class="section-status" class:complete={privacyUrl && supportUrl}>
                            {#if privacyUrl && supportUrl}
                                <span class="status-complete">✓</span>
                            {:else}
                                <span class="status-required">Required</span>
                            {/if}
                        </div>
                    </button>
                    {#if urlsExpanded}
                        <div class="collapsible-content">
                            <div class="form-group">
                                <label for="privacyUrl" class="form-label">Privacy Policy URL <span class="required">*</span></label>
                                <input
                                    type="url"
                                    id="privacyUrl"
                                    class="input"
                                    bind:value={privacyUrl}
                                    placeholder="https://yourapp.com/privacy"
                                    required
                                />
                                <p class="field-hint">Required for all apps. Must be accessible without login.</p>
                            </div>

                            <div class="form-group">
                                <label for="supportUrl" class="form-label">Support URL <span class="required">*</span></label>
                                <input
                                    type="url"
                                    id="supportUrl"
                                    class="input"
                                    bind:value={supportUrl}
                                    placeholder="https://yourapp.com/support"
                                    required
                                />
                                <p class="field-hint">Where users can get help. Must be reachable.</p>
                            </div>

                            <div class="form-group">
                                <label for="marketingUrl" class="form-label">Marketing URL</label>
                                <input
                                    type="url"
                                    id="marketingUrl"
                                    class="input"
                                    bind:value={marketingUrl}
                                    placeholder="https://yourapp.com (optional)"
                                />
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Age Rating Section -->
                <div class="collapsible-section">
                    <button
                        class="collapsible-header"
                        class:expanded={ageRatingExpanded}
                        onclick={() => ageRatingExpanded = !ageRatingExpanded}
                    >
                        <div class="collapsible-title">
                            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                            <span>Age Rating</span>
                            <span class="section-hint">Content questionnaire</span>
                        </div>
                        <div class="section-status complete">
                            <span class="rating-badge">{calculatedAgeRating}</span>
                        </div>
                    </button>
                    {#if ageRatingExpanded}
                        <div class="collapsible-content">
                            <div class="age-rating-result">
                                <span class="rating-label">Calculated Rating:</span>
                                <span class="rating-value">{calculatedAgeRating}</span>
                            </div>

                            <div class="age-questions">
                                <div class="age-question">
                                    <label>Cartoon or Fantasy Violence</label>
                                    <select class="input" bind:value={ageRatingAnswers.cartoonViolence}>
                                        <option value="none">None</option>
                                        <option value="infrequent">Infrequent/Mild</option>
                                        <option value="frequent">Frequent/Intense</option>
                                    </select>
                                </div>

                                <div class="age-question">
                                    <label>Realistic Violence</label>
                                    <select class="input" bind:value={ageRatingAnswers.realisticViolence}>
                                        <option value="none">None</option>
                                        <option value="infrequent">Infrequent/Mild</option>
                                        <option value="frequent">Frequent/Intense</option>
                                    </select>
                                </div>

                                <div class="age-question">
                                    <label>Prolonged Graphic or Sadistic Violence</label>
                                    <select class="input" bind:value={ageRatingAnswers.prolongedViolence}>
                                        <option value="none">None</option>
                                        <option value="infrequent">Infrequent/Mild</option>
                                        <option value="frequent">Frequent/Intense</option>
                                    </select>
                                </div>

                                <div class="age-question">
                                    <label>Sexual Content or Nudity</label>
                                    <select class="input" bind:value={ageRatingAnswers.sexualContentNudity}>
                                        <option value="none">None</option>
                                        <option value="infrequent">Infrequent/Mild</option>
                                        <option value="frequent">Frequent/Intense</option>
                                    </select>
                                </div>

                                <div class="age-question">
                                    <label>Mature/Suggestive Themes</label>
                                    <select class="input" bind:value={ageRatingAnswers.matureSuggestive}>
                                        <option value="none">None</option>
                                        <option value="infrequent">Infrequent/Mild</option>
                                        <option value="frequent">Frequent/Intense</option>
                                    </select>
                                </div>

                                <div class="age-question">
                                    <label>Profanity or Crude Humor</label>
                                    <select class="input" bind:value={ageRatingAnswers.profanityCrudeHumor}>
                                        <option value="none">None</option>
                                        <option value="infrequent">Infrequent/Mild</option>
                                        <option value="frequent">Frequent/Intense</option>
                                    </select>
                                </div>

                                <div class="age-question">
                                    <label>Alcohol, Tobacco, or Drug Use/References</label>
                                    <select class="input" bind:value={ageRatingAnswers.alcoholTobaccoDrugs}>
                                        <option value="none">None</option>
                                        <option value="infrequent">Infrequent/Mild</option>
                                        <option value="frequent">Frequent/Intense</option>
                                    </select>
                                </div>

                                <div class="age-question">
                                    <label>Simulated Gambling</label>
                                    <select class="input" bind:value={ageRatingAnswers.gamblingSimulated}>
                                        <option value="none">None</option>
                                        <option value="infrequent">Infrequent/Mild</option>
                                        <option value="frequent">Frequent/Intense</option>
                                    </select>
                                </div>

                                <div class="age-question">
                                    <label>Horror/Fear Themes</label>
                                    <select class="input" bind:value={ageRatingAnswers.horrorFear}>
                                        <option value="none">None</option>
                                        <option value="infrequent">Infrequent/Mild</option>
                                        <option value="frequent">Frequent/Intense</option>
                                    </select>
                                </div>

                                <div class="age-question">
                                    <label>Medical/Treatment Information</label>
                                    <select class="input" bind:value={ageRatingAnswers.medicalTreatment}>
                                        <option value="none">None</option>
                                        <option value="infrequent">Infrequent/Mild</option>
                                        <option value="frequent">Frequent/Intense</option>
                                    </select>
                                </div>

                                <div class="age-question checkbox-question">
                                    <label>
                                        <input type="checkbox" bind:checked={ageRatingAnswers.unrestrictedWebAccess} />
                                        <span>Unrestricted Web Access</span>
                                    </label>
                                    <p class="field-hint">App contains a browser or allows access to arbitrary URLs</p>
                                </div>

                                <div class="age-question checkbox-question">
                                    <label>
                                        <input type="checkbox" bind:checked={ageRatingAnswers.madeForKids} />
                                        <span>Made for Kids</span>
                                    </label>
                                    <p class="field-hint">Primary audience is children under 13 (triggers COPPA requirements)</p>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Privacy & Data Collection Section -->
                <div class="collapsible-section">
                    <button
                        class="collapsible-header"
                        class:expanded={privacyExpanded}
                        onclick={() => privacyExpanded = !privacyExpanded}
                    >
                        <div class="collapsible-title">
                            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                            <span>Privacy & Data Collection</span>
                            <span class="section-hint">App privacy labels, monetization</span>
                        </div>
                        <div class="section-status complete">
                            <span class="status-complete">✓</span>
                        </div>
                    </button>
                    {#if privacyExpanded}
                        <div class="collapsible-content">
                            <p class="section-intro">Declare what data your app collects. This must match your Privacy Manifest.</p>

                            <div class="privacy-grid">
                                {#each Object.entries(dataCollection) as [key, value]}
                                    {@const labels: Record<string, string> = {
                                        contactInfo: "Contact Info",
                                        healthFitness: "Health & Fitness",
                                        financialInfo: "Financial Info",
                                        locationData: "Location",
                                        sensitiveInfo: "Sensitive Info",
                                        contacts: "Contacts",
                                        userContent: "User Content",
                                        browsingHistory: "Browsing History",
                                        searchHistory: "Search History",
                                        identifiers: "Identifiers",
                                        purchases: "Purchases",
                                        usageData: "Usage Data",
                                        diagnostics: "Diagnostics"
                                    }}
                                    <div class="privacy-row">
                                        <span class="privacy-label">{labels[key]}</span>
                                        <label class="privacy-checkbox">
                                            <input type="checkbox" bind:checked={dataCollection[key].collected} />
                                            <span>Collected</span>
                                        </label>
                                        <label class="privacy-checkbox" class:disabled={!dataCollection[key].collected}>
                                            <input type="checkbox" bind:checked={dataCollection[key].linked} disabled={!dataCollection[key].collected} />
                                            <span>Linked to User</span>
                                        </label>
                                        <label class="privacy-checkbox" class:disabled={!dataCollection[key].collected}>
                                            <input type="checkbox" bind:checked={dataCollection[key].tracking} disabled={!dataCollection[key].collected} />
                                            <span>Used for Tracking</span>
                                        </label>
                                    </div>
                                {/each}
                            </div>

                            <div class="monetization-section">
                                <h3>Monetization & Login</h3>
                                <div class="checkbox-row">
                                    <label class="checkbox-label">
                                        <input type="checkbox" bind:checked={hasInAppPurchases} />
                                        <span>In-App Purchases</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" bind:checked={hasSubscriptions} />
                                        <span>Subscriptions</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" bind:checked={hasAds} />
                                        <span>Contains Advertising</span>
                                    </label>
                                </div>
                                <div class="checkbox-row" style="margin-top: 12px;">
                                    <label class="checkbox-label">
                                        <input type="checkbox" bind:checked={hasThirdPartyLogin} />
                                        <span>Third-Party Login (Google, Facebook, etc.)</span>
                                    </label>
                                </div>
                                {#if hasThirdPartyLogin}
                                    <p class="field-hint warning-hint">
                                        Apps with third-party login must also offer Sign in with Apple (Guideline 4.8)
                                    </p>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Review Access Section -->
                <div class="collapsible-section">
                    <button
                        class="collapsible-header"
                        class:expanded={reviewAccessExpanded}
                        onclick={() => reviewAccessExpanded = !reviewAccessExpanded}
                    >
                        <div class="collapsible-title">
                            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                            <span>Review Access</span>
                            <span class="section-hint">Demo credentials, reviewer notes</span>
                        </div>
                        <div class="section-status" class:complete={!signInRequired || (demoUsername && demoPassword)}>
                            {#if signInRequired && (!demoUsername || !demoPassword)}
                                <span class="status-required">Credentials needed</span>
                            {:else}
                                <span class="status-complete">✓</span>
                            {/if}
                        </div>
                    </button>
                    {#if reviewAccessExpanded}
                        <div class="collapsible-content">
                            <div class="signin-section">
                                <label class="checkbox-label prominent">
                                    <input type="checkbox" bind:checked={signInRequired} />
                                    <span>Sign-in required to use app</span>
                                </label>

                                {#if signInRequired}
                                    <div class="demo-credentials">
                                        <p class="warning-hint">
                                            Missing demo credentials is the #1 rejection reason for apps with login. Apple's reviewer will need these to actually test your app.
                                        </p>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="demoUsername" class="form-label">Demo Username <span class="required">*</span></label>
                                                <input
                                                    type="text"
                                                    id="demoUsername"
                                                    class="input"
                                                    bind:value={demoUsername}
                                                    placeholder="demo@example.com"
                                                    required
                                                />
                                            </div>
                                            <div class="form-group">
                                                <label for="demoPassword" class="form-label">Demo Password <span class="required">*</span></label>
                                                <input
                                                    type="text"
                                                    id="demoPassword"
                                                    class="input"
                                                    bind:value={demoPassword}
                                                    placeholder="DemoPassword123"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>

                            <div class="form-group">
                                <label for="reviewNotes" class="form-label">Notes for App Review</label>
                                <textarea
                                    id="reviewNotes"
                                    class="input textarea"
                                    bind:value={reviewNotes}
                                    rows="3"
                                    placeholder="Any special instructions for the reviewer..."
                                ></textarea>
                                <p class="field-hint">Use this to explain anything non-obvious.</p>
                            </div>

                            <div class="contact-section">
                                <h3>Reviewer Contact (Optional)</h3>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="contactFirst" class="form-label">First Name</label>
                                        <input type="text" id="contactFirst" class="input" bind:value={reviewerContact.firstName} />
                                    </div>
                                    <div class="form-group">
                                        <label for="contactLast" class="form-label">Last Name</label>
                                        <input type="text" id="contactLast" class="input" bind:value={reviewerContact.lastName} />
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="contactPhone" class="form-label">Phone</label>
                                        <input type="tel" id="contactPhone" class="input" bind:value={reviewerContact.phone} placeholder="+1 555-123-4567" />
                                    </div>
                                    <div class="form-group">
                                        <label for="contactEmail" class="form-label">Email</label>
                                        <input type="email" id="contactEmail" class="input" bind:value={reviewerContact.email} placeholder="you@example.com" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="step-actions">
                    <button class="btn btn-secondary" onclick={() => (step = 2)}>Back</button>
                    <div class="action-group">
                        <button
                            class="btn btn-outline"
                            onclick={saveDraft}
                            disabled={savingDraft || loading}
                        >
                            {#if savingDraft}
                                Saving...
                            {:else if draftSaved}
                                Saved
                            {:else}
                                Save Draft
                            {/if}
                        </button>
                        <button class="btn btn-primary" onclick={() => (step = 4)} disabled={!step3Valid}>Continue</button>
                    </div>
                </div>
            </CockpitPanel>

        {:else if step === 4}
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <!-- STEP 4: Review & Submit -->
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <div class="step-content">
                <div class="step-intro">
                    <h2>Review & Submit</h2>
                    <p class="step-reassurance">Looking good! Here's a summary before we run the analysis.</p>
                </div>

                <CockpitPanel class="summary-card">
                    <h3>Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">App Name</span>
                            <span class="summary-value">{appName}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Category</span>
                            <span class="summary-value">{category || "Not set"}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Age Rating</span>
                            <span class="summary-value">{calculatedAgeRating}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Screenshots</span>
                            <span class="summary-value">{totalScreenshotCount} files</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Info.plist</span>
                            <span class="summary-value status-{hasPlist ? 'ready' : 'warning'}">
                                {hasPlist ? "✓ Attached" : "Missing"}
                            </span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Privacy Manifest</span>
                            <span class="summary-value status-{hasManifest ? 'ready' : 'warning'}">
                                {hasManifest ? "✓ Attached" : "Missing"}
                            </span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Sign-in Required</span>
                            <span class="summary-value">{signInRequired ? "Yes" : "No"}</span>
                        </div>
                        {#if signInRequired}
                            <div class="summary-item">
                                <span class="summary-label">Demo Account</span>
                                <span class="summary-value status-{demoUsername && demoPassword ? 'ready' : 'warning'}">
                                    {demoUsername && demoPassword ? "✓ Provided" : "Missing!"}
                                </span>
                            </div>
                        {/if}
                    </div>
                </CockpitPanel>

                <CockpitPanel class="whats-included">
                    <h3>What We'll Analyze</h3>
                    <ul>
                        <li>Metadata validation (name, subtitle, keywords, description)</li>
                        <li>URL reachability (privacy policy, support URL)</li>
                        <li>Age rating consistency</li>
                        <li>Privacy manifest vs data collection declarations</li>
                        <li>Screenshot guidelines compliance</li>
                        <li>Info.plist required keys and format</li>
                        <li>Demo account validity (if sign-in required)</li>
                        <li>Category-specific requirements</li>
                    </ul>
                </CockpitPanel>

                {#if errorMsg}
                    <div class="error-msg">{errorMsg}</div>
                {/if}

                {#if !canSubmit}
                    <div class="missing-files-warning">
                        <strong>Cannot submit:</strong>
                        {#if !step1Valid}App name, description, and category are required. {/if}
                        {#if !step2Valid}{missingFiles.join(", ")}. {/if}
                        {#if !step3Valid}Privacy Policy URL and Support URL are required. {#if signInRequired && (!demoUsername || !demoPassword)}Demo credentials are required when sign-in is enabled.{/if}{/if}
                    </div>
                {/if}

                <div class="step-actions">
                    <button class="btn btn-secondary" onclick={() => (step = 3)}>Back</button>
                    <div class="action-group">
                        <button
                            class="btn btn-outline"
                            onclick={saveDraft}
                            disabled={savingDraft || loading}
                        >
                            {#if savingDraft}
                                Saving...
                            {:else if draftSaved}
                                Saved
                            {:else}
                                Save Draft
                            {/if}
                        </button>
                        <button
                            class="btn btn-accent"
                            onclick={testSubmit}
                            disabled={loading || !canSubmit}
                        >
                            {loading ? "Analyzing..." : "Test Mode (Free)"}
                        </button>
                        <button
                            class="btn btn-primary"
                            onclick={submit}
                            disabled={loading || !canSubmit}
                        >
                            {loading ? "Analyzing..." : "Start Review (100 Credits)"}
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
        margin-bottom: 1.5rem;
    }

    .submit-header h1 {
        font-family: "Outfit", sans-serif;
        font-size: 2.2rem;
        font-weight: 800;
        margin-top: 8px;
        letter-spacing: -0.02em;
        color: var(--gray-100);
    }

    .draft-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(212, 168, 83, 0.1);
        border: 1px solid rgba(212, 168, 83, 0.3);
        border-radius: 6px;
        font-size: 0.9rem;
        color: var(--accent);
        margin-top: 0.75rem;
    }

    .btn-outline {
        background: transparent;
        border: 1px solid var(--gray-600);
        color: var(--gray-300);
        transition: all 0.2s ease;
    }

    .btn-outline:hover:not(:disabled) {
        border-color: var(--gray-400);
        color: var(--gray-100);
    }

    .btn-outline:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* Simple Progress Indicator (replaces 7-step bar) */
    /* ═══════════════════════════════════════════════════════════════ */
    .progress-indicator {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        margin-bottom: 2rem;
    }

    .progress-text {
        font-family: "Instrument Mono", monospace;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--accent);
        letter-spacing: 0.05em;
    }

    .progress-divider {
        color: var(--gray-600);
    }

    .progress-label {
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--gray-200);
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* Step Content & Intro */
    /* ═══════════════════════════════════════════════════════════════ */
    .step-content {
        max-width: 600px;
    }

    .step-intro {
        margin-bottom: 2rem;
    }

    .step-intro h2 {
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--gray-100);
        margin-bottom: 0.5rem;
    }

    .step-reassurance {
        font-size: 0.95rem;
        color: var(--gray-400);
        line-height: 1.5;
    }

    .step-desc {
        font-size: 0.95rem;
        color: var(--gray-400);
        margin-bottom: 2rem;
        line-height: 1.5;
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* Collapsible Sections (Accordion) */
    /* ═══════════════════════════════════════════════════════════════ */
    .collapsible-section {
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        margin-bottom: 1rem;
        overflow: hidden;
    }

    .collapsible-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        background: rgba(255, 255, 255, 0.03);
        border: none;
        cursor: pointer;
        transition: background 0.2s;
    }

    .collapsible-header:hover {
        background: rgba(255, 255, 255, 0.06);
    }

    .collapsible-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .collapsible-title span:first-of-type {
        font-size: 1rem;
        font-weight: 600;
        color: var(--gray-100);
    }

    .section-hint {
        font-size: 0.8rem;
        color: var(--gray-300);
        font-weight: 400;
    }

    .chevron {
        color: var(--gray-300);
        transition: transform 0.2s;
        flex-shrink: 0;
    }

    .collapsible-header.expanded .chevron {
        transform: rotate(90deg);
    }

    .section-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .status-complete {
        color: #22c55e;
        font-size: 0.9rem;
    }

    .status-required {
        font-size: 0.75rem;
        color: var(--accent);
        background: rgba(212, 168, 83, 0.15);
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-weight: 500;
    }

    .rating-badge {
        font-family: "Outfit", sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--accent);
        background: rgba(212, 168, 83, 0.15);
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
    }

    .collapsible-content {
        padding: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(0, 0, 0, 0.1);
    }

    .section-intro {
        font-size: 0.9rem;
        color: var(--gray-400);
        margin-bottom: 1.25rem;
        line-height: 1.5;
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* Form Elements */
    /* ═══════════════════════════════════════════════════════════════ */
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

    .form-group {
        margin-bottom: 1.25rem;
    }

    .form-group:last-child {
        margin-bottom: 0;
    }

    .form-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--gray-300);
        margin-bottom: 0.5rem;
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

    .char-count {
        font-family: "Instrument Mono", monospace;
        font-size: 0.7rem;
        color: var(--gray-500);
        margin-left: auto;
    }

    .char-count.over {
        color: #ef4444;
    }

    .required {
        color: var(--accent);
        font-weight: 600;
    }

    .field-hint {
        font-size: 0.8rem;
        color: var(--gray-500);
        margin-top: 0.5rem;
        line-height: 1.4;
    }

    .field-hint.warning-hint {
        color: var(--accent);
        background: rgba(212, 168, 83, 0.08);
        border: 1px solid rgba(212, 168, 83, 0.2);
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        margin-top: 0.75rem;
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* File Upload */
    /* ═══════════════════════════════════════════════════════════════ */
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

    /* Screenshot Previews - Apple-style horizontal gallery */
    .screenshot-previews {
        margin-top: 1rem;
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding: 8px 4px;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
    }

    .screenshot-previews::-webkit-scrollbar {
        height: 6px;
    }

    .screenshot-previews::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
    }

    .screenshot-previews::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }

    .screenshot-preview {
        position: relative;
        flex-shrink: 0;
        scroll-snap-align: start;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }

    .screenshot-preview img {
        height: 180px;
        width: auto;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        object-fit: contain;
        background: rgba(0, 0, 0, 0.3);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .screenshot-preview:hover img {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    }

    .screenshot-remove {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.9);
        border: 2px solid var(--dark);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .screenshot-preview:hover .screenshot-remove {
        opacity: 1;
    }

    .screenshot-remove:hover {
        transform: scale(1.1);
        background: #ef4444;
    }

    .screenshot-saved-placeholder {
        height: 180px;
        width: 90px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--gray-500);
    }

    .screenshot-name {
        font-size: 0.7rem;
        color: var(--gray-500);
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
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

    /* ═══════════════════════════════════════════════════════════════ */
    /* Config Files Section */
    /* ═══════════════════════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════════════════════ */
    /* Age Rating */
    /* ═══════════════════════════════════════════════════════════════ */
    .age-rating-result {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        background: rgba(212, 168, 83, 0.08);
        border: 1px solid rgba(212, 168, 83, 0.2);
        border-radius: 8px;
        margin-bottom: 1.5rem;
    }

    .rating-label {
        font-size: 0.9rem;
        color: var(--gray-300);
    }

    .rating-value {
        font-family: "Outfit", sans-serif;
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--accent);
    }

    .age-questions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .age-question {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
    }

    .age-question label {
        font-size: 0.9rem;
        color: var(--gray-300);
    }

    .age-question select {
        width: 160px;
        min-width: 0;
    }

    .age-question.checkbox-question {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .age-question.checkbox-question label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
    }

    .age-question.checkbox-question label span {
        color: var(--gray-200);
    }

    .age-question.checkbox-question .field-hint {
        margin: 0;
        padding-left: 1.75rem;
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* Privacy Grid */
    /* ═══════════════════════════════════════════════════════════════ */
    .privacy-grid {
        display: flex;
        flex-direction: column;
        gap: 0;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1.5rem;
    }

    .privacy-row {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        gap: 1rem;
        align-items: center;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.01);
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .privacy-row:last-child {
        border-bottom: none;
    }

    .privacy-row:nth-child(odd) {
        background: rgba(255, 255, 255, 0.02);
    }

    .privacy-label {
        font-size: 0.85rem;
        color: var(--gray-300);
    }

    .privacy-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--gray-400);
        cursor: pointer;
        white-space: nowrap;
    }

    .privacy-checkbox.disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .privacy-checkbox input {
        accent-color: var(--accent);
    }

    @media (max-width: 600px) {
        .privacy-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }
        .privacy-label {
            font-weight: 500;
            margin-bottom: 0.25rem;
        }
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* Monetization & Sign-in */
    /* ═══════════════════════════════════════════════════════════════ */
    .monetization-section {
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
    }

    .monetization-section h3 {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--gray-200);
        margin: 0 0 1rem 0;
    }

    .checkbox-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: var(--gray-300);
        cursor: pointer;
    }

    .checkbox-label input {
        accent-color: var(--accent);
        width: 16px;
        height: 16px;
    }

    .checkbox-label.prominent {
        font-size: 1rem;
        font-weight: 500;
        color: var(--gray-200);
    }

    .checkbox-label.prominent input {
        width: 18px;
        height: 18px;
    }

    .signin-section {
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        margin-bottom: 1.5rem;
    }

    .demo-credentials {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .warning-hint {
        padding: 0.875rem 1rem;
        background: rgba(251, 191, 36, 0.08);
        border: 1px solid rgba(251, 191, 36, 0.15);
        border-radius: 6px;
        font-size: 0.85rem;
        color: #fbbf24;
        margin-bottom: 1rem;
        line-height: 1.5;
    }

    .contact-section {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .contact-section h3 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--gray-200);
        margin: 0 0 1rem 0;
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* Step Actions */
    /* ═══════════════════════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════════════════════ */
    /* Summary Card */
    /* ═══════════════════════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════════════════════ */
    /* What's Included */
    /* ═══════════════════════════════════════════════════════════════ */
    .whats-included {
        margin-top: 1.5rem;
    }

    .whats-included h3 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--gray-200);
        margin: 0 0 1rem 0;
    }

    .whats-included ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .whats-included li {
        position: relative;
        padding: 0.5rem 0 0.5rem 1.5rem;
        font-size: 0.9rem;
        color: var(--gray-400);
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .whats-included li:last-child {
        border-bottom: none;
    }

    .whats-included li::before {
        content: "✓";
        position: absolute;
        left: 0;
        color: #22c55e;
        font-weight: 600;
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* Errors & Warnings */
    /* ═══════════════════════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════════════════════ */
    /* Modal */
    /* ═══════════════════════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════════════════════ */
    /* Loading Overlay */
    /* ═══════════════════════════════════════════════════════════════ */
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
