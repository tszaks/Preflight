import Link from "next/link";
import Image from "next/image";
// import { createClient } from "@/lib/supabase/server"; // WAITLIST MODE

export async function Navbar() {
    // WAITLIST MODE — commented out auth check
    // const supabase = await createClient();
    // const { data: { user } } = await supabase.auth.getUser();

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

                {/* WAITLIST MODE — auth links commented out
                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <Link href="/dashboard" className="text-sm font-light text-gray-400 hover:text-white transition-colors">
                                Dashboard
                            </Link>
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
                */}
            </div>
        </nav>
    );
}
