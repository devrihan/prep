import React, { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock, Target, ArrowRight } from "lucide-react";
import Ring from "./Ring.jsx";
import { SCHEDULE, TOPICS, TOPIC_HOURS, WEEK_HOURS, SCHEDULE_TITLE, SCHEDULE_TARGET, dayHours, weekStart, sessionKey } from "../data/schedule.js";
import { pct } from "../pillars.js";

const WEEK = 7 * 86400000;

function weekLabel(week) {
  const start = new Date(`${week}T00:00:00`);
  const end = new Date(start.getTime() + 6 * 86400000);
  const f = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${f(start)} – ${f(end)}`;
}

export default function ScheduleView({ completed, onToggle, onNavigate }) {
  const [offset, setOffset] = useState(0); // weeks from current
  const now = Date.now();
  const week = weekStart(now + offset * WEEK);
  const isThisWeek = offset === 0;
  const todayDow = new Date(now).getDay();

  const doneHours = SCHEDULE.filter((d) => completed[sessionKey(week, d.key)]).reduce((a, d) => a + dayHours(d), 0);
  const donePct = pct(doneHours, WEEK_HOURS);

  const topicDone = (k) =>
    SCHEDULE.filter((d) => completed[sessionKey(week, d.key)]).reduce((a, d) => a + d.sessions.filter((s) => s.topic === k).reduce((x, s) => x + s.hours, 0), 0);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-sky-950/60 via-zinc-900 to-zinc-900 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-8">
          <Ring value={donePct} size={130} stroke={12} color="#38bdf8">
            <div className="text-center">
              <div className="text-2xl font-bold">{doneHours}<span className="text-base text-zinc-500">/{WEEK_HOURS}h</span></div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">this week</div>
            </div>
          </Ring>
          <div className="min-w-[240px] flex-1">
            <h2 className="text-2xl font-bold">{SCHEDULE_TITLE}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-orange-300"><Target size={15} /> {SCHEDULE_TARGET}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TOPIC_HOURS.map(({ key, hours }) => {
                const t = TOPICS[key]; const Icon = t.icon; const d = topicDone(key);
                return (
                  <div key={key} className={`rounded-xl border ${t.border} bg-zinc-950/50 p-3`}>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${t.text}`}><Icon size={14} /> {t.short}</div>
                    <div className="mt-2 text-xl font-bold">{d}<span className="text-sm text-zinc-500">/{hours} hr{hours > 1 ? "s" : ""}</span></div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800"><div className={`h-full ${t.bar} transition-all`} style={{ width: `${pct(d, hours)}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button onClick={() => setOffset((o) => o - 1)} className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" title="Previous week"><ChevronLeft size={16} /></button>
          <div className="text-center">
            <div className="text-sm font-semibold">{isThisWeek ? "This week" : offset === -1 ? "Last week" : offset === 1 ? "Next week" : "Week of"}</div>
            <div className="text-xs text-zinc-500">{weekLabel(week)}</div>
          </div>
          <div className="flex gap-2">
            {!isThisWeek && <button onClick={() => setOffset(0)} className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">Today</button>}
            <button onClick={() => setOffset((o) => o + 1)} className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" title="Next week"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="space-y-2.5">
          {SCHEDULE.map((day) => {
            const key = sessionKey(week, day.key);
            const done = !!completed[key];
            const isToday = isThisWeek && day.dow === todayDow;
            const hrs = dayHours(day);
            const main = TOPICS[day.sessions[0].topic];
            return (
              <div key={day.key}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 transition sm:gap-4 sm:p-4 ${isToday ? `${main.border} ${main.bg} ring-1 ring-sky-400/40` : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"} ${done ? "opacity-70" : ""}`}>
                <div className="absolute inset-y-0 left-0 flex w-1 flex-col">
                  {day.sessions.map((s, i) => <div key={i} className={`flex-1 ${TOPICS[s.topic].bar}`} style={{ flexGrow: s.hours }} />)}
                </div>

                <div className="w-14 shrink-0 pl-1 sm:w-20">
                  <div className={`text-lg font-bold uppercase leading-none ${main.text}`}>{day.label}</div>
                  {isToday ? <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-sky-400">Today</div>
                    : <div className="mt-1 hidden text-[11px] text-zinc-500 sm:block">{day.name}</div>}
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {day.sessions.map((s, i) => {
                    const t = TOPICS[s.topic]; const Icon = t.icon;
                    const cls = `flex items-center gap-1.5 rounded-lg border ${t.border} ${t.bg} px-2.5 py-1.5 text-sm font-medium ${t.text}`;
                    return t.pillar ? (
                      <button key={i} onClick={() => onNavigate(t.pillar)} title={`Open ${t.label}`} className={`${cls} hover:brightness-125`}>
                        <Icon size={14} /> {t.label} <ArrowRight size={12} className="opacity-0 transition group-hover:opacity-60" />
                      </button>
                    ) : (
                      <span key={i} className={cls}><Icon size={14} /> {t.label}</span>
                    );
                  })}
                </div>

                <div className="flex shrink-0 items-center gap-1 text-xs text-zinc-400"><Clock size={13} /> {hrs} hr{hrs > 1 ? "s" : ""}</div>

                <button onClick={() => onToggle(key)} title={done ? "Mark not done" : "Mark session done"}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${done ? "border-emerald-500 bg-emerald-500 text-zinc-950" : "border-zinc-600 text-transparent hover:border-emerald-400 hover:text-emerald-400/50"}`}>
                  <Check size={15} strokeWidth={3} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
