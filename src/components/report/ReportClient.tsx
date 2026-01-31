'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { StatusLight } from '@/components/ui/status'
import { Check, AlertCircle, Info, ArrowLeft, Download, Copy, ExternalLink, ChevronDown, ChevronUp, Loader2, Search, Shield, Zap, FileText } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/components/ui/status'
import { createClient } from '@/lib/supabase/client'

interface ReportClientProps {
    initialSubmission: any
    initialReport: any
    initialItems: any[]
}

export default function ReportClient({ initialSubmission, initialReport, initialItems }: ReportClientProps) {
    const [submission, setSubmission] = useState(initialSubmission)
    const [report, setReport] = useState(initialReport)
    const [items, setItems] = useState(initialItems)
    const [job, setJob] = useState<any>(null)

    // Severity sorting
    const criticalItems = items.filter(i => i.severity === 'critical')
    const warningItems = items.filter(i => i.severity === 'warning')
    const infoItems = items.filter(i => i.severity === 'info')

    useEffect(() => {
        const supabase = createClient()

        // 1. Listen for submission changes (status updates)
        const subChannel = supabase
            .channel(`submission-${submission.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'submissions',
                    filter: `id=eq.${submission.id}`,
                },
                (payload) => {
                    console.log('[Realtime] Submission update:', payload.new)
                    setSubmission(payload.new)
                }
            )
            .subscribe()

        // 2. Listen for report changes
        const reportChannel = supabase
            .channel(`report-${submission.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reports',
                    filter: `submission_id=eq.${submission.id}`,
                },
                (payload) => {
                    console.log('[Realtime] Report created:', payload.new)
                    setReport(payload.new)
                    fetchItems(payload.new.id)
                }
            )
            .subscribe()

        // 3. Listen for job progress
        const jobChannel = supabase
            .channel(`job-${submission.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'analysis_jobs',
                    filter: `submission_id=eq.${submission.id}`,
                },
                (payload) => {
                    console.log('[Realtime] Job update:', payload.new)
                    setJob(payload.new)
                }
            )
            .subscribe()

        // Initial job fetch
        const fetchJob = async () => {
            const { data } = await supabase
                .from('analysis_jobs')
                .select('*')
                .eq('submission_id', submission.id)
                .maybeSingle()
            if (data) setJob(data)
        }
        fetchJob()

        return () => {
            supabase.removeChannel(subChannel)
            supabase.removeChannel(reportChannel)
            supabase.removeChannel(jobChannel)
        }
    }, [submission.id])

    const fetchItems = async (reportId: string) => {
        const supabase = createClient()
        const { data } = await supabase
            .from('report_items')
            .select('*')
            .eq('report_id', reportId)

        if (data) setItems(data)
    }

    const isAnalyzing = submission.status === 'analyzing' || submission.status === 'queued'

    const scoreColor = (score: number) => {
        if (criticalItems.length > 0) return 'text-red-500'
        if (score >= 80) return 'text-green-500'
        if (score >= 50) return 'text-yellow-500'
        return 'text-red-500'
    }

    const [currentLogIndex, setCurrentLogIndex] = useState(0)
    const [isStopping, setIsStopping] = useState(false)
    const logsContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll logs when new content appears
    useEffect(() => {
        if (logsContainerRef.current) {
            logsContainerRef.current.scrollTo({
                top: logsContainerRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [currentLogIndex])

    const handleStopReview = async () => {
        if (isStopping) return
        setIsStopping(true)

        try {
            // Dynamic import of the server action
            const { stopReview } = await import('@/app/report/[id]/actions')
            const result = await stopReview(submission.id)

            if (!result.success) {
                console.error('[Stop Review] Server action failed:', result.error)
                setIsStopping(false)
                return
            }

            console.log('[Stop Review] Successfully stopped')
            // Redirect to dashboard after stopping
            window.location.href = '/dashboard'
        } catch (err) {
            console.error('[Stop Review] Exception:', err)
            setIsStopping(false)
        }
    }

    const logs = [
        "Initializing analysis runtime...",
        "Loading submission context from secure storage...",
        "Processing IPA binary structure...",
        "Parsing metadata and configuration files...",
        "Running App Store Guidelines v5.3 compliance check...",
        "Analyzing Privacy Manifest for tracking declarations...",
        "Cross-referencing Info.plist with binary entitlements...",
        "Auditing screenshots for UI/UX patterns...",
        "Validating URL reachability for Support and Privacy links...",
        "Checking for incentivized review patterns...",
        "Verifying third-party SDK signatures...",
        "Generating final compliance report..."
    ]

    const logHexCodes = useMemo(() => logs.map(() => Math.random().toString(16).substring(2, 6).toUpperCase()), [])
    const dataStreams = useMemo(() => Array.from({ length: 12 }).map(() =>
        Array.from({ length: 20 }).map(() => Math.random().toString(16).substring(2, 10)).join(' ')
    ), [])

    // Stabilize telemetry values
    const [ioBuffer, setIoBuffer] = useState(0)
    useEffect(() => {
        if (isAnalyzing) {
            const interval = setInterval(() => setIoBuffer(Math.floor(Math.random() * 500) + 500), 2000)
            return () => clearInterval(interval)
        }
    }, [isAnalyzing])

    const [isClient, setIsClient] = useState(false)
    useEffect(() => { setIsClient(true) }, [])

    useEffect(() => {
        // Advance logs for any analyzing state - pending, running, or while job hasn't loaded yet
        // This provides smoother UX during the initial loading/connection period
        if (isAnalyzing) {
            const interval = setInterval(() => {
                setCurrentLogIndex(prev => {
                    if (prev < logs.length - 1) return prev + 1
                    return prev
                })
            }, 2500)
            return () => clearInterval(interval)
        }
    }, [isAnalyzing, logs.length])

    if (isAnalyzing && isClient) {
        return (
            <div className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
                {/* Global Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none z-[100] opacity-[0.03]"
                    style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />

                {/* Background: Adaptive Data Stream */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden flex justify-around">
                    {dataStreams.map((stream: string, i: number) => (
                        <div key={i} className="text-[10px] font-mono whitespace-nowrap animate-matrix" style={{ animationDelay: `${i * 0.7}s`, writingMode: 'vertical-rl' }}>
                            {stream}
                        </div>
                    ))}
                </div>

                {/* Corner Technical Accents */}
                <div className="absolute top-8 left-8 flex flex-col gap-1 opacity-20 font-mono text-[10px] tracking-widest text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                        <span>BRIDGE_SYNC_ACTIVE</span>
                    </div>
                    <div>IO_BUFFER: {ioBuffer}KB/S</div>
                    <div>SID: {submission.id?.substring(0, 8).toUpperCase()}</div>
                </div>

                <div className="absolute top-8 right-8 flex flex-col items-end gap-1 opacity-20 font-mono text-[10px] tracking-widest text-gray-500">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-400">LAT: 37.7749 // LNG: -122.4194</span>
                        <div className="w-1.5 h-1.5 bg-gray-600" />
                    </div>
                    <div>SCAN_DEPTH: 2.44ms</div>
                    <div>AUDIT_SESSION_ID: PRE_00{submission.id.length}</div>
                </div>

                <div className="max-w-5xl w-full space-y-8 relative z-10 scale-95 md:scale-100 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <FileText className="w-5 h-5 text-blue-500 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Reviewing {submission.app_name}_</h2>
                                <div className="text-[10px] font-mono text-blue-500/50 tracking-[0.3em] uppercase animate-pulse">Neural_Audit_Active</div>
                            </div>
                        </div>

                        <button
                            onClick={handleStopReview}
                            disabled={isStopping}
                            className="vercel-btn-secondary py-2 px-6 text-[10px] font-black tracking-widest border-red-500/20 text-red-500/60 hover:text-white hover:bg-red-500/80 hover:border-red-500 transition-all rounded-full disabled:opacity-50"
                        >
                            {isStopping ? "HALTING..." : "STOP REVIEW"}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Terminal Log: High Fidelity Edition */}
                        <div className="vercel-card bg-black/60 backdrop-blur-3xl border-white/10 p-0 overflow-hidden min-h-[400px] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.3)] relative">
                            {/* Scanning horizontal line */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/30 z-20 animate-scan" />

                            <div className="bg-white/[0.03] px-5 py-3 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500/40" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                                        <div className="w-2 h-2 rounded-full bg-green-500/40" />
                                    </div>
                                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] border-l border-white/10 pl-3">SYSTEM_OUTPUT</span>
                                </div>
                                <div className="text-[9px] font-mono text-blue-500/50">0xAE44_F2</div>
                            </div>

                            <div ref={logsContainerRef} className="p-6 font-mono text-[11px] space-y-3 h-[340px] overflow-y-auto scrollbar-hide mask-gradient-b">
                                {logs.slice(0, currentLogIndex + 1).map((log, i) => (
                                    <div key={i} className="flex gap-4 text-gray-500 animate-in fade-in slide-in-from-left-4 duration-500">
                                        <span className="text-blue-500/40 shrink-0">[{logHexCodes[i]}]</span>
                                        <span className={cn(
                                            "leading-relaxed break-words",
                                            i === currentLogIndex ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] animate-typewriter" : "text-gray-600"
                                        )}>
                                            {i === currentLogIndex ? "> " : "  "}{log}
                                            {i === currentLogIndex && <span className="inline-block w-1.5 h-3 bg-blue-500 ml-1 animate-blink align-middle" />}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status Grid: High Fidelity Edition */}
                        <div className="space-y-4">
                            {[
                                {
                                    icon: Shield,
                                    label: "Compliance Scan",
                                    sub: "0x1: Hard Rule Validation",
                                    status: job?.hard_rules_completed ? "Complete" : job?.status === 'running' ? "Running" : "Pending",
                                    progress: job?.hard_rules_completed ? 100 : job?.status === 'running' ? Math.min(90, (currentLogIndex / 4) * 100) : 0
                                },
                                {
                                    icon: FileText,
                                    label: "Heuristic Checklist",
                                    sub: "0x2: Intelligent Audit",
                                    status: job?.soft_rules_completed ? "Complete" : job?.hard_rules_completed ? "Running" : "Queued",
                                    progress: job?.soft_rules_completed ? 100 : job?.hard_rules_completed ? Math.min(90, ((currentLogIndex - 4) / 4) * 100) : 0
                                },
                                {
                                    icon: Zap,
                                    label: "AI Vision Audit",
                                    sub: "0x3: Neural Interface Scan",
                                    status: report?.id ? "Complete" : job?.soft_rules_completed ? "Running" : "Queued",
                                    progress: report?.id ? 100 : job?.soft_rules_completed ? Math.min(90, ((currentLogIndex - 8) / 4) * 100) : 0
                                }
                            ].map((p, i) => (
                                <div key={i} className="vercel-card p-5 border-white/5 bg-white/[0.02] flex items-center justify-between group overflow-hidden relative backdrop-blur-3xl hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className={cn(
                                            "p-3 rounded-xl transition-all duration-700",
                                            p.status === 'Complete' ? "bg-green-500/10 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]" :
                                                p.status === 'Running' ? "bg-blue-500/10 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "bg-white/5 text-gray-700"
                                        )}>
                                            <p.icon className={cn("w-5 h-5", p.status === 'Running' && "animate-pulse")} />
                                        </div>
                                        <div>
                                            <div className="text-[7px] font-black tracking-[0.4em] text-gray-500 uppercase mb-1">{p.sub}</div>
                                            <div className="text-xs font-bold tracking-wider text-white uppercase">{p.label}</div>
                                            <div className="text-[10px] font-mono text-gray-500 mt-1 flex items-center gap-2">
                                                {p.status === 'Running' ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                                        <span className="text-blue-500">PROCESSING_STREAM...</span>
                                                    </>
                                                ) : (
                                                    <span>STATUS: {p.status.toUpperCase()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* HUD Circular Progress */}
                                    <div className="relative w-12 h-12 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="24" cy="24" r="20" className="stroke-white/5 fill-none" strokeWidth="2" />
                                            <circle
                                                cx="24" cy="24" r="20"
                                                className={cn("fill-none transition-all duration-1000", p.status === 'Complete' ? "stroke-green-500" : "stroke-blue-500")}
                                                strokeWidth="2"
                                                strokeDasharray={125.6}
                                                strokeDashoffset={125.6 - (125.6 * p.progress) / 100}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <span className="absolute text-[8px] font-mono text-white/50">{Math.round(p.progress)}%</span>
                                    </div>

                                    {/* Scanline background */}
                                    {p.status === 'Running' && (
                                        <div className="absolute inset-x-0 top-0 h-[1px] bg-blue-500/50 animate-scan z-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {job?.status === 'failed' && (
                        <div className="bg-red-500/[0.02] border border-red-500/20 backdrop-blur-2xl rounded-2xl p-8 mt-12 flex flex-col items-center gap-6 animate-in fade-in zoom-in slide-in-from-top-6 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <AlertCircle className="w-8 h-8 text-red-500 animate-pulse" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-red-500 font-black text-xl tracking-tighter uppercase italic">Analysis Engine Fault</h3>
                                <p className="text-red-400/60 text-xs font-mono max-w-sm mx-auto leading-relaxed uppercase tracking-widest">{job.error_message || "Critical interruption detected in review stream_ (0x000F)"}</p>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="vercel-btn-secondary px-10 text-[10px] font-black tracking-[0.2em] border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-full py-3"
                            >
                                RE-INITIALIZE BRIDGE_
                            </button>
                        </div>
                    )}

                    <div className="pt-12 text-center text-[10px] text-gray-800 font-mono italic uppercase tracking-[0.8em] animate-pulse">
                        Preflight_System_Protocol_v3.2.1 // Ready_to_Deploy
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-6 max-w-5xl py-12">
            {/* Header */}
            <header className="flex justify-between items-start mb-12">
                <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold">
                        {submission.app_name?.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter">{submission.app_name}</h1>
                        <div className="flex items-center gap-3 text-sm text-gray-500 font-light mt-1">
                            <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold text-white">Full Review</span>
                            <span>v{submission.version || '1.0'}</span>
                            <span>&middot;</span>
                            <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="vercel-btn-secondary py-1.5 flex items-center gap-2 text-xs">
                        <Download className="w-3.5 h-3.5" /> Export PDF
                    </button>
                    <Link href="/dashboard" className="vercel-btn-secondary py-1.5 flex items-center gap-2 text-xs">
                        <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
                    </Link>
                </div>
            </header>

            {/* Main HUD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="vercel-card md:col-span-2 flex flex-col justify-center py-12 px-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">System Health</div>
                            <div className={cn("text-7xl font-bold tracking-tighter", scoreColor(report?.score_overall))}>
                                {report?.score_overall ?? 0}
                            </div>
                            <div className="text-sm text-gray-400 font-light italic">
                                {criticalItems.length > 0 ? "Critical Rejection Risk" : "Optimized for Approval"}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <StatusLight status={criticalItems.length > 0 ? 'critical' : 'ready'} />
                                <span className="text-xs font-mono">APP_STORE_COMPLIANCE</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusLight status={warningItems.length > 0 ? 'warning' : 'ready'} />
                                <span className="text-xs font-mono">METADATA_INTEGRITY</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusLight status="ready" />
                                <span className="text-xs font-mono">SANDBOX_VALIDATION</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="vercel-card p-6 flex flex-col justify-between">
                    <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-4">Issue Matrix</div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-xs">Critical</span>
                            </div>
                            <span className="font-mono font-bold text-red-500">{criticalItems.length}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                                <span className="text-xs">Warnings</span>
                            </div>
                            <span className="font-mono font-bold text-yellow-500">{warningItems.length}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-500" />
                                <span className="text-xs">Suggestions</span>
                            </div>
                            <span className="font-mono font-bold text-blue-500">{infoItems.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Issues List */}
            <div className="space-y-8">
                <h2 className="text-xl font-bold tracking-tight border-b border-white/10 pb-4">Analysis Findings</h2>

                {items.length === 0 ? (
                    <div className="vercel-card py-24 flex flex-col items-center text-center">
                        <Check className="w-12 h-12 text-green-500 mb-6" />
                        <h3 className="text-xl font-medium mb-2">No Issues Found</h3>
                        <p className="text-gray-400 text-sm font-light">Your application matches all analyzed App Store guidelines.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map(item => (
                            <div key={item.id} className={cn(
                                "vercel-card border-l-4",
                                item.severity === 'critical' ? 'border-l-red-500' :
                                    item.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                            )}>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{item.category?.replace('_', ' ')}</span>
                                            {item.guideline_ref && <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded">Rule {item.guideline_ref}</span>}
                                        </div>
                                        <h3 className="text-lg font-bold tracking-tight">{item.title}</h3>
                                        <p className="text-sm text-gray-400 font-light leading-relaxed">{item.description}</p>

                                        {item.fix_suggestion && (
                                            <div className="mt-4 bg-white/5 rounded-lg border border-white/5 p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase">Recommended Fix</span>
                                                    <button
                                                        className="text-gray-500 hover:text-white transition-colors"
                                                        onClick={() => navigator.clipboard.writeText(item.fix_suggestion)}
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-300 font-mono leading-relaxed">{item.fix_suggestion}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
