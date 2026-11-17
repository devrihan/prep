import React, { useState } from "react";
import { Check, Play, Clock, Trash2, ExternalLink, NotebookPen } from "lucide-react";
import VideoPlayer from "./VideoPlayer.jsx";
import { parseVideoId } from "../lib/youtube.js";
import { useNotesApi } from "../hooks/useNotes.js";

export default function ItemCard({ item, number, done, onToggle, playlistId, onRemove }) {
  const [open, setOpen] = useState(null); // null | "play" | "notes"
  const api = useNotesApi();
  const note = api.notes.find((n) => n.itemId === item.id);
  const hasNotes = !!note && (note.body.trim() || note.attachments.length > 0);
  // Any YouTube item plays in-app; also recognise YouTube links on older custom items.
  const videoId = item.videoId || (item.url ? parseVideoId(item.url) : null);
  const href = videoId ? null : item.url || (playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : null);
  const play = () => setOpen("play");

  return (
    <li className={`group flex flex-wrap items-center gap-4 rounded-2xl border p-3 pr-4 transition sm:flex-nowrap ${done ? "border-emerald-500/20 bg-emerald-500/5 opacity-60" : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-900"}`}>
      <span className="w-9 shrink-0 text-center font-mono text-lg font-semibold text-zinc-600">{number}</span>

      {(playlistId || videoId) && (
        <button type="button" onClick={videoId ? play : undefined} disabled={!videoId} title={videoId ? "Play" : undefined}
          className="group/thumb relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
          {videoId ? (
            <>
              <img src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover/thumb:bg-black/40">
                <Play size={26} fill="currentColor" className="text-white opacity-0 drop-shadow transition group-hover/thumb:opacity-100" />
              </span>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-800">
              <Play className="text-indigo-300/70" size={26} fill="currentColor" />
            </div>
          )}
          {item.duration && <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium">{item.duration}</span>}
        </button>
      )}

      <div className="min-w-0 flex-1">
        {videoId ? (
          <button type="button" onClick={play} className={`text-left font-medium hover:text-indigo-400 ${done ? "line-through" : ""}`}>
            {item.title}
          </button>
        ) : href ? (
          <a href={href} target="_blank" rel="noreferrer" className={`inline-flex items-start gap-1.5 font-medium hover:text-indigo-400 ${done ? "line-through" : ""}`}>
            <span>{item.title}</span>
            <ExternalLink size={13} className="mt-1 shrink-0 text-zinc-600" />
          </a>
        ) : (
          <span className={`font-medium ${done ? "line-through" : ""}`}>{item.title}</span>
        )}
        {item.channel && <div className="mt-0.5 text-xs text-zinc-500">{item.channel}</div>}
        {item.duration && !playlistId && !videoId && (
          <div className="mt-1 inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400"><Clock size={11} /> {item.duration}</div>
        )}
      </div>

      <button onClick={() => setOpen("notes")} title={hasNotes ? "Open your notes" : "Add notes for this item"}
        className={`relative flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition ${hasNotes ? "border-violet-500/50 text-violet-300 hover:bg-violet-500/10" : "border-zinc-700 text-zinc-400 hover:border-violet-500/60 hover:text-violet-300"}`}>
        <NotebookPen size={15} /> Notes
        {hasNotes && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-violet-400 ring-2 ring-zinc-900" />}
      </button>

      {onRemove && (
        <button onClick={onRemove} title="Remove" className="rounded p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-400"><Trash2 size={16} /></button>
      )}

      <button onClick={onToggle} aria-pressed={done}
        className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${done ? "border-emerald-500 bg-emerald-500 text-zinc-950" : "border-zinc-700 text-zinc-300 hover:border-emerald-500/60 hover:text-emerald-300"}`}>
        <Check size={16} /> {done ? "Done" : "Mark Complete"}
      </button>

      {open && (
        <VideoPlayer item={item} videoId={videoId} done={done} onToggle={onToggle}
          startWithNotes={open === "notes"} onClose={() => setOpen(null)} />
      )}
    </li>
  );
}
