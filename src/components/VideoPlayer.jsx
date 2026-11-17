import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, ExternalLink, NotebookPen } from "lucide-react";
import { useNotesApi } from "../hooks/useNotes.js";
import { Editor } from "./NotesView.jsx";

// In-app YouTube player with an optional notes panel for this item.
// The embedded player has YouTube's own controls: play/pause, seek, volume,
// playback speed (gear icon), captions, quality and fullscreen.
// With no videoId it opens as a notes-only panel (for link items).
export default function VideoPlayer({ item, videoId, done, onToggle, onClose, startWithNotes = false }) {
  const api = useNotesApi();
  const [noteId, setNoteId] = useState(null);
  useEffect(() => { if (startWithNotes || !videoId) setNoteId(api.ensureItemNote(item)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const note = noteId ? api.notes.find((n) => n.id === noteId) : null;
  const showNotes = !!note;
  const title = item.title;

  const close = () => { if (noteId) api.pruneIfEmpty(noteId); onClose(); };
  const toggleNotes = () => {
    if (showNotes) { api.pruneIfEmpty(noteId); setNoteId(null); }
    else setNoteId(api.ensureItemNote(item));
  };

  useEffect(() => {
    const onKey = (e) => {
      // Esc closes the player, but not while typing a note.
      if (e.key === "Escape" && !/^(TEXTAREA|INPUT|SELECT)$/.test(e.target.tagName)) close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  });

  // Note deleted from inside the panel → panel closes (or the whole modal, for notes-only).
  useEffect(() => { if (noteId && !note) { setNoteId(null); if (!videoId) onClose(); } }, [noteId, note, videoId, onClose]);

  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  const wide = showNotes && videoId;

  // Portal to <body> so the card's styles (e.g. faded "done" opacity) don't affect the player.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6" onClick={close}>
      <div className={`flex max-h-full w-full flex-col ${wide ? "max-w-[1500px]" : videoId ? "max-w-5xl" : "max-w-3xl"}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
          <h2 className="min-w-0 text-base font-semibold sm:text-lg">{title}</h2>
          <div className="flex shrink-0 items-center gap-2">
            {videoId && (
              <button onClick={toggleNotes} aria-pressed={showNotes}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${showNotes ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-zinc-700 text-zinc-300 hover:border-violet-500/60 hover:text-violet-200"}`}>
                <NotebookPen size={15} /> Notes
              </button>
            )}
            <button onClick={close} title="Close (Esc)" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"><X size={20} /></button>
          </div>
        </div>

        <div className={`min-h-0 ${wide ? "grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]" : ""}`}>
          {videoId && (
            <div className="min-w-0">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
                <iframe
                  className="h-full w-full"
                  src={src}
                  title={title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300">
                  <ExternalLink size={12} /> Video won't play here? Open on YouTube
                </a>
                <button onClick={onToggle} aria-pressed={done}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${done ? "border-emerald-500 bg-emerald-500 text-zinc-950" : "border-zinc-700 text-zinc-300 hover:border-emerald-500/60 hover:text-emerald-300"}`}>
                  <Check size={16} /> {done ? "Done" : "Mark Complete"}
                </button>
              </div>
            </div>
          )}

          {note && (
            <div className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${videoId ? "h-[60vh] lg:h-auto lg:max-h-[calc(100vh-8rem)]" : "h-[80vh]"}`}>
              <Editor key={note.id} note={note} folders={api.folders} api={api} compact />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
