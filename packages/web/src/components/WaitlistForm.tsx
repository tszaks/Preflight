"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !email.includes("@")) return;

        setStatus("loading");
        setErrorMsg("");

        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Something went wrong");
            }

            setStatus("success");
        } catch (err) {
            setStatus("error");
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        }
    }

    if (status === "success") {
        return (
            <div className="flex items-center gap-3 px-6 py-4 rounded-lg border border-white/10 bg-white/[0.03]">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <span className="text-sm text-gray-300">
                    You&apos;re on the list. We&apos;ll let you know when PreFlight is ready for takeoff.
                </span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-gray-600 text-sm font-light focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all"
            />
            <button
                type="submit"
                disabled={status === "loading"}
                className="vercel-btn-primary flex items-center justify-center gap-2 py-3 px-6 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        Join the Waitlist <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>
            {status === "error" && (
                <p className="text-red-400 text-xs mt-1 sm:absolute sm:bottom-[-24px]">{errorMsg}</p>
            )}
        </form>
    );
}
