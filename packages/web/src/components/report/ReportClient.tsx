'use client'

import { useState, useEffect, useRef } from 'react'
import { StatusLight } from '@/components/ui/status'
import { Check, AlertCircle, Info, ArrowLeft, Download, Copy, Shield } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/components/ui/status'
import { createClient } from '@/lib/supabase/client'

function computeCompletenessFromReportAndItems(
    report: ReportSummary | null,
    items: ReportItem[]
): number {
    if (!report) return 0

    const titles = new Set(items.map((i) => (i.title || '').trim()))

    const hasScreenshots = report.score_screenshots != null && !titles.has('No screenshots provided')
    const hasPrivacyManifest = report.score_privacy != null && !titles.has('No privacy manifest provided')
    const hasPlist = report.score_plist != null && !titles.has('No Info.plist provided')
    const hasIpa = report.score_ipa_binary != null && !titles.has('No IPA binary provided')

    const providedCount = [hasScreenshots, hasPrivacyManifest, hasPlist, hasIpa].filter(Boolean).length
    return Math.round((providedCount / 4) * 100)
}

interface ReportClientProps {
    initialSubmission: SubmissionSummary
    initialReport: ReportSummary | null
    initialItems: ReportItem[]
}

interface TerminalLine {
    id: string
    type: 'command' | 'info' | 'check' | 'ok' | 'fail' | 'divider' | 'blank' | 'result'
    text: string
    status?: 'pending' | 'done'
    phase?: 'hard' | 'soft' | 'report'
}

type AnalysisPhase = 'init' | 'hard' | 'soft' | 'report' | 'done' | 'failed'

interface SubmissionSummary {
    id: string
    app_name?: string | null
    version?: string | null
    status?: string | null
    created_at?: string
}

interface ReportSummary {
    id?: string
    score_metadata?: number | null
    score_screenshots?: number | null
    score_privacy?: number | null
    score_plist?: number | null
    score_urls?: number | null
    score_content?: number | null
    score_ipa_binary?: number | null
    score_overall?: number | null
}

interface ReportItem {
    id: string
    severity: 'critical' | 'warning' | 'info' | 'pass' | string
    category?: string | null
    guideline_ref?: string | null
    title?: string | null
    description?: string | null
    fix_suggestion?: string | null
    confidence?: number | null
    pattern_id?: string | null
}

interface AnalysisJob {
    status?: string | null
    hard_rules_completed?: boolean
    soft_rules_completed?: boolean
    error_message?: string | null
}

const HARD_CHECKS = [
    'Validating app name and keywords...',
    'Checking screenshots...',
    'Analyzing privacy manifest...',
    'Parsing Info.plist configuration...',
    'Testing URL reachability...',
    'Scanning IPA binary...',
]

const SOFT_CHECKS = [
    'AI analyzing app description...',
    'Checking content guidelines...',
    'AI reviewing screenshots...',
    'Cross-checking privacy policy...',
    'Generating ASO recommendations...',
    'Running ASO analysis...',
]

const REPORT_CHECKS = [
    'Calculating scores...',
    'Saving report...',
]

const PHASE_ORDER: AnalysisPhase[] = ['init', 'hard', 'soft', 'report', 'done', 'failed']

function asciiProgressBar(percent: number, width = 14): string {
    const filled = Math.round((percent / 100) * width)
    const empty = width - filled
    return `[${'\u2588'.repeat(filled)}${'\u2591'.repeat(empty)}] ${String(Math.round(percent)).padStart(3)}%`
}

