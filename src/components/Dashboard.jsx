import React, { useMemo } from "react";
import { Flame, Clock, CheckCircle2, FileText, ArrowRight, CalendarDays, Check } from "lucide-react";
import Ring from "./Ring.jsx";
import { PILLARS, toSeconds } from "../pillars.js";
import { TOPICS, todayEntry, dayHours, weekStart, sessionKey } from "../data/schedule.js";

const DAY = 86400000;
const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

export default function Dashboard({ stats, itemsByPillar, completed, notes, onNavigate, onToggle }) {
  const streak = useMemo(() => {
    const today = startOfDay(Date.now());
    const counts = {};
    Object.values(completed).forEach((v) => {
      if (typeof v === "number") { const d = startOfDay(v); counts[d] = (counts[d] || 0) + 1; }
    });
    let streak = 0;
    let d = counts[today] ? today : today - DAY;
    while (counts[d]) { streak++; d -= DAY; }
    return streak;
  }, [completed]);

  const doneSeconds = PILLARS.reduce((a, p, i) => a + itemsByPillar[i].filter((it) => completed[it.id]).reduce((s, it) => s + toSeconds(it.duration), 0), 0);
  const hours = (doneSeconds / 3600).toFixed(1);

  const recentNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

  const today = todayEntry();
  const todayKey = sessionKey(weekStart(), today.key);
  const todayDone = !!completed[todayKey];

  const chips = [
    { icon: Flame, label: "Day streak", value: streak, color: "text-orange-400" },
    { icon: CheckCircle2, label: "Items done", value: stats.done, color: "text-emerald-400" },
    { icon: Clock, label: "Hours learned", value: hours, color: "text-sky-400" },
    { icon: FileText, label: "Notes", value: notes.length, color: "text-violet-400" },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-indigo-950/70 via-zinc-900 to-zinc-900 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-8">
          <Ring value={stats.pct} size={150} stroke={14} color="#818cf8">
            <div className="text-center"><div className="text-3xl font-bold">{stats.pct}%</div><div className="text-[11px] uppercase tracking-wide text-zinc-400">overall</div></div>
          </Ring>
          <div className="min-w-[240px] flex-1">
            <h2 className="text-2xl font-bold">Overall Prep Progress</h2>
            <p className="mt-1 text-zinc-400">{stats.done} of {stats.total} items completed across three pillars.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {chips.map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                  <Icon size={16} className={color} />
                  <div className="mt-2 text-xl font-bold">{value}</div>
                  <div className="text-xs text-zinc-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="rounded-xl bg-sky-500/15 p-2.5 text-sky-400"><CalendarDays size={20} /></div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Today · {today.name} · {dayHours(today)} hr{dayHours(today) > 1 ? "s" : ""}</div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {today.sessions.map((s, i) => {
              const t = TOPICS[s.topic]; const Icon = t.icon;
              return <span key={i} className={`flex items-center gap-1.5 rounded-lg border ${t.border} ${t.bg} px-2.5 py-1 text-sm font-medium ${t.text}`}><Icon size={14} /> {t.label}</span>;
            })}
          </div>
        </div>
        <button onClick={() => onToggle(todayKey)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${todayDone ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}>
          <Check size={15} /> {todayDone ? "Done today" : "Mark done"}
        </button>
        <button onClick={() => onNavigate("schedule")} className="text-sm text-indigo-400 hover:underline">Full week</button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {PILLARS.map((p, i) => {
          const s = stats.per[i]; const Icon = p.icon;
          return (
            <button key={p.key} onClick={() => onNavigate(p.key)} className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-zinc-600">
              <Ring value={s.pct} size={72} stroke={8} color={p.hex}><span className="text-sm font-bold">{s.pct}%</span></Ring>
              <div className="min-w-0 flex-1">
                <div className={`flex items-center gap-1.5 text-sm font-medium ${p.text}`}><Icon size={15} /> {p.label}</div>
                <div className="mt-1 text-xs text-zinc-400">{s.done} / {s.total} completed — {s.pct}%</div>
              </div>
              <ArrowRight size={16} className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-zinc-300" />
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold"><FileText size={16} className="text-violet-400" /> Recent notes</h3>
          <button onClick={() => onNavigate("notes")} className="text-sm text-indigo-400 hover:underline">Open notes</button>
        </div>
        {recentNotes.length === 0 ? <p className="text-sm text-zinc-500">No notes yet — jot down what you learn.</p> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentNotes.map((n) => (
              <button key={n.id} onClick={() => onNavigate("notes")} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-left hover:border-zinc-600">
                <div className="truncate text-sm font-medium">{n.title || "Untitled"}</div>
                <div className="mt-1 line-clamp-2 text-xs text-zinc-500">{n.body || "Empty note"}</div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
