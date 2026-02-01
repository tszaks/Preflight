"use client";

import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

export function TerminalBanner() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  return (
    <div className="fixed top-20 left-0 right-0 z-40 flex justify-center px-6 pointer-events-none">
      <a
        href="#install"
        className="pointer-events-auto inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 cursor-pointer"
      >
        <Terminal className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span className="text-xs text-gray-500 font-medium">Install the CLI</span>
        <span className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-2">
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
