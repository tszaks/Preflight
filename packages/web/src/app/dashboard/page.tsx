import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cn, StatusLight } from "@/components/ui/status";
export const dynamic = "force-dynamic";
import { ArrowRight, Plus } from "lucide-react";
import { ArchiveButton } from "@/components/ArchiveButton";

type Submission = {
    id: string;
    status: string;
    app_name?: string | null;
    created_at: string;
    is_rereviewing?: boolean | null;
};

type DashboardSearchParams = {
    promo?: string;
    credits?: string;
    reason?: string;
};

function mapPromoFailureReason(reason?: string): string {
    switch (reason) {
        case 'not_eligible_existing_user':
            return 'This promo is only for newly created accounts.';
        case 'already_redeemed':
            return 'This account has already redeemed this campaign.';
        case 'cap_reached':
            return 'This promo has reached its redemption limit.';
        case 'expired':
            return 'This promo has expired.';
        case 'not_started':
            return 'This promo is not active yet.';
        case 'inactive':
            return 'This promo is currently inactive.';
        case 'not_found':
            return 'This promo link is no longer valid.';
        default:
            return 'Promo could not be applied.';
    }
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<DashboardSearchParams>
}) {
    const params = await searchParams
    const supabase = await createClient();

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    // 2. Fetch Submissions (ONLY for current user)
    const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (submissionsError) {
        console.error("Error fetching submissions:", submissionsError);
    }

    const submissionRows = (submissions ?? []) as Submission[];
    const drafts = submissionRows.filter(s => s.status === 'draft' && !s.is_rereviewing);
    const active = submissionRows.filter(s => s.status !== 'draft' && !s.is_rereviewing);
    const promoStatus = params.promo;
    const promoCredits = Number(params.credits ?? '0');
    const promoFailureReason = mapPromoFailureReason(params.reason);

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }

    function mapStatus(status: string): 'neutral' | 'ready' | 'processing' | 'warning' | 'critical' {
        switch (status) {
            case "complete": return "ready";
            case "analyzing": return "processing";
            case "failed": return "critical";
            case "queued": return "warning";
            case "paid": return "warning";
            default: return "neutral";
        }
    }

    function SubmissionCard({ sub, variant = 'full' }: { sub: Submission, variant?: 'full' | 'draft' }) {
        return (
            <Link
                href={sub.status === 'draft' ? `/submit?draft=${sub.id}` : `/report/${sub.id}`}
                className={cn(
                    "block vercel-card group transition-all",
                    variant === 'draft' ? "p-4" : "p-6"
                )}
            >
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <div className="text-[10px] font-mono text-gray-600 tracking-widest uppercase">
                            PKT_{sub.id.substring(0, 4).toUpperCase()}
                        </div>
                        <h3 className={cn(
                            "font-medium group-hover:text-white transition-colors",
                            variant === 'draft' ? "text-base" : "text-lg"
                        )}>
                            {sub.app_name || "Untitled App"}
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                            <span className="text-white bg-white/5 px-1.5 py-0.5 rounded">
                                {variant === 'draft' ? 'Draft' : 'Full Review'}
                            </span>
                            <span>{formatDate(sub.created_at)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <StatusLight
                            status={mapStatus(sub.status)}
                            label={sub.status}
                            pulse={sub.status === 'analyzing' || sub.status === 'queued'}
                        />
                        <ArchiveButton submissionId={sub.id} />
                    </div>
                </div>
            </Link>
        )
    }

    return (
        <div className="container mx-auto px-6 max-w-5xl py-12">
            <header className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter mb-2">Your Reviews</h1>
                    <p className="text-sm text-gray-500 font-light">
                        Monitor your iOS app compliance and rejection risks.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link href="/pricing" className="vercel-btn-secondary py-1.5 text-xs">
                        Buy Credits
                    </Link>
                    <Link href="/submit" className="vercel-btn-primary py-1.5 flex items-center gap-1.5 text-xs plus-hover-spin">
                        <Plus className="w-3.5 h-3.5" /> New Review
                    </Link>
                </div>
            </header>

            {promoStatus === 'applied' && (
                <div className="mb-8 text-sm text-green-500 bg-green-500/10 border border-green-500/20 p-4 rounded-md">
                    +{Number.isFinite(promoCredits) && promoCredits > 0 ? promoCredits : 100} promo credits applied successfully.
                </div>
            )}

            {promoStatus === 'not_applied' && (
                <div className="mb-8 text-sm text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-md">
                    {promoFailureReason}
                </div>
            )}

            {(!submissions || (active.length === 0 && drafts.length === 0)) ? (
                <div className="vercel-card py-24 flex flex-col items-center text-center group">
                    <div className="mb-6 plus-hover-spin">
                        <Plus className="w-8 h-8 text-gray-500" />
                    </div>
                    <h2 className="text-xl font-medium mb-2">No Submissions Yet</h2>
                    <p className="text-gray-400 text-sm max-w-sm mb-8 font-light">
                        Upload your first iOS submission and Preflight will scan it against Apple&apos;s review guidelines.
                    </p>
                    <Link href="/submit" className="vercel-btn-primary flex items-center gap-2">
                        Begin Preflight Check <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Active Reviews */}
                    {active.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Active Reviews</h2>
                            <div className="space-y-4">
                                {active.map((sub) => (
                                    <SubmissionCard key={sub.id} sub={sub} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Drafts */}
                    {drafts.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Drafts</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {drafts.map((sub) => (
                                    <SubmissionCard key={sub.id} sub={sub} variant="draft" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
