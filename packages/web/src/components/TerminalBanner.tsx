"use client";

import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

const INSTALL_COMMAND = "npm install -g preflightlaunch";

export function TerminalBanner() {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(INSTALL_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <a
      href="#install"
      className="fixed top-16 left-0 right-0 z-40 bg-white/[0.03] backdrop-blur-sm border-b border-white/5 block hover:bg-white/[0.06] transition-colors duration-200 cursor-pointer"
    >
      <div className="container mx-auto px-6 max-w-5xl flex items-center justify-center gap-3 py-2">
        <Terminal className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <code className="font-mono text-xs text-gray-400">
          <span className="text-gray-600 mr-1.5">$</span>
          {INSTALL_COMMAND}
        </code>
        <button
          onClick={handleCopy}
          className="p-1 rounded text-gray-600 hover:text-white hover:bg-white/10 transition-all duration-200"
          aria-label="Copy install command"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </a>
  );
}
