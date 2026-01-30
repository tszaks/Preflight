<script lang="ts">
    /**
     * ASCConnectModal — Optional App Store Connect integration
     *
     * Three-step flow:
     * 1. Enter Key ID, Issuer ID, upload .p8 file
     * 2. Validate → show app list
     * 3. Select app → auto-fill form
     */

    let {
        open = $bindable(false),
        onAutofill,
    }: {
        open: boolean;
        onAutofill: (data: Record<string, string>) => void;
    } = $props();

    let modalStep = $state(1);
    let connecting = $state(false);
    let loading = $state(false);
    let error = $state('');

    // Step 1: Credentials
    let keyId = $state('');
    let issuerId = $state('');
    let privateKeyContent = $state('');
    let fileName = $state('');

    // Step 2: App list
    let apps: Array<{ id: string; name: string; bundleId: string }> = $state([]);
    let teamName = $state('');

    // Step 3: Selected app
    let selectedAppId = $state('');
    let autofilling = $state(false);

    function handleFileUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        fileName = file.name;
        const reader = new FileReader();
        reader.onload = () => {
            privateKeyContent = reader.result as string;
        };
        reader.readAsText(file);
    }

    async function connect() {
        if (!keyId || !issuerId || !privateKeyContent) {
            error = 'Please fill in all fields and upload your .p8 key file.';
            return;
        }

        connecting = true;
        error = '';

        try {
            const res = await fetch('/api/asc/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyId,
                    issuerId,
                    privateKey: privateKeyContent,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || `Connection failed (${res.status})`);
            }

            const data = await res.json();
            apps = data.apps || [];
            teamName = data.teamName || 'Connected';
            modalStep = 2;
        } catch (err: unknown) {
            error = err instanceof Error ? err.message : 'Failed to connect';
        } finally {
            connecting = false;
        }
    }

    async function selectApp(appId: string) {
        selectedAppId = appId;
        autofilling = true;
        error = '';

        try {
            const res = await fetch('/api/asc/autofill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appId }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch app data');
            }

            const { data } = await res.json();
            onAutofill(data);
            close();
        } catch (err: unknown) {
            error = err instanceof Error ? err.message : 'Failed to fetch app data';
        } finally {
            autofilling = false;
        }
    }

    function close() {
        open = false;
        // Reset state for next open
        setTimeout(() => {
            modalStep = 1;
            error = '';
            connecting = false;
            autofilling = false;
        }, 300);
    }

    function handleBackdropClick(e: MouseEvent) {
        if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
            close();
        }
    }
</script>

