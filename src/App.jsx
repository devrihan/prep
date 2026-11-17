import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Upload, LayoutDashboard, NotebookPen, GraduationCap, Cloud, CloudOff, RefreshCw, KeyRound } from "lucide-react";
import { PILLARS, pct } from "./pillars.js";
import Dashboard from "./components/Dashboard.jsx";
import PillarView from "./components/PillarView.jsx";
import NotesView from "./components/NotesView.jsx";
import DevView from "./components/DevView.jsx";
import { isMiscDev } from "./data/dev.js";
import useNotes, { NotesContext } from "./hooks/useNotes.js";
import useSync from "./hooks/useSync.js";

const STORAGE_KEY = "sde1-prep-tracker-v1";

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (s && typeof s === "object") return { completed: s.completed || {}, custom: s.custom || { dsa: [], dev: [] } };
  } catch {}
  return { completed: {}, custom: { dsa: [], dev: [] } };
}

const SYNC_LABEL = {
  off: "Sync off — set passphrase",
  syncing: "Syncing…",
  synced: "Synced",
  offline: "Offline — will retry",
  auth: "Wrong passphrase",
  unavailable: "Sync unavailable here",
};

function SyncBadge({ sync }) {
  const { status, detail, lastSynced, setSyncKey, syncNow, syncKey } = sync;
  const bad = status === "auth" || status === "offline" || status === "off";
  const Icon = status === "syncing" ? RefreshCw : bad || status === "unavailable" ? CloudOff : Cloud;
  const ago = lastSynced ? Math.max(0, Math.round((Date.now() - lastSynced) / 60000)) : null;
  const askKey = () => {
    const k = prompt("Sync passphrase (same on both laptops — matches SYNC_KEY on Vercel).\nLeave empty to turn sync off.", syncKey || "");
    if (k !== null) setSyncKey(k);
  };
  return (
    <div>
    <div className="flex items-center gap-1">
      <button onClick={status === "off" || status === "auth" ? askKey : syncNow} title={status === "synced" ? "Sync now" : detail || SYNC_LABEL[status]}
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs ${bad ? "text-amber-400 hover:bg-amber-500/10" : "text-zinc-400 hover:bg-zinc-900"}`}>
        <Icon size={14} className={`shrink-0 ${status === "syncing" ? "animate-spin" : status === "synced" ? "text-emerald-400" : ""}`} />
        <span className="truncate">{SYNC_LABEL[status]}{status === "synced" && ago !== null ? ` · ${ago ? `${ago}m ago` : "just now"}` : ""}</span>
      </button>
      {status !== "off" && <button onClick={askKey} title="Change passphrase" className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300"><KeyRound size={13} /></button>}
    </div>
    {detail && status !== "synced" && status !== "syncing" && <p className="px-3 pb-1 text-[11px] leading-snug text-zinc-500">{detail}</p>}
    </div>
  );
}

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  ...PILLARS.map((p) => ({ key: p.key, label: p.label, icon: p.icon })),
  { key: "notes", label: "Notes", icon: NotebookPen },
];

export default function App() {
  const [state, setState] = useState(load);
  const [page, setPage] = useState("dashboard");
  const notesApi = useNotes();
  const fileRef = useRef(null);
  const sync = useSync({ state, setState, notesApi });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const itemsByPillar = PILLARS.map((p) => (p.key === "sd" ? p.base : [...p.base, ...(state.custom[p.key] || [])]));
  // What counts toward progress: everything except Miscellaneous dev videos.
  const trackedByPillar = PILLARS.map((p, i) => (p.key === "dev" ? itemsByPillar[i].filter((it) => !isMiscDev(it)) : itemsByPillar[i]));

  const stats = useMemo(() => {
    const per = trackedByPillar.map((items) => {
      const done = items.filter((i) => state.completed[i.id]).length;
      return { total: items.length, done, pct: pct(done, items.length) };
    });
    const total = per.reduce((a, s) => a + s.total, 0);
    const done = per.reduce((a, s) => a + s.done, 0);
    return { per, total, done, pct: pct(done, total) };
  }, [state]);

  const toggle = (id) =>
    setState((s) => {
      const completed = { ...s.completed };
      if (completed[id]) delete completed[id]; else completed[id] = Date.now();
      return { ...s, completed };
    });

  const addCustom = (key, title, url, extra = {}) =>
    setState((s) => ({ ...s, custom: { ...s.custom, [key]: [...(s.custom[key] || []), { id: `${key}-c-${Date.now()}`, title, url, ...extra, custom: true }] } }));

  const removeCustom = (key, id) =>
    setState((s) => {
      const completed = { ...s.completed };
      delete completed[id];
      return { completed, custom: { ...s.custom, [key]: s.custom[key].filter((i) => i.id !== id) } };
    });

  const exportJson = () => {
    const payload = {
      app: "sde1-prep-tracker", exportedAt: new Date().toISOString(), ...state,
      notes: { folders: notesApi.folders, notes: notesApi.notes }, // text only; attachments stay in this browser
    };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    a.download = "prep-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || typeof d.completed !== "object") throw new Error();
        setState({ completed: d.completed, custom: { dsa: d.custom?.dsa || [], dev: d.custom?.dev || [] } });
        if (d.notes) notesApi.replaceAll(d.notes);
      } catch {
        alert("Invalid progress file.");
      }
    };
    r.readAsText(f);
  };

  const pi = PILLARS.findIndex((p) => p.key === page);

  return (
    <NotesContext.Provider value={notesApi}>
    <div className="min-h-screen md:flex">
      <aside className="border-b border-zinc-800 bg-zinc-950/80 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-5 py-4 md:py-6">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2"><GraduationCap size={20} /></div>
          <div>
            <div className="font-bold leading-tight">SDE-1 Prep</div>
            <div className="text-xs text-zinc-500">Interview tracker</div>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setPage(key)}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${page === key ? "bg-indigo-500/15 text-indigo-300" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <div className="hidden space-y-2 border-t border-zinc-800 p-4 md:block">
          <SyncBadge sync={sync} />
          <button onClick={exportJson} className="flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800"><Download size={15} /> Export Progress</button>
          <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800"><Upload size={15} /> Import Progress</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">{NAV.find((n) => n.key === page).label}</h1>
            <div className="flex gap-2 md:hidden">
              <button onClick={exportJson} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2"><Download size={16} /></button>
              <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2"><Upload size={16} /></button>
            </div>
          </div>
          <div className="-mt-3 mb-5 md:hidden"><SyncBadge sync={sync} /></div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />

          {page === "dashboard" && (
            <Dashboard stats={stats} itemsByPillar={trackedByPillar} completed={state.completed} notes={notesApi.notes} onNavigate={setPage} />
          )}
          {page === "dev" && (
            <DevView
              pillar={PILLARS[pi]}
              items={itemsByPillar[pi]}
              completed={state.completed}
              stat={stats.per[pi]}
              onToggle={toggle}
              onAdd={({ title, url, ...extra }) => addCustom("dev", title, url, extra)}
              onRemove={(id) => removeCustom("dev", id)}
            />
          )}
          {pi >= 0 && page !== "dev" && (
            <PillarView
              key={page}
              pillar={PILLARS[pi]}
              items={itemsByPillar[pi]}
              completed={state.completed}
              stat={stats.per[pi]}
              onToggle={toggle}
              onAdd={(t, u) => addCustom(page, t, u)}
              onRemove={(id) => removeCustom(page, id)}
            />
          )}
          {page === "notes" && <NotesView notesApi={notesApi} />}
        </div>
      </main>
    </div>
    </NotesContext.Provider>
  );
}
