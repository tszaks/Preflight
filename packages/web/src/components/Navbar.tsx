import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export async function Navbar() {
    const hasSupabaseEnv = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    let user = null;
    let creditsLabel = "0";
    let creditsUnavailable = false;

    if (hasSupabaseEnv) {
        const supabase = await createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        user = currentUser;

        if (user) {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("credits")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError) {
                creditsUnavailable = true;
                creditsLabel = "--";
            } else if (typeof profile?.credits === "number") {
                creditsLabel = profile.credits.toLocaleString();
            }
        }
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 h-16 flex items-center">
            <div className="container mx-auto px-6 max-w-5xl flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/preflight-brand.png"
                        alt="Preflight"
                        width={140}
                        height={32}
                        className="object-contain"
                        priority
                    />
                </Link>

                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="inline-flex items-center gap-1 rounded-2xl border border-white/15 bg-black/70 p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                            <Link
                                href="/credits"
                                className="inline-flex items-center h-9 px-3 rounded-xl border border-white/15 bg-white/[0.05] text-[12px] font-mono tracking-wide hover:bg-white/[0.12] transition-colors"
                            >
                                <span className={creditsUnavailable ? "text-gray-500" : "text-white"}>
                                    {creditsLabel}
                                </span>
                                <span className="text-gray-400 ml-1">credits</span>
                            </Link>
                            <Link
                                href="/pricing"
                                className="inline-flex items-center h-9 px-3 rounded-xl text-[11px] font-semibold tracking-[0.12em] uppercase text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                            >
                                Buy
                            </Link>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center h-9 px-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                            >
                                Dashboard
                            </Link>
                            <form action={logout}>
                                <button
                                    type="submit"
                                    className="inline-flex items-center h-9 px-3 rounded-xl border border-white/20 text-sm font-semibold text-white hover:bg-white/[0.1] transition-colors"
                                >
                                    Log out
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <Link href="/dashboard" className="text-sm font-light text-gray-400 hover:text-white transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/auth/login" className="vercel-btn-primary py-1.5 px-3 text-xs">
                                Log In
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
