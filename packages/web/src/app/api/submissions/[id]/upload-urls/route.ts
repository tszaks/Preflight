import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const BUCKET_MAP: Record<string, string> = {
    screenshot: 'screenshots',
    plist: 'plists',
    manifest: 'manifests',
    ipa: 'ipas',
}

const ALLOWED_SCREENSHOT_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: submissionId } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify submission belongs to user and is in draft status
    const { data: submission, error: subError } = await supabase
        .from('submissions')
        .select('id, user_id, status')
        .eq('id', submissionId)
        .eq('user_id', user.id)
        .single()

    if (subError || !submission) {
        return NextResponse.json({ message: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== 'draft') {
        return NextResponse.json({ message: 'Submission is not in draft status' }, { status: 400 })
    }

    try {
        const { files } = await req.json()
        const serviceClient = createServiceClient()
        const basePath = `${user.id}/${submissionId}`

        const urls = await Promise.all(
            files.map(async (file: { type: string; index?: number; filename: string }) => {
                const bucket = BUCKET_MAP[file.type]
                if (!bucket) {
                    throw new Error(`Unknown file type: ${file.type}`)
                }

                let path: string
                switch (file.type) {
                    case 'screenshot': {
                        const idx = Number(file.index)
                        if (!Number.isInteger(idx) || idx < 0 || idx > 9) {
                            throw new Error(`Invalid screenshot index: ${file.index}`)
                        }
                        const rawExt = (file.filename.split('.').pop() || 'png').toLowerCase()
                        const ext = ALLOWED_SCREENSHOT_EXTENSIONS.has(rawExt) ? rawExt : 'png'
                        path = `${basePath}/screenshot_${idx}.${ext}`
                        break
                    }
                    case 'plist':
                        path = `${basePath}/Info.plist`
                        break
                    case 'manifest':
                        path = `${basePath}/PrivacyInfo.xcprivacy`
                        break
                    case 'ipa':
                        path = `${basePath}/app.ipa`
                        break
                    default:
                        throw new Error(`Unknown file type: ${file.type}`)
                }

                // Remove existing file to allow re-upload (handles retries)
                await serviceClient.storage.from(bucket).remove([path])

                const { data, error } = await serviceClient.storage
                    .from(bucket)
                    .createSignedUploadUrl(path)

                if (error) throw error

                return {
                    type: file.type,
                    index: file.index,
                    bucket,
                    path: data.path,
                    token: data.token,
                    signedUrl: data.signedUrl,
                }
            })
        )

        return NextResponse.json({ urls })
    } catch (err: any) {
        console.error('Upload URL generation error:', err)
        return NextResponse.json(
            { message: err.message || 'Failed to generate upload URLs' },
            { status: 500 }
        )
    }
}
