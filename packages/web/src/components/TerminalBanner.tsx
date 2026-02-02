"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Copy, Check, Terminal, ChevronRight } from "lucide-react";

export function TerminalBanner() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";

  async function handleCopy(e: React.MouseEvent, command: string, index: number) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  const commands = [
    "npm install -g preflightlaunch",
    "brew tap tszaks/preflight && brew install preflight",
  ];

  if (isHome) {
    return (
      <div className="fixed top-20 left-0 right-0 z-40 flex justify-center px-4 md:px-6 pointer-events-none">
        <a
          href="#install"
          className="pointer-events-auto inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-2 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Install the CLI</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0 md:hidden" />
          <span className="hidden md:block w-px h-3 bg-white/10" />
          <div className="hidden md:flex items-center gap-2">
            {commands.map((cmd, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-600 text-xs mx-1">or</span>}
                <code className="font-mono text-xs text-gray-400">
                  <span className="text-gray-600 mr-1">$</span>
                  {cmd.split(" ")[0] === "npm" ? "npm i -g preflightlaunch" : "brew install preflight"}
                </code>
                <button
                  onClick={(e) => handleCopy(e, cmd, i)}
                  className="p-1 rounded text-gray-600 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label={`Copy ${cmd.split(" ")[0]} command`}
                >
                  {copiedIndex === i ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </span>
            ))}
          </div>
        </a>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 pointer-events-none">
      <a
        href="/#install"
        className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 cursor-pointer"
      >
        <Terminal className="w-3 h-3 text-gray-500 shrink-0" />
        <code className="font-mono text-[11px] text-gray-500">
          npm i -g preflightlaunch
        </code>
        <button
          onClick={(e) => handleCopy(e, commands[0], 0)}
          className="p-0.5 rounded text-gray-600 hover:text-white hover:bg-white/10 transition-all duration-200"
          aria-label="Copy install command"
        >
          {copiedIndex === 0 ? (
            <Check className="w-2.5 h-2.5 text-green-400" />
          ) : (
            <Copy className="w-2.5 h-2.5" />
          )}
        </button>
      </a>
    </div>
  );
}
