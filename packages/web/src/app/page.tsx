import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CLIInstallSection } from "@/components/CLIInstallSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-gray-400 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            App Store Review Simulator
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 vercel-gradient-text leading-[1]">
            Never get rejected <br /> for something you could catch.
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-light">
            Preflight runs Apple's review checks on your submission before you hit Send.
            Catch rejection risks before they cost you a week in review purgatory.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/signup" className="vercel-btn-primary flex items-center justify-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#pricing" className="vercel-btn-secondary">
              View Pricing
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Built for indie iOS developers & small teams</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="vercel-card">
              <h3 className="text-lg font-medium mb-2">Metadata Analysis</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                Deep scans of app names, subtitles, and keywords for guideline violations and ASO optimization.
              </p>
            </div>
            <div className="vercel-card">
              <h3 className="text-lg font-medium mb-2">Technical Validation</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                Validation of Info.plist keys, bundle identifiers, and privacy manifest requirements.
              </p>
            </div>
            <div className="vercel-card">
              <h3 className="text-lg font-medium mb-2">AI Rule Review</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                Claude-powered analysis of app descriptions and privacy policies against Apple's Human Interface Guidelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Install */}
      <CLIInstallSection />

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 mt-20">
        <div className="container mx-auto px-6 max-w-5xl flex justify-between items-center">
          <span className="text-sm text-gray-500">© 2026 Preflight</span>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-white transition-colors underline-offset-4 hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors underline-offset-4 hover:underline">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
