"use client";

import { useState, useCallback } from "react";
import { Terminal, Copy, Check, ChevronRight } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-200"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

function InstallCard({
  label,
  command,
}: {
  label: string;
  command: string;
}) {
  return (
    <div className="group relative flex-1 min-w-0">
      <div className="absolute -inset-px rounded-lg bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative bg-[#0a0a0a] border border-[#333333] rounded-lg transition-colors duration-300 group-hover:border-gray-500">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#333333]/60">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
          </div>
        </div>
        <div className="relative px-4 py-4">
          <CopyButton text={command} />
          <div className="flex items-center gap-2 pr-10 overflow-x-auto scrollbar-hide">
            <span className="text-gray-500 select-none font-mono text-sm shrink-0">$</span>
            <code className="font-mono text-sm text-gray-200 whitespace-nowrap">{command}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

const usageCommands = [
  {
    command: "preflight login",
    comment: "Authenticate via browser",
  },
  {
    command: "preflight scan ./MyApp",
    comment: "Dry-run scan (free)",
  },
  {
    command: "preflight submit ./MyApp",
    comment: "Full AI analysis",
  },
  {
    command: "preflight report <id>",
    comment: "View results",
  },
];

export function CLIInstallSection() {
  return (
    <section className="py-24 border-t border-white/5">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white/5 border border-white/10">
            <Terminal className="w-4 h-4 text-gray-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter vercel-gradient-text">
            Install from your terminal
          </h2>
        </div>

        <p className="text-gray-400 text-lg max-w-xl mb-12 leading-relaxed font-light">
          One command to install. One command to scan. Get App Store
          rejection risks before Apple sees your submission.
        </p>

        {/* Install Method Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-16">
          <InstallCard
            label="npm"
            command="npm install -g preflightlaunch"
          />
          <InstallCard
            label="Homebrew"
            command="brew tap tszaks/preflight && brew install preflight"
          />
        </div>

        {/* Quick Usage */}
        <div className="relative">
          <div className="absolute -inset-px rounded-lg bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
          <div className="relative bg-[#0a0a0a] border border-[#333333] rounded-lg overflow-hidden">
            {/* Terminal chrome bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#333333]/60 bg-[#0a0a0a]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs font-mono text-gray-600 ml-2">
                ~/MyApp
              </span>
            </div>

            {/* Command lines */}
            <div className="px-5 py-5 space-y-3.5">
              {usageCommands.map((line, i) => (
                <div key={i} className="flex items-baseline gap-0 font-mono text-sm group/line">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5 mr-1.5" />
                  <span className="text-white whitespace-nowrap">{line.command}</span>
                  <span className="text-gray-600 ml-3 hidden sm:inline">
                    {"# " + line.comment}
                  </span>
                </div>
              ))}

              {/* Blinking cursor */}
              <div className="flex items-center gap-0 font-mono text-sm">
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0 mr-1.5" />
                <span className="w-2 h-4.5 bg-white animate-blink" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