export default function ReportClient({ initialSubmission, initialReport, initialItems }: ReportClientProps) {
    const [submission, setSubmission] = useState<SubmissionSummary>(initialSubmission)
    const [report, setReport] = useState<ReportSummary | null>(initialReport)
    const [items, setItems] = useState<ReportItem[]>(initialItems)
    const [job, setJob] = useState<AnalysisJob | null>(null)

    // Severity sorting
    const isManualReview = (i: ReportItem) =>
        (i.title || '').trimStart().toLowerCase().startsWith('manual review:')

    const manualReviewItems = items.filter(isManualReview)
    const nonManualItems = items.filter(i => !isManualReview(i))

    const criticalItems = nonManualItems.filter(i => i.severity === 'critical')
    const warningItems = nonManualItems.filter(i => i.severity === 'warning')
    const infoItems = nonManualItems.filter(i => i.severity === 'info')

    const riskScore = report?.score_overall ?? 0
    const completeness = computeCompletenessFromReportAndItems(report, items)

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
                    setSubmission(payload.new as SubmissionSummary)
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
                    const nextReport = payload.new as ReportSummary
                    setReport(nextReport)
                    if (nextReport?.id) {
                        fetchItems(nextReport.id)
                    }
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
                    setJob(payload.new as AnalysisJob)
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
            if (data) setJob(data as AnalysisJob)
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

        if (data) setItems(data as ReportItem[])
    }

    const isAnalyzing = submission.status === 'analyzing' || submission.status === 'queued'

    const scoreColor = (score: number) => {
        if (criticalItems.length > 0) return 'text-red-500'
        if (score >= 80) return 'text-green-500'
        if (score >= 50) return 'text-yellow-500'
        return 'text-red-500'
    }

    // ── Terminal State ──────────────────────────────────────
    const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
    const [currentPhase, setCurrentPhase] = useState<AnalysisPhase>('init')
    const [isStopping, setIsStopping] = useState(false)
    const [isClient, setIsClient] = useState(false)
    const terminalRef = useRef<HTMLDivElement>(null)
    const phaseCheckIndex = useRef(0)

    useEffect(() => { setIsClient(true) }, [])

    // Auto-scroll terminal when new lines appear
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTo({
                top: terminalRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [terminalLines])

    const handleStopReview = async () => {
        if (isStopping) return
        setIsStopping(true)

        try {
            const { stopReview } = await import('@/app/report/[id]/actions')
            const result = await stopReview(submission.id)

            if (!result.success) {
                console.error('[Stop Review] Server action failed:', result.error)
                setIsStopping(false)
                return
            }

            console.log('[Stop Review] Successfully stopped')
            window.location.href = '/dashboard'
        } catch (err) {
            console.error('[Stop Review] Exception:', err)
            setIsStopping(false)
        }
    }

    // Initialize terminal when analyzing starts
    useEffect(() => {
        if (!isAnalyzing || !isClient) return
        const now = new Date()
        setTerminalLines([
            { id: 'cmd', type: 'command', text: `preflight analyze "${submission.app_name}" --version ${submission.version || '1.0'} --full` },
            { id: 'blank1', type: 'blank', text: '' },
            { id: 'h1', type: 'info', text: '[PREFLIGHT] v3.2.1 -- App Store Review Engine' },
            { id: 'h2', type: 'info', text: `[PREFLIGHT] Submission: ${submission.id?.substring(0, 8)}` },
            { id: 'h3', type: 'info', text: `[PREFLIGHT] Started: ${now.toISOString().replace('T', ' ').substring(0, 19)} UTC` },
            { id: 'blank2', type: 'blank', text: '' },
        ])
        setCurrentPhase('init')
        phaseCheckIndex.current = 0
    }, [isAnalyzing, isClient]) // eslint-disable-line react-hooks/exhaustive-deps

    // Phase transitions based on job state
    useEffect(() => {
        if (!job || !isAnalyzing) return

        if (job.status === 'failed' && currentPhase !== 'failed') {
            setCurrentPhase('failed')
            const ts = Date.now()
            setTerminalLines(prev => [
                ...prev,
                { id: `blank-f-${ts}`, type: 'blank', text: '' },
                { id: `fail-${ts}`, type: 'fail', text: job.error_message || 'Analysis failed unexpectedly' },
            ])
            return
        }

        // Determine target phase from job state
        let target: AnalysisPhase = 'init'
        if (job.soft_rules_completed) target = 'report'
        else if (job.hard_rules_completed) target = 'soft'
        else if (job.status === 'running') target = 'hard'

        const currentIdx = PHASE_ORDER.indexOf(currentPhase)
        const targetIdx = PHASE_ORDER.indexOf(target)
        if (targetIdx <= currentIdx) return

        const newLines: TerminalLine[] = []
        const ts = Date.now()

        // Entering hard phase
        if (currentIdx < 1 && targetIdx >= 1) {
            newLines.push({ id: `hard-div-${ts}`, type: 'divider', text: 'Phase 1: Compliance Scan' })
        }
        // Completing hard phase (fast-forward remaining checks)
        if (currentIdx <= 1 && targetIdx > 1) {
            const start = currentPhase === 'hard' ? phaseCheckIndex.current : 0
            HARD_CHECKS.slice(start).forEach((text, i) => {
                newLines.push({ id: `h-${start + i}-${ts}`, type: 'check', text, status: 'done', phase: 'hard' })
            })
            newLines.push({ id: `hard-ok-${ts}`, type: 'ok', text: 'Hard rules complete' })
            newLines.push({ id: `blank-hs-${ts}`, type: 'blank', text: '' })
        }
        // Entering soft phase
        if (currentIdx < 2 && targetIdx >= 2) {
            newLines.push({ id: `soft-div-${ts}`, type: 'divider', text: 'Phase 2: Heuristic Analysis' })
        }
        // Completing soft phase
        if (currentIdx <= 2 && targetIdx > 2) {
            const start = currentPhase === 'soft' ? phaseCheckIndex.current : 0
            SOFT_CHECKS.slice(start).forEach((text, i) => {
                newLines.push({ id: `s-${start + i}-${ts}`, type: 'check', text, status: 'done', phase: 'soft' })
            })
            newLines.push({ id: `soft-ok-${ts}`, type: 'ok', text: 'Heuristic analysis complete' })
            newLines.push({ id: `blank-sr-${ts}`, type: 'blank', text: '' })
        }
        // Entering report phase
        if (currentIdx < 3 && targetIdx >= 3) {
            newLines.push({ id: `report-div-${ts}`, type: 'divider', text: 'Phase 3: Report Generation' })
        }

        phaseCheckIndex.current = 0
        setCurrentPhase(target)
        if (newLines.length > 0) {
            setTerminalLines(prev => [...prev, ...newLines])
        }
    }, [job, currentPhase, isAnalyzing])

    // Report completion
    useEffect(() => {
        if (!report?.id || currentPhase !== 'report') return
        const remaining = REPORT_CHECKS.slice(phaseCheckIndex.current)
        const ts = Date.now()
        setCurrentPhase('done')
        setTerminalLines(prev => [
            ...prev,
            ...remaining.map((text, i) => ({
                id: `r-ff-${i}-${ts}`,
                type: 'check' as const,
                text,
                status: 'done' as const,
                phase: 'report' as const,
            })),
            { id: `report-ok-${ts}`, type: 'ok', text: 'Report generation complete' },
            { id: `blank-done-${ts}`, type: 'blank', text: '' },
            { id: `done-${ts}`, type: 'result', text: 'Analysis complete. Preparing report...' },
        ])
    }, [report, currentPhase])

    // Trickle check lines one at a time
    useEffect(() => {
        if (!['hard', 'soft', 'report'].includes(currentPhase)) return
        const checks = currentPhase === 'hard' ? HARD_CHECKS :
                       currentPhase === 'soft' ? SOFT_CHECKS : REPORT_CHECKS
        const interval = setInterval(() => {
            const idx = phaseCheckIndex.current
            if (idx < checks.length) {
                const ts = Date.now()
                setTerminalLines(prev => [
                    ...prev,
                    {
                        id: `${currentPhase}-check-${idx}-${ts}`,
                        type: 'check',
                        text: checks[idx],
                        status: 'done',
                        phase: currentPhase as 'hard' | 'soft' | 'report',
                    }
                ])
                phaseCheckIndex.current = idx + 1
            }
        }, 2000)
        return () => clearInterval(interval)
    }, [currentPhase])

    // Phase status helpers for ASCII table
    const getPhaseStatus = (phase: 'hard' | 'soft' | 'report'): string => {
        if (currentPhase === 'failed') {
            const phaseIdx = PHASE_ORDER.indexOf(phase)
            const currentIdx = PHASE_ORDER.indexOf(currentPhase)
            return phaseIdx < currentIdx ? 'DONE' : 'FAIL'
        }
        if (currentPhase === 'done') return 'DONE'
        const phaseIdx = PHASE_ORDER.indexOf(phase)
        const currentIdx = PHASE_ORDER.indexOf(currentPhase)
        if (phaseIdx < currentIdx) return 'DONE'
        if (phaseIdx === currentIdx) return 'RUNNING'
        return 'QUEUED'
    }

    const getPhaseProgress = (phase: 'hard' | 'soft' | 'report'): number => {
        const status = getPhaseStatus(phase)
        if (status === 'DONE') return 100
        if (status === 'QUEUED' || status === 'FAIL') return 0
        const checks = phase === 'hard' ? HARD_CHECKS : phase === 'soft' ? SOFT_CHECKS : REPORT_CHECKS
        const doneCount = terminalLines.filter(l => l.type === 'check' && l.phase === phase).length
        return Math.round((doneCount / checks.length) * 100)
    }

    const statusColor = (status: string): string => {
        switch (status) {
            case 'DONE': return 'text-green-400'
            case 'RUNNING': return 'text-yellow-400'
            case 'QUEUED': return 'text-gray-600'
            case 'FAIL': return 'text-red-400'
            default: return 'text-gray-500'
        }
    }

    const TABLE_PHASES: { key: 'hard' | 'soft' | 'report'; label: string }[] = [
        { key: 'hard', label: 'Compliance Scan' },
        { key: 'soft', label: 'Heuristic Analysis' },
        { key: 'report', label: 'Report Generation' },
    ]

    if (isAnalyzing && isClient) {
        return (
            <div className="fixed inset-0 bg-[#1a1a1a] z-50 flex flex-col">
                {/* Title bar */}
                <div className="bg-[#2a2a2a] border-b border-[#3a3a3a] px-4 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleStopReview}
                                disabled={isStopping}
                                className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff3b30] transition-colors disabled:opacity-50 cursor-pointer"
                                title="Stop Review"
                            />
                            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span className="text-xs font-mono text-gray-400 ml-2">
                            preflight &mdash; analyzing {submission.app_name} v{submission.version || '1.0'}
                        </span>
                    </div>
                    {isStopping && (
                        <span className="text-xs font-mono text-yellow-400 animate-pulse">Stopping...</span>
                    )}
                </div>

                {/* Terminal body */}
                <div
                    ref={terminalRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed"
                >
                    {/* Log lines */}
                    {terminalLines.map((line) => (
                        <div key={line.id} className="animate-terminal-line">
                            {line.type === 'command' && (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-green-400 select-none">$</span>
                                    <span className="text-white">{line.text}</span>
                                </div>
                            )}
                            {line.type === 'info' && (
                                <div className="text-cyan-400">{line.text}</div>
                            )}
                            {line.type === 'check' && (
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-300">
                                        {'  '}
                                        <span className="text-yellow-400">[CHECK]</span>
                                        {' '}{line.text}
                                    </span>
                                    {line.status === 'done' && (
                                        <span className="text-green-400 shrink-0">DONE</span>
                                    )}
                                </div>
                            )}
                            {line.type === 'ok' && (
                                <div className="text-green-400">{'  '}[ OK ] {line.text}</div>
                            )}
                            {line.type === 'fail' && (
                                <div className="text-red-400">{'  '}[FAIL] {line.text}</div>
                            )}
                            {line.type === 'divider' && (
                                <div className="text-gray-500">
                                    {'-- '}{line.text}{' '}{'-'.repeat(Math.max(0, 50 - line.text.length))}
                                </div>
                            )}
                            {line.type === 'blank' && (
                                <div className="h-5" />
                            )}
                            {line.type === 'result' && (
                                <div className="text-green-400 font-bold">[DONE] {line.text}</div>
                            )}
                        </div>
                    ))}

                    {/* ASCII Status Table */}
                    {currentPhase !== 'init' && (
                        <div className="mt-6 whitespace-pre text-gray-500 overflow-x-auto text-xs">
                            <div>{'\u250c' + '\u2500'.repeat(24) + '\u252c' + '\u2500'.repeat(10) + '\u252c' + '\u2500'.repeat(24) + '\u2510'}</div>
                            <div>{'\u2502' + ' PHASE'.padEnd(24) + '\u2502' + ' STATUS'.padEnd(10) + '\u2502' + ' PROGRESS'.padEnd(24) + '\u2502'}</div>
                            <div>{'\u251c' + '\u2500'.repeat(24) + '\u253c' + '\u2500'.repeat(10) + '\u253c' + '\u2500'.repeat(24) + '\u2524'}</div>
                            {TABLE_PHASES.map(({ key, label }) => {
                                const status = getPhaseStatus(key)
                                const progress = getPhaseProgress(key)
                                const bar = asciiProgressBar(progress)
                                return (
                                    <div key={key}>
                                        {'\u2502' + (' ' + label).padEnd(24) + '\u2502 '}
                                        <span className={statusColor(status)}>{status.padEnd(8)}</span>
                                        {' \u2502' + (' ' + bar).padEnd(24) + '\u2502'}
                                    </div>
                                )
                            })}
                            <div>{'\u2514' + '\u2500'.repeat(24) + '\u2534' + '\u2500'.repeat(10) + '\u2534' + '\u2500'.repeat(24) + '\u2518'}</div>
                        </div>
                    )}

                    {/* Blinking cursor */}
                    {currentPhase !== 'done' && (
                        <div className="mt-2">
                            <span className="inline-block w-2 h-4 bg-gray-300 animate-blink" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-[#2a2a2a] border-t border-[#3a3a3a] px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
                    <span className="text-xs font-mono text-gray-600">
                        Press Ctrl+C to cancel
                    </span>
                    <button
                        onClick={handleStopReview}
                        disabled={isStopping}
                        className="text-xs font-mono text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                        {isStopping ? 'Stopping...' : 'Stop Review'}
                    </button>
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
                            <span>{submission.created_at ? new Date(submission.created_at).toLocaleDateString() : 'N/A'}</span>
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
                            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Rejection Risk</div>
                            <div className={cn("text-7xl font-bold tracking-tighter", scoreColor(riskScore))}>
                                {riskScore}
                            </div>
                            <div className="text-sm text-gray-400 font-light italic">
                                {criticalItems.length > 0 ? "Critical rejection risk" : "Optimized for approval"}
                                <span className="ml-3 text-gray-500">Completeness {completeness}%</span>
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
                        {manualReviewItems.length > 0 && (
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs">Manual Review</span>
                                </div>
                                <span className="font-mono font-bold text-gray-400">{manualReviewItems.length}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* What We Analyzed */}
            <div className="vercel-card p-6 mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <h2 className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">What We Analyzed</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'App Metadata', detail: 'Name, description, keywords, URLs' },
                        { label: 'Screenshots', detail: 'Dimensions, file size, compliance' },
                        { label: 'Info.plist', detail: 'Permissions, build settings' },
                        { label: 'Privacy Manifest', detail: 'API declarations, data usage' },
                        { label: 'IPA Binary', detail: 'Frameworks, entitlements, symbols' },
                        { label: 'Privacy Audit', detail: 'Manifest vs detected SDKs' },
                        { label: 'URL Reachability', detail: 'Privacy policy, support URLs' },
                        { label: 'Apple Guidelines', detail: 'Account deletion, SIWA, IAP' },
                    ].map((check) => (
                        <div key={check.label} className="bg-white/5 rounded-lg border border-white/5 p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Check className="w-3 h-3 text-green-500 shrink-0" />
                                <span className="text-xs font-medium">{check.label}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 leading-tight">{check.detail}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Issues List */}
            <div className="space-y-8">
                <h2 className="text-xl font-bold tracking-tight border-b border-white/10 pb-4">Analysis Findings</h2>

                {nonManualItems.length === 0 ? (
                    <div className="vercel-card py-24 flex flex-col items-center text-center">
                        <Check className="w-12 h-12 text-green-500 mb-6" />
                        <h3 className="text-xl font-medium mb-2">No Issues Found</h3>
                        <p className="text-gray-400 text-sm font-light">Your application matches all analyzed App Store guidelines.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {nonManualItems.map(item => (
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
                                                            onClick={() => navigator.clipboard.writeText(item.fix_suggestion ?? '')}
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

                {manualReviewItems.length > 0 && (
                    <details className="vercel-card p-6">
                        <summary className="cursor-pointer text-sm font-medium text-gray-300">
                            Manual Review ({manualReviewItems.length})
                        </summary>
                        <div className="mt-4 space-y-3">
                            {manualReviewItems.map((item) => (
                                <div key={item.id} className="bg-white/5 rounded-lg border border-white/5 p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                                            {item.category?.replace('_', ' ')}
                                        </span>
                                        {item.guideline_ref && (
                                            <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded">
                                                Rule {item.guideline_ref}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm font-semibold">{item.title}</div>
                                    {item.description && (
                                        <div className="text-xs text-gray-400 font-light mt-1">{item.description}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        </div>
    )
}
