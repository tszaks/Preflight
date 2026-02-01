'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Upload, Check, AlertCircle, Plus, X, Link as LinkIcon, Loader2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/components/ui/status'
import { scanProjectFolder, type ScanResults } from '@/lib/project-scanner'
import { ASCConnectModal } from '@/components/ASCConnectModal'
import { AgeRating } from '@/components/submission/AgeRating'
import { PrivacyDeclarations } from '@/components/submission/PrivacyDeclarations'
import { SelfChecklist } from '@/components/submission/SelfChecklist'

const STEPS = ["App Info", "Files", "Compliance", "Review"]

function SubmitPageContent() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Step 1: App Info (Metadata + Config)
    const [appName, setAppName] = useState("")
    const [promotionalText, setPromotionalText] = useState("")
    const [description, setDescription] = useState("")
    const [keywords, setKeywords] = useState("")
    const [category, setCategory] = useState("")
    const [supportUrl, setSupportUrl] = useState("")
    const [marketingUrl, setMarketingUrl] = useState("")
    const [signInRequired, setSignInRequired] = useState(false)
    const [demoUsername, setDemoUsername] = useState("")
    const [demoPassword, setDemoPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [saved, setSaved] = useState(false)
    const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null)

    // Step 2: Files
    const [screenshots, setScreenshots] = useState<File[]>([])
    const [infoPlist, setInfoPlist] = useState<File | null>(null)
    const [privacyManifest, setPrivacyManifest] = useState<File | null>(null)
    const [ipaBinary, setIpaBinary] = useState<File | null>(null)

    // Step 3: Compliance (Age + Privacy + Checklist)
    const [ageRating, setAgeRating] = useState({})
    const [privacy, setPrivacy] = useState({})
    const [checklist, setChecklist] = useState({})

    // ASC State
    const [showAscModal, setShowAscModal] = useState(false)
    const [ascConnected, setAscConnected] = useState(false)
    const [ascAppName, setAscAppName] = useState("")
    const [ascAppId, setAscAppId] = useState("")
    const [refreshing, setRefreshing] = useState(false)

    // URL params for draft loading
    const searchParams = useSearchParams()
    const draftId = searchParams.get('draft')

    // Load draft data if resuming a saved submission
    useEffect(() => {
        if (draftId) {
            loadDraft(draftId)
        }
    }, [draftId])

    const loadDraft = async (submissionId: string) => {
        try {
            const res = await fetch(`/api/submissions/${submissionId}`)
            if (!res.ok) return

            const { data } = await res.json()
            if (!data) return

            // Populate form fields from saved data
            setActiveSubmissionId(data.id)
            if (data.app_name) setAppName(data.app_name)
            if (data.promotional_text) setPromotionalText(data.promotional_text)
            if (data.description) setDescription(data.description)
            if (data.keywords) setKeywords(data.keywords)
            if (data.category) setCategory(data.category)
            if (data.support_url) setSupportUrl(data.support_url)
            if (data.marketing_url) setMarketingUrl(data.marketing_url)
            if (data.sign_in_required !== undefined) setSignInRequired(data.sign_in_required)
            if (data.demo_username) setDemoUsername(data.demo_username)
            if (data.demo_password) setDemoPassword(data.demo_password)
            if (data.age_rating) setAgeRating(data.age_rating)
            if (data.privacy_declarations) setPrivacy(data.privacy_declarations)
            if (data.checklist) setChecklist(data.checklist)
        } catch (err) {
            console.error('Failed to load draft:', err)
        }
    }

    useEffect(() => {
        checkAscStatus()
    }, [])

    const checkAscStatus = async () => {
        try {
            const res = await fetch('/api/asc/connect')
            const data = await res.json()
            if (data.connected) {
                setAscConnected(true)
                setAscAppName(data.appName || "")
                setAscAppId(data.appId || "")
            }
        } catch (err) {
            console.error("Failed to check ASC status", err)
        }
    }

    const handleRefresh = async () => {
        if (!ascAppId) return
        setRefreshing(true)
        try {
            const res = await fetch('/api/asc/autofill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appId: ascAppId })
            })
            const { data } = await res.json()
            handleAutofill(data)
        } catch (err) {
            console.error("Failed to refresh ASC data", err)
        } finally {
            setRefreshing(false)
        }
    }

    const handleAutofill = (data: any) => {
        if (data.app_name) setAppName(data.app_name)
        if (data.promotional_text) setPromotionalText(data.promotional_text)
        if (data.description) setDescription(data.description)
        if (data.keywords) setKeywords(data.keywords)
        if (data.category) setCategory(data.category)
        if (data.support_url) setSupportUrl(data.support_url)
        if (data.marketing_url) setMarketingUrl(data.marketing_url)

        // Sign-in info from ASC
        if (data.sign_in_required !== undefined) setSignInRequired(data.sign_in_required)
        if (data.demo_username) setDemoUsername(data.demo_username)
        if (data.demo_password) setDemoPassword(data.demo_password)

        // Refresh connection status to show the selected app name
        checkAscStatus()
    }

    const disconnectAsc = async () => {
        try {
            await fetch('/api/asc/connect', { method: 'DELETE' })
            setAscConnected(false)
            setAscAppName("")
        } catch (err) {
            console.error("Failed to disconnect ASC", err)
        }
    }

    // Scanning State
    const [scanning, setScanning] = useState(false)

    const handleFolderScan = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        setScanning(true)
        const results = scanProjectFolder(e.target.files)
        if (results.infoPlist) setInfoPlist(results.infoPlist)
        if (results.privacyManifest) setPrivacyManifest(results.privacyManifest)
        if (results.ipaBinary) setIpaBinary(results.ipaBinary)
        if (results.projectName && !appName) setAppName(results.projectName)
        setScanning(false)
    }

    const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const newFiles = Array.from(e.target.files)
        setScreenshots(prev => [...prev, ...newFiles].slice(0, 10))
    }

    const nextStep = async () => {
        if (step === 1 && !appName) {
            alert("App Name is required")
            return
        }
        if (step === 2) {
            if (!ipaBinary || !infoPlist || !privacyManifest) {
                alert("Please upload all 3 required files: IPA, Info.plist, and Privacy Manifest")
                return
            }
            if (screenshots.length < 3) {
                alert("At least 3 screenshots are required")
                return
            }
        }

        // Auto-save progress before moving to next step
        await handleFinalSubmit(true)

        setStep(s => Math.min(s + 1, 4))
    }
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    return (
        <div className="container mx-auto px-6 max-w-3xl py-12">
            {/* Top Navigation */}
            <div className="mb-8">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    Back to Dashboard
                </button>
            </div>

            {/* Progress */}
            <div className="flex justify-between mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10" />
                {STEPS.map((label, i) => (
                    <div key={label} className="bg-black px-2 flex flex-col items-center">
                        <div className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors",
                            step > i + 1 ? "bg-white border-white text-black" :
                                step === i + 1 ? "border-white text-white" : "border-white/10 text-gray-600"
                        )}>
                            {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={cn(
                            "text-[10px] uppercase tracking-widest mt-2 hidden md:block",
                            step === i + 1 ? "text-white" : "text-gray-600"
                        )}>{label}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-6 min-h-[400px]">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="vercel-card p-6 space-y-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold tracking-tight">App Details</h2>
                                <p className="text-sm text-gray-500 font-light">General information and external links</p>
                            </div>

                            <div className="space-y-4">
                                {!ascConnected ? (
                                    <button
                                        onClick={() => setShowAscModal(true)}
                                        className="w-full flex items-center justify-between p-4 rounded-md border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] border-dashed transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                                <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-white">Connect App Store Connect</div>
                                                <div className="text-[10px] text-gray-500 font-light">Auto-fill metadata and screenshots (Optional)</div>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                                    </button>
                                ) : (
                                    <div className="w-full flex items-center justify-between p-4 rounded-md border border-white/10 bg-white/[0.03]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-green-500" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-white">Connected{ascAppName ? `: ${ascAppName}` : ''}</div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <button
                                                        onClick={handleRefresh}
                                                        disabled={refreshing}
                                                        className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-bold flex items-center gap-1"
                                                    >
                                                        {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
                                                    </button>
                                                    <button
                                                        onClick={disconnectAsc}
                                                        className="text-[10px] text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest font-bold"
                                                    >
                                                        Disconnect
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowAscModal(true)}
                                            className="text-[10px] text-white hover:text-gray-300 transition-colors uppercase tracking-widest font-bold border border-white/10 px-2 py-1 rounded"
                                        >
                                            Change App
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">App Name</label>
                                    <input
                                        value={appName}
                                        onChange={e => setAppName(e.target.value)}
                                        placeholder="e.g. Preflight"
                                        className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Promotional Text</label>
                                    <textarea
                                        value={promotionalText}
                                        onChange={e => setPromotionalText(e.target.value)}
                                        placeholder="Promotional text shown on your app's product page..."
                                        maxLength={170}
                                        rows={2}
                                        className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors resize-none"
                                    />
                                    <p className="text-xs text-gray-500">{promotionalText.length}/170 characters</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="The description as it appears in the App Store..."
                                        rows={6}
                                        className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Keywords</label>
                                    <input
                                        value={keywords}
                                        onChange={e => setKeywords(e.target.value)}
                                        placeholder="Comma-separated keywords (100 characters max)"
                                        maxLength={100}
                                        className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors"
                                    />
                                    <p className="text-xs text-gray-500">{keywords.length}/100 characters</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Primary Category</label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors appearance-none"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Business">Business</option>
                                        <option value="Developer Tools">Developer Tools</option>
                                        <option value="Education">Education</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Health & Fitness">Health & Fitness</option>
                                        <option value="Lifestyle">Lifestyle</option>
                                        <option value="Productivity">Productivity</option>
                                        <option value="Social Networking">Social Networking</option>
                                        <option value="Utilities">Utilities</option>
                                    </select>
                                </div>

                                {/* Merged Configuration Fields */}
                                <div className="space-y-4 border-t border-white/10 pt-4 mt-4">
                                    <h3 className="text-sm font-bold tracking-tight">Review Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Support URL</label>
                                            <input
                                                value={supportUrl}
                                                onChange={e => setSupportUrl(e.target.value)}
                                                placeholder="https://example.com/support"
                                                className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Marketing URL <span className="text-gray-600">(optional)</span></label>
                                            <input
                                                value={marketingUrl}
                                                onChange={e => setMarketingUrl(e.target.value)}
                                                placeholder="https://example.com"
                                                className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="signin"
                                                checked={signInRequired}
                                                onChange={e => setSignInRequired(e.target.checked)}
                                                className="w-4 h-4 bg-black border-border rounded"
                                            />
                                            <label htmlFor="signin" className="text-sm font-medium">Sign-in Required for Review</label>
                                        </div>

                                        {signInRequired && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7 animate-in fade-in slide-in-from-left-2 transition-all">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Demo Email</label>
                                                    <input
                                                        value={demoUsername}
                                                        onChange={e => setDemoUsername(e.target.value)}
                                                        placeholder="test@example.com"
                                                        className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Demo Password</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            value={demoPassword}
                                                            onChange={e => setDemoPassword(e.target.value)}
                                                            placeholder="••••••••"
                                                            className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-white transition-colors pr-10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                                        >
                                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="vercel-card p-6 space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold tracking-tight">Project Files</h2>
                                    <p className="text-sm text-gray-500 font-light">Upload your assets for scanning</p>
                                </div>
                                <label className="vercel-btn-secondary text-[10px] py-1 cursor-pointer">
                                    {scanning ? "Scanning..." : "Scan Xcode Folder"}
                                    <input
                                        type="file"
                                        {...({ webkitdirectory: "" } as any)}
                                        onChange={handleFolderScan}
                                        hidden
                                    />
                                </label>
                            </div>

                            <div className="relative">
                                {scanning && (
                                    <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg border border-white/10 animate-in fade-in duration-200">
                                        <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                                        <p className="text-sm font-medium text-white">Scanning Project Files...</p>
                                        <p className="text-xs text-gray-500 mt-1">Looking for .ipa, Info.plist, and Privacy Manifest</p>
                                    </div>
                                )}
                                <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-200", scanning && "opacity-20 pointer-events-none")}>
                                    {[
                                        { label: "IPA Binary", state: ipaBinary, setter: setIpaBinary, accept: ".ipa" },
                                        { label: "Info.plist", state: infoPlist, setter: setInfoPlist, accept: ".plist" },
                                        { label: "Privacy Manifest", state: privacyManifest, setter: setPrivacyManifest, accept: ".xcprivacy" }
                                    ].map((file, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{file.label}</span>
                                                {file.state ? <Check className="w-3.5 h-3.5 text-green-500" /> : <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />}
                                            </div>
                                            {file.state ? (
                                                <div className="vercel-card p-3 flex justify-between items-center bg-white/[0.03] border-white/10 group">
                                                    <span className="text-xs truncate text-gray-300 pr-4">{file.state.name}</span>
                                                    <button onClick={() => file.setter(null)} className="text-gray-500 hover:text-white transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center h-32 border border-white/5 border-dashed rounded-lg hover:bg-white/[0.02] hover:border-white/10 cursor-pointer transition-all group plus-hover-spin">
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-white/10 transition-colors">
                                                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Click to upload</span>
                                                    <input type="file" accept={file.accept} onChange={e => file.setter(e.target.files?.[0] || null)} hidden />
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="vercel-card p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold tracking-tight">Screenshots</h2>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">({screenshots.length}/10)</label>
                                        {screenshots.length < 3 && (
                                            <span className="text-[10px] text-yellow-500 font-medium bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">Required</span>
                                        )}
                                    </div>
                                </div>
                                {screenshots.length < 10 && (
                                    <label className="cursor-pointer plus-hover-spin text-gray-500 hover:text-white transition-colors">
                                        <Plus className="w-5 h-5" />
                                        <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} hidden />
                                    </label>
                                )}
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 custom-scrollbar mask-gradient-right">
                                {screenshots.length === 0 ? (
                                    <label className="w-full py-12 flex flex-col items-center justify-center border border-white/5 border-dashed rounded-lg bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer group">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Upload className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                                        </div>
                                        <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Click to upload screenshots</span>
                                        <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} hidden />
                                    </label>
                                ) : (
                                    screenshots.map((_, i) => (
                                        <div key={i} className="flex-shrink-0 w-32 aspect-[9/16] bg-white/5 rounded relative group overflow-hidden border border-white/5">
                                            <img src={URL.createObjectURL(screenshots[i])} alt="preview" className="object-cover w-full h-full opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <button
                                                onClick={() => setScreenshots(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="vercel-card p-6">
                            <AgeRating value={ageRating} onChange={setAgeRating} />
                        </div>
                        <div className="vercel-card p-6">
                            <PrivacyDeclarations value={privacy} onChange={setPrivacy} />
                        </div>
                        <div className="vercel-card p-6">
                            <SelfChecklist value={checklist} onChange={setChecklist} />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="vercel-card p-6 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold tracking-tight">Review & Submit</h2>
                            <p className="text-sm text-gray-500 font-light">Confirm your submission details</p>
                        </div>

                        <div className="space-y-4 divide-y divide-white/5">
                            <div className="py-2 flex justify-between text-sm">
                                <span className="text-gray-500">App Name</span>
                                <span>{appName || "Not set"}</span>
                            </div>
                            <div className="py-2 flex justify-between text-sm">
                                <span className="text-gray-500">Files</span>
                                <div className="text-right text-xs space-y-1">
                                    <div className={cn(ipaBinary ? "text-green-500" : "text-yellow-500")}>
                                        IPA Binary: {ipaBinary ? "Ready" : "Optional"}
                                    </div>
                                    <div className={cn(infoPlist ? "text-green-500" : "text-red-500")}>
                                        Info.plist: {infoPlist ? "Ready" : "Missing"}
                                    </div>
                                    <div className={cn(privacyManifest ? "text-green-500" : "text-yellow-500")}>
                                        Privacy Manifest: {privacyManifest ? "Ready" : "Optional"}
                                    </div>
                                    <div className={cn(screenshots.length > 0 ? "text-green-500" : "text-red-500")}>
                                        Screenshots: {screenshots.length}/10
                                    </div>
                                </div>
                            </div>
                            <div className="py-2 flex justify-between text-sm">
                                <span className="text-gray-500">Demo Account</span>
                                <span>{signInRequired ? "Enabled" : "Not Required"}</span>
                            </div>
                            <div className="py-2 flex justify-between text-sm">
                                <span className="text-gray-500">Age Rating</span>
                                <span className="text-green-500">Configured</span>
                            </div>
                            <div className="py-2 flex justify-between text-sm">
                                <span className="text-gray-500">Privacy Data</span>
                                <span className="text-green-500">Configured</span>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-4 rounded-md text-xs text-gray-400 leading-relaxed font-light">
                            By submitting this review, you agree to our terms. 100 credits will be deducted from your account.
                            The analysis usually takes 2-5 minutes.
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-12 pt-8 border-t border-white/5 items-center">
                    <button
                        onClick={prevStep}
                        disabled={step === 1 || loading}
                        className="vercel-btn-secondary text-[10px] disabled:opacity-0"
                    >
                        Back
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleFinalSubmit(true)}
                            disabled={loading}
                            className={cn(
                                "text-[10px] transition-all",
                                saved ? "text-green-500" : "text-gray-500 hover:text-white"
                            )}
                        >
                            {saved ? (
                                <span className="animate-in fade-in slide-in-from-bottom-1">
                                    Review submission successfully saved
                                </span>
                            ) : "Save Draft"}
                        </button>
                        <button
                            onClick={step === 4 ? () => handleFinalSubmit(false) : nextStep}
                            disabled={loading}
                            className="vercel-btn-primary flex items-center gap-2 text-[10px] min-w-[120px] justify-center"
                        >
                            {loading ? "Processing..." : step === 4 ? "Begin Analysis" : "Continue"} <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            <ASCConnectModal
                isOpen={showAscModal}
                onClose={() => setShowAscModal(false)}
                onAutofill={handleAutofill}
            />
        </div >
    );

    async function handleFinalSubmit(isDraft: boolean = false) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('app_name', appName)
            formData.append('promotional_text', promotionalText)
            formData.append('description', description)
            formData.append('keywords', keywords)
            formData.append('category', category)
            formData.append('support_url', supportUrl)
            formData.append('marketing_url', marketingUrl)
            formData.append('sign_in_required', signInRequired.toString())
            if (demoUsername) formData.append('demo_username', demoUsername)
            if (demoPassword) formData.append('demo_password', demoPassword)

            // New Data Fields
            formData.append('age_rating', JSON.stringify(ageRating))
            formData.append('privacy_declarations', JSON.stringify(privacy))
            formData.append('checklist', JSON.stringify(checklist))

            if (isDraft) formData.append('is_draft', 'true')
            if (activeSubmissionId) formData.append('submission_id', activeSubmissionId)

            // Only include files for the final submission — not for draft auto-saves
            // (files are large and would exceed the request body size limit)
            if (!isDraft) {
                if (infoPlist) formData.append('plist', infoPlist)
                if (privacyManifest) formData.append('manifest', privacyManifest)
                if (ipaBinary) formData.append('ipa', ipaBinary)
                screenshots.forEach(f => formData.append('screenshots', f))
            }

            const response = await fetch('/api/submissions', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const { submissionId } = await response.json()
                setActiveSubmissionId(submissionId)

                if (isDraft) {
                    setSaved(true)
                    setTimeout(() => setSaved(false), 3000)
                } else {
                    router.push(`/report/${submissionId}`)
                }
            } else {
                const error = await response.json()
                alert(error.message || "Failed to submit")
            }
        } catch (err) {
            console.error(err)
            alert("Something went wrong during submission")
        } finally {
            setLoading(false)
        }
    }
}

export default function SubmitPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-gray-500">Loading...</div>
            </div>
        }>
            <SubmitPageContent />
        </Suspense>
    )
}
