import { createClient } from '@/lib/supabase/client'

export interface FileManifestItem {
    type: 'screenshot' | 'plist' | 'manifest' | 'ipa'
    file: File
    index?: number
}

export interface SignedUrlResponse {
    type: string
    index?: number
    bucket: string
    path: string
    token: string
    signedUrl: string
}

export interface UploadProgress {
    currentFile: string
    currentIndex: number
    totalFiles: number
    failedFiles: FailedFile[]
}

export interface FailedFile {
    type: string
    index?: number
    error: string
}

/**
 * Build a file manifest from user-selected files.
 * Small files first (plist, manifest, screenshots), IPA last.
 */
export function buildFileManifest(
    ipa: File | null,
    plist: File | null,
    manifest: File | null,
    screenshots: File[]
): FileManifestItem[] {
    const items: FileManifestItem[] = []

    if (plist) items.push({ type: 'plist', file: plist })
    if (manifest) items.push({ type: 'manifest', file: manifest })
    screenshots.forEach((file, index) => {
        items.push({ type: 'screenshot', file, index })
    })
    if (ipa) items.push({ type: 'ipa', file: ipa })

    return items
}

/**
 * Request signed upload URLs from the server for each file in the manifest.
 */
export async function getSignedUploadUrls(
    submissionId: string,
    manifest: FileManifestItem[]
): Promise<SignedUrlResponse[]> {
    const response = await fetch(`/api/submissions/${submissionId}/upload-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            files: manifest.map(item => ({
                type: item.type,
                index: item.index,
                filename: item.file.name,
            }))
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get upload URLs')
    }

    const { urls } = await response.json()
    return urls
}

/**
 * Upload all files directly to Supabase Storage via signed URLs.
 * Small files upload in parallel, IPA uploads last (biggest file gets full attention).
 */
export async function uploadAllFiles(
    manifest: FileManifestItem[],
    signedUrls: SignedUrlResponse[],
    onProgress: (progress: UploadProgress) => void
): Promise<{ uploaded: SignedUrlResponse[]; failed: FailedFile[] }> {
    const supabase = createClient()
    const uploaded: SignedUrlResponse[] = []
    const failed: FailedFile[] = []

    const smallFiles = manifest.filter(item => item.type !== 'ipa')
    const ipaFile = manifest.find(item => item.type === 'ipa')
    const totalFiles = manifest.length
    let completed = 0

    function findUrl(item: FileManifestItem): SignedUrlResponse | undefined {
        return signedUrls.find(u =>
            u.type === item.type &&
            (item.type !== 'screenshot' || u.index === item.index)
        )
    }

    // Upload small files in parallel
    await Promise.all(smallFiles.map(async (item) => {
        const urlInfo = findUrl(item)
        if (!urlInfo) {
            failed.push({ type: item.type, index: item.index, error: 'No signed URL' })
            completed++
            return
        }

        try {
            const { error } = await supabase.storage
                .from(urlInfo.bucket)
                .uploadToSignedUrl(urlInfo.path, urlInfo.token, item.file, { upsert: true })

            if (error) throw error
            uploaded.push(urlInfo)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Upload failed'
            failed.push({ type: item.type, index: item.index, error: message })
        }

        completed++
        onProgress({
            currentFile: item.file.name,
            currentIndex: completed,
            totalFiles,
            failedFiles: [...failed],
        })
    }))

    // Upload IPA last (largest file)
    if (ipaFile) {
        const urlInfo = findUrl(ipaFile)
        if (!urlInfo) {
            failed.push({ type: 'ipa', error: 'No signed URL' })
        } else {
            onProgress({
                currentFile: ipaFile.file.name,
                currentIndex: completed,
                totalFiles,
                failedFiles: [...failed],
            })

            try {
                const { error } = await supabase.storage
                    .from(urlInfo.bucket)
                    .uploadToSignedUrl(urlInfo.path, urlInfo.token, ipaFile.file, { upsert: true })

                if (error) throw error
                uploaded.push(urlInfo)
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Upload failed'
                failed.push({ type: 'ipa', error: message })
            }
        }

        completed++
        onProgress({
            currentFile: ipaFile.file.name,
            currentIndex: completed,
            totalFiles,
            failedFiles: [...failed],
        })
    }

    return { uploaded, failed }
}

/**
 * Finalize submission: update file paths, deduct credits, trigger analysis worker.
 * Only sends file type + index — the server regenerates paths to prevent IDOR.
 */
export async function finalizeSubmission(
    submissionId: string,
    files: { type: string; bucket: string; path: string }[]
): Promise<{ success: boolean; error?: string; credits?: number; required?: number }> {
    const response = await fetch(`/api/submissions/${submissionId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            files: files.map(f => ({
                type: f.type,
                index: f.type === 'screenshot'
                    ? parseInt(f.path.match(/screenshot_(\d+)/)?.[1] ?? '0', 10)
                    : undefined,
            }))
        })
    })

    if (!response.ok) {
        const error = await response.json()
        return {
            success: false,
            error: error.message,
            credits: error.credits,
            required: error.required,
        }
    }

    return { success: true }
}
