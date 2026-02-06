'use client'

import { useState } from 'react'
import { X, Check, Loader2, Link as LinkIcon, Smartphone, ArrowRight } from 'lucide-react'
import { cn } from '@/components/ui/status'

interface ASCApp {
    id: string
    name: string
    bundleId: string
}

interface ASCConnectModalProps {
    isOpen: boolean
    onClose: () => void
    onAutofill: (data: Record<string, unknown>) => void
}

export function ASCConnectModal({ isOpen, onClose, onAutofill }: ASCConnectModalProps) {
    const [modalStep, setModalStep] = useState(1)
    const [connecting, setConnecting] = useState(false)
    const [autofilling, setAutofilling] = useState(false)
    const [error, setError] = useState('')

    // Step 1: Credentials
    const [keyId, setKeyId] = useState('')
    const [issuerId, setIssuerId] = useState('')
    const [privateKeyContent, setPrivateKeyContent] = useState('')
    const [fileName, setFileName] = useState('')

    // Step 2: App list
    const [apps, setApps] = useState<ASCApp[]>([])
    const [teamName, setTeamName] = useState('')
    const [selectedAppId, setSelectedAppId] = useState('')

    if (!isOpen) return null

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = () => {
            setPrivateKeyContent(reader.result as string)
        }
        reader.readAsText(file)
    }

    const handleConnect = async () => {
        if (!keyId || !issuerId || !privateKeyContent) {
            setError('Please fill in all fields and upload your .p8 key file.')
            return
        }

        setConnecting(true)
        setError('')

        try {
            const res = await fetch('/api/asc/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyId, issuerId, privateKey: privateKeyContent }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.message || `Connection failed (${res.status})`)
            }

            const data = await res.json()
            setApps(data.apps || [])
            setTeamName(data.teamName || 'Connected')
            setModalStep(2)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to connect'
            setError(message)
        } finally {
            setConnecting(false)
        }
    }

    const handleSelectApp = async (appId: string) => {
        setSelectedAppId(appId)
        setAutofilling(true)
        setError('')

        try {
            const res = await fetch('/api/asc/autofill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appId }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.message || 'Failed to fetch app data')
            }

            const { data } = await res.json()
            onAutofill(data)
            onClose()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch app data'
            setError(message)
        } finally {
            setAutofilling(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="vercel-card max-w-lg w-full relative overflow-hidden shadow-2xl border-white/10">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {modalStep === 1 ? (
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <LinkIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Connect App Store Connect</h2>
                                <p className="text-sm text-gray-500 font-light">Import metadata directly from Apple</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Key ID</label>
                                <input
                                    value={keyId}
                                    onChange={e => setKeyId(e.target.value)}
                                    placeholder="e.g. ABC1234DEF"
                                    className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Issuer ID</label>
                                <input
                                    value={issuerId}
                                    onChange={e => setIssuerId(e.target.value)}
                                    placeholder="e.g. 12345678-..."
                                    className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Private Key (.p8)</label>
                                <label className="block border-2 border-dashed border-white/5 rounded-md p-6 text-center hover:bg-white/5 cursor-pointer transition-colors group">
                                    <input type="file" accept=".p8" onChange={handleFileUpload} className="hidden" />
                                    {fileName ? (
                                        <div className="flex items-center justify-center gap-2 text-green-500 text-sm">
                                            <Check className="w-4 h-4" /> {fileName}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-sm text-gray-500 group-hover:text-gray-300">Click to upload .p8 key file</div>
                                            <div className="text-[10px] text-gray-600 mt-1">Found in App Store Connect {'>'} Users {'>'} Keys</div>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={onClose} className="vercel-btn-secondary flex-1">Cancel</button>
                            <button
                                onClick={handleConnect}
                                disabled={connecting || !keyId || !issuerId || !privateKeyContent}
                                className="vercel-btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Check className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Connected to {teamName}</h2>
                                <p className="text-sm text-gray-500 font-light">Select an app to import metadata</p>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {apps.map(app => (
                                <button
                                    key={app.id}
                                    onClick={() => handleSelectApp(app.id)}
                                    disabled={autofilling}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-md border border-white/5 hover:border-white/20 transition-all text-left group",
                                        selectedAppId === app.id && "bg-white/5 border-white/20"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                                            <Smartphone className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{app.name}</div>
                                            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{app.bundleId}</div>
                                        </div>
                                    </div>
                                    {autofilling && selectedAppId === app.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                    ) : (
                                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setModalStep(1)} className="vercel-btn-secondary flex-1">Back</button>
                            <button onClick={onClose} className="vercel-btn-secondary flex-1">Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
