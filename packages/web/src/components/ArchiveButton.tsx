'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { archiveSubmission } from '@/app/dashboard/actions'

export function ArchiveButton({ submissionId }: { submissionId: string }) {
    const [loading, setLoading] = useState(false)

    const handleArchive = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm('Are you sure you want to archive this review? It will be hidden from your dashboard.')) {
            return
        }

        setLoading(true)
        try {
            await archiveSubmission(submissionId)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            console.error(err)
            alert(`Failed to archive submission: ${message}`)
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleArchive}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10 group/btn"
            title="Archive Review"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </button>
    )
}
