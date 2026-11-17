import React, { useState } from "react";
import { Plus, Loader2, X, Youtube } from "lucide-react";
import ItemCard from "./ItemCard.jsx";
import Ring from "./Ring.jsx";
import { DEV_TOPICS } from "../data/dev.js";
import { parseVideoId, fetchVideoMeta } from "../lib/youtube.js";

function AddVideoForm({ onAdd, onCancel }) {
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const id = parseVideoId(link);
    if (!id) return setError("That doesn't look like a YouTube video link.");
    setBusy(true);
    setError("");
    const meta = await fetchVideoMeta(id);
    setBusy(false);
    onAdd({
      videoId: id,
      url: `https://www.youtube.com/watch?v=${id}`,
      title: meta?.title || "YouTube video",
      channel: meta?.channel || "",
    });
  };

  return (
    <form onSubmit={submit} className="mb-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="flex gap-2">
        <input
          autoFocus
          value={link}
          onChange={(e) => { setLink(e.target.value); setError(""); }}
          onPaste={(e) => setLink(e.clipboardData.getData("text"))}
          placeholder="Paste a YouTube link…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
        <button disabled={busy || !link.trim()} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"><X size={16} /></button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </form>
  );
}

function TopicSection({ label, untracked, items, completed, onToggle, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);
  const done = items.filter((i) => completed[i.id]).length;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{label}</h2>
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{done} / {items.length}</span>
          {untracked && <span className="text-xs text-zinc-500">not counted in progress</span>}
        </div>
        {onAdd && !adding && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-amber-500/60 hover:text-amber-300">
            <Youtube size={15} /> Add YT video link
          </button>
        )}
      </div>

      {adding && <AddVideoForm onCancel={() => setAdding(false)} onAdd={(v) => { onAdd(v); setAdding(false); }} />}

      {items.length === 0 ? (
        !adding && <p className="py-4 text-center text-sm text-zinc-500">No videos yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <ItemCard
              key={item.id}
              item={item}
              number={String(i + 1).padStart(2, "0")}
              done={!!completed[item.id]}
              onToggle={() => onToggle(item.id)}
              onRemove={item.custom ? () => onRemove(item.id) : null}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DevView({ pillar, items, completed, stat, onToggle, onAdd, onRemove }) {
  const Icon = pillar.icon;
  const known = new Set(DEV_TOPICS.map((t) => t.key));
  const topicOf = (i) => (known.has(i.topic) ? i.topic : "misc");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/40 p-5">
        <Ring value={stat.pct} size={84} stroke={9} color={pillar.hex}><span className="text-lg font-bold">{stat.pct}%</span></Ring>
        <div className="flex-1">
          <div className={`flex items-center gap-2 text-sm font-medium ${pillar.text}`}><Icon size={16} /> {pillar.label}</div>
          <div className="mt-1 text-2xl font-bold">{stat.done} / {stat.total} <span className="text-base font-normal text-zinc-500">completed</span></div>
        </div>
      </div>

      <div className="space-y-5">
        {DEV_TOPICS.map((t) => (
          <TopicSection
            key={t.key}
            label={t.label}
            untracked={t.untracked}
            items={items.filter((i) => topicOf(i) === t.key)}
            completed={completed}
            onToggle={onToggle}
            onAdd={(v) => onAdd({ ...v, topic: t.key })}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