{#if open}
<div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
    <div class="modal-container">
        <button class="modal-close" onclick={close} aria-label="Close">×</button>

        {#if modalStep === 1}
            <!-- Step 1: Enter Credentials -->
            <div class="modal-header">
                <div class="modal-icon">🔗</div>
                <h2>Connect App Store Connect</h2>
                <p class="modal-subtitle">Auto-fill your submission form with data from Apple's API. This is optional.</p>
            </div>

            <div class="modal-body">
                {#if error}
                    <div class="error-banner">{error}</div>
                {/if}

                <div class="form-group">
                    <label for="asc-key-id">Key ID</label>
                    <input
                        type="text"
                        id="asc-key-id"
                        bind:value={keyId}
                        placeholder="e.g. ABC1234DEF"
                        class="input"
                    />
                    <span class="help-text">Found in App Store Connect &gt; Users &gt; Integrations &gt; Keys</span>
                </div>

                <div class="form-group">
                    <label for="asc-issuer-id">Issuer ID</label>
                    <input
                        type="text"
                        id="asc-issuer-id"
                        bind:value={issuerId}
                        placeholder="e.g. 12345678-1234-1234-1234-123456789012"
                        class="input"
                    />
                    <span class="help-text">Shown at the top of the Keys page</span>
                </div>

                <div class="form-group">
                    <label for="asc-p8">Private Key (.p8 file)</label>
                    <div class="file-upload-area">
                        <input
                            type="file"
                            id="asc-p8"
                            accept=".p8,.pem"
                            onchange={handleFileUpload}
                            class="file-input-hidden"
                        />
                        <label for="asc-p8" class="file-upload-label">
                            {#if fileName}
                                <span class="file-name">✓ {fileName}</span>
                            {:else}
                                <span class="file-prompt">Choose .p8 file or drag here</span>
                            {/if}
                        </label>
                    </div>
                    <span class="help-text">The .p8 key file downloaded when you created the API key</span>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick={close}>Cancel</button>
                <button
                    class="btn btn-primary"
                    onclick={connect}
                    disabled={connecting || !keyId || !issuerId || !privateKeyContent}
                >
                    {connecting ? 'Connecting...' : 'Connect'}
                </button>
            </div>

        {:else if modalStep === 2}
            <!-- Step 2: Select App -->
            <div class="modal-header">
                <div class="modal-icon">✅</div>
                <h2>Connected to {teamName}</h2>
                <p class="modal-subtitle">Select the app you want to submit for review.</p>
            </div>

            <div class="modal-body">
                {#if error}
                    <div class="error-banner">{error}</div>
                {/if}

                <div class="app-list">
                    {#each apps as app}
                        <button
                            class="app-card"
                            class:selected={selectedAppId === app.id}
                            onclick={() => selectApp(app.id)}
                            disabled={autofilling}
                        >
                            <div class="app-info">
                                <span class="app-name">{app.name}</span>
                                <span class="app-bundle">{app.bundleId}</span>
                            </div>
                            {#if autofilling && selectedAppId === app.id}
                                <span class="loading-dot">Loading...</span>
                            {:else}
                                <span class="select-arrow">→</span>
                            {/if}
                        </button>
                    {/each}
                </div>

                {#if apps.length === 0}
                    <p class="empty-state">No apps found. Make sure your API key has access to at least one app.</p>
                {/if}
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick={() => { modalStep = 1; error = ''; }}>Back</button>
                <button class="btn btn-secondary" onclick={close}>Cancel</button>
            </div>
        {/if}
    </div>
</div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }

    .modal-container {
        background: var(--surface-1, #1a1a2e);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
        border-radius: 16px;
        width: 100%;
        max-width: 520px;
        max-height: 85vh;
        overflow-y: auto;
        position: relative;
    }

    .modal-close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        color: var(--text-muted, #888);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 8px;
        transition: background 0.2s;
    }

    .modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .modal-header {
        padding: 2rem 2rem 0.5rem;
        text-align: center;
    }

    .modal-icon {
        font-size: 2.5rem;
        margin-bottom: 0.75rem;
    }

    .modal-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary, #fff);
        margin: 0 0 0.5rem;
    }

    .modal-subtitle {
        color: var(--text-muted, #888);
        font-size: 0.875rem;
        margin: 0;
        line-height: 1.5;
    }

    .modal-body {
        padding: 1.5rem 2rem;
    }

    .modal-footer {
        padding: 1rem 2rem 1.5rem;
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }

    .form-group {
        margin-bottom: 1.25rem;
    }

    .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary, #fff);
        margin-bottom: 0.375rem;
    }

    .input {
        width: 100%;
        padding: 0.625rem 0.75rem;
        background: var(--surface-2, rgba(255, 255, 255, 0.05));
        border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        color: var(--text-primary, #fff);
        font-size: 0.875rem;
        transition: border-color 0.2s;
    }

    .input:focus {
        outline: none;
        border-color: var(--accent, #6366f1);
    }

    .input::placeholder {
        color: var(--text-muted, #555);
    }

    .help-text {
        display: block;
        font-size: 0.75rem;
        color: var(--text-muted, #666);
        margin-top: 0.25rem;
    }

    .file-upload-area {
        position: relative;
    }

    .file-input-hidden {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
    }

    .file-upload-label {
        display: block;
        padding: 1rem;
        background: var(--surface-2, rgba(255, 255, 255, 0.05));
        border: 2px dashed var(--border, rgba(255, 255, 255, 0.15));
        border-radius: 8px;
        text-align: center;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s;
    }

    .file-upload-label:hover {
        border-color: var(--accent, #6366f1);
        background: rgba(99, 102, 241, 0.05);
    }

    .file-prompt {
        color: var(--text-muted, #888);
        font-size: 0.875rem;
    }

    .file-name {
        color: var(--success, #22c55e);
        font-size: 0.875rem;
    }

    .error-banner {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .app-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .app-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1rem;
        background: var(--surface-2, rgba(255, 255, 255, 0.05));
        border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
        text-align: left;
        color: var(--text-primary, #fff);
    }

    .app-card:hover:not(:disabled) {
        border-color: var(--accent, #6366f1);
        background: rgba(99, 102, 241, 0.08);
    }

    .app-card:disabled {
        opacity: 0.7;
        cursor: wait;
    }

    .app-card.selected {
        border-color: var(--accent, #6366f1);
    }

    .app-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }

    .app-name {
        font-weight: 500;
        font-size: 0.9375rem;
    }

    .app-bundle {
        font-size: 0.75rem;
        color: var(--text-muted, #888);
    }

    .select-arrow {
        font-size: 1.25rem;
        color: var(--text-muted, #666);
    }

    .loading-dot {
        font-size: 0.75rem;
        color: var(--accent, #6366f1);
    }

    .empty-state {
        text-align: center;
        color: var(--text-muted, #888);
        font-size: 0.875rem;
        padding: 2rem 0;
    }

    .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-primary {
        background: var(--accent, #6366f1);
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: var(--accent-hover, #5558e8);
    }

    .btn-secondary {
        background: transparent;
        border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
        color: var(--text-primary, #fff);
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.05);
    }
</style>
