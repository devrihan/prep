import React, { useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { RESOURCES } from "../data/resources.js";

const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

function ResourceCard({ r }) {
  const [copied, setCopied] = useState(false);
  const Icon = r.icon;
  const copy = async () => {
    try { await navigator.clipboard.writeText(r.url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <div className={`group relative overflow-hidden rounded-2xl border ${r.border} bg-zinc-900/70 p-5 transition hover:-translate-y-0.5`}>
      <div className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full ${r.glow} blur-3xl`} />
      <div className="relative flex items-start gap-4">
        <div className={`rounded-xl ${r.bg} p-3 ${r.text}`}><Icon size={22} /></div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold">{r.title}</h3>
          <p className="text-sm text-zinc-400">{r.description}</p>
          <p className="mt-1 truncate text-xs text-zinc-500">{host(r.url)}</p>
        </div>
      </div>
      <div className="relative mt-5 flex gap-2">
        <a href={r.url} target="_blank" rel="noopener noreferrer"
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border ${r.border} ${r.bg} px-3 py-2 text-sm font-medium ${r.text} hover:brightness-125`}>
          Open <ExternalLink size={14} />
        </a>
        <button onClick={copy} title="Copy link"
          className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
          {copied ? <><Check size={14} className="text-emerald-400" /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>
      </div>
    </div>
  );
}

export default function ResourcesView() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">Quick links to share with recruiters and on applications.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {RESOURCES.map((r) => <ResourceCard key={r.id} r={r} />)}
      </div>
    </div>
  );
}
