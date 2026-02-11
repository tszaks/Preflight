import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export async function Navbar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let credits: number | null = null;

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .maybeSingle();

        credits = typeof profile?.credits === "number" ? profile.credits : 0;
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

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <Link
                                href="/pricing"
                                className="text-xs font-mono text-gray-300 border border-white/10 bg-white/5 px-2.5 py-1 rounded-md hover:border-white/30 transition-colors"
                            >
                                {credits?.toLocaleString() ?? 0} credits
                            </Link>
                            <Link href="/dashboard" className="text-sm font-light text-gray-400 hover:text-white transition-colors">
                                Dashboard
                            </Link>
                            <form action={logout}>
                                <button type="submit" className="vercel-btn-secondary py-1.5 px-3 text-xs">
                                    Log out
                                </button>
                            </form>
                        </>
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
