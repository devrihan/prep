import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Folder, FolderOpen, FolderPlus, FilePlus, FileText, ChevronRight, ChevronDown, Search, Trash2,
  Pencil, Eye, Link2, X, Download, NotebookPen, PlayCircle,
} from "lucide-react";
import { getBlob } from "../lib/db.js";
import { renderMarkdown } from "../lib/markdown.js";

function Attachment({ att, onRemove }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let made;
    getBlob(att.id).then((b) => { if (b) { made = URL.createObjectURL(b); setUrl(made); } });
    return () => made && URL.revokeObjectURL(made);
  }, [att.id]);

  const isImg = att.type.startsWith("image/");
  const isVid = att.type.startsWith("video/");
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      {!url ? (
        <div className="flex h-32 items-center justify-center text-xs text-zinc-600">Loading…</div>
      ) : isImg ? (
        <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={att.name} className="max-h-72 w-full object-contain" /></a>
      ) : isVid ? (
        <video src={url} controls className="max-h-72 w-full" />
      ) : (
        <a href={url} download={att.name} className="flex h-24 items-center gap-3 px-4 text-sm text-zinc-300 hover:text-white">
          <Download size={18} /> <span className="truncate">{att.name}</span>
        </a>
      )}
      <button onClick={onRemove} title="Remove" className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-zinc-300 opacity-0 transition hover:text-red-400 group-hover:opacity-100">
        <X size={14} />
      </button>
      <div className="truncate border-t border-zinc-800 px-3 py-1.5 text-xs text-zinc-500">{att.name}</div>
    </div>
  );
}

const ytId = (u) => /(?:youtu\.be\/|v=|embed\/)([\w-]{11})/.exec(u)?.[1];

// `compact` is the side panel inside the video player: no folder picker, no embedded links.
export function Editor({ note, folders, api, compact = false }) {
  const [preview, setPreview] = useState(false);
  const [link, setLink] = useState("");
  const textRef = useRef(null);

  useEffect(() => { setPreview(false); setLink(""); }, [note.id]);

  // Grow the textarea with its content so attachments sit right under the text
  // (a fixed min-height used to leave a big empty gap above them).
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [note.body, preview]);

  const addLink = (e) => {
    e.preventDefault();
    let u = link.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    api.updateNote(note.id, { links: [...note.links, u] });
    setLink("");
  };

  return (
    <div
      className="flex h-full flex-col"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 p-4">
        <input
          value={note.title}
          onChange={(e) => api.updateNote(note.id, { title: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-xl font-semibold outline-none placeholder:text-zinc-600"
          placeholder="Note title"
        />
        {!compact && <select
          value={note.folderId || ""}
          onChange={(e) => api.updateNote(note.id, { folderId: e.target.value || null })}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-300"
          title="Move to folder"
        >
          <option value="">No folder</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>}
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-sm">
          <button onClick={() => setPreview(false)} className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${!preview ? "bg-zinc-700" : "text-zinc-400"}`}><Pencil size={13} /> Edit</button>
          <button onClick={() => setPreview(true)} className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${preview ? "bg-zinc-700" : "text-zinc-400"}`}><Eye size={13} /> Preview</button>
        </div>
        <button onClick={() => confirm("Delete this note and its attachments?") && api.deleteNote(note.id)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-400" title="Delete note">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!compact && (note.videoId || note.url) && (
          <a href={note.videoId ? `https://www.youtube.com/watch?v=${note.videoId}` : note.url} target="_blank" rel="noreferrer"
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-400 hover:text-indigo-300">
            <PlayCircle size={13} /> Linked item — open source
          </a>
        )}
        {preview ? (
          <div className="text-zinc-300 [&>*:first-child]:mt-0" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.body) || '<p class="text-zinc-600">Nothing written yet.</p>' }} />
        ) : (
          <textarea
            ref={textRef}
            rows={4}
            value={note.body}
            onChange={(e) => api.updateNote(note.id, { body: e.target.value })}
            onKeyDown={(e) => {
              // Tab indents instead of leaving the editor.
              if (e.key !== "Tab") return;
              e.preventDefault();
              const el = e.currentTarget, { selectionStart: a, selectionEnd: b } = el;
              api.updateNote(note.id, { body: note.body.slice(0, a) + "  " + note.body.slice(b) });
              requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = a + 2; });
            }}
            placeholder={"Write your notes… Markdown supported (# heading, **bold**, - list, ```code```)."}
            className="block min-h-[6rem] w-full resize-none overflow-hidden bg-transparent font-mono text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        )}

        {!compact && note.links.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {note.links.map((u, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                {ytId(u) ? (
                  <div className="aspect-video"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${ytId(u)}`} allowFullScreen title={u} /></div>
                ) : (
                  <a href={u} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-4 text-sm text-indigo-400 hover:underline"><Link2 size={16} /> <span className="truncate">{u}</span></a>
                )}
                <button onClick={() => api.updateNote(note.id, { links: note.links.filter((_, j) => j !== i) })} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-zinc-300 opacity-0 hover:text-red-400 group-hover:opacity-100"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {note.attachments.length > 0 && (
          <div className={`mt-3 grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
            {note.attachments.map((a) => <Attachment key={a.id} att={a} onRemove={() => api.removeAttachment(note.id, a.id)} />)}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 p-3">
        {compact ? <span className="text-xs text-zinc-600">Saved to Notes › Video Notes · Markdown supported</span> : <form onSubmit={addLink} className="flex min-w-[220px] flex-1 gap-2">
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a YouTube / web link…" className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm outline-none focus:border-indigo-500" />
          <button className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium hover:bg-indigo-400">Add link</button>
        </form>}
      </div>
    </div>
  );
}

export default function NotesView({ notesApi }) {
  const { folders, notes } = notesApi;
  const [activeId, setActiveId] = useState(null);
  const [folderId, setFolderId] = useState(null); // folder new items are created in
  const [open, setOpen] = useState(() => new Set());
  const [q, setQ] = useState("");

  const active = notes.find((n) => n.id === activeId) || null;
  const toggleOpen = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const newFolder = () => {
    const name = prompt(folderId ? "New sub-folder name:" : "New folder name:");
    if (!name?.trim()) return;
    const id = notesApi.addFolder(name.trim(), folderId);
    if (folderId) setOpen((s) => new Set(s).add(folderId));
    setFolderId(id);
  };
  const newNote = () => {
    const id = notesApi.addNote(folderId);
    if (folderId) setOpen((s) => new Set(s).add(folderId));
    setActiveId(id);
  };

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? notes.filter((n) => n.title.toLowerCase().includes(t) || n.body.toLowerCase().includes(t)) : null;
  }, [q, notes]);

  const NoteRow = ({ n, depth }) => (
    <button
      onClick={() => setActiveId(n.id)}
      style={{ paddingLeft: 12 + depth * 16 }}
      className={`flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-sm ${activeId === n.id ? "bg-indigo-500/15 text-indigo-300" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"}`}
    >
      <FileText size={14} className="shrink-0" /> <span className="truncate">{n.title || "Untitled"}</span>
    </button>
  );

  const renderLevel = (parentId, depth) => (
    <>
      {folders.filter((f) => (f.parentId || null) === parentId).map((f) => {
        const isOpen = open.has(f.id);
        return (
          <div key={f.id}>
            <div
              style={{ paddingLeft: 4 + depth * 16 }}
              className={`group flex items-center rounded-lg pr-1 ${folderId === f.id ? "bg-zinc-800" : "hover:bg-zinc-800/60"}`}
            >
              <button onClick={() => { toggleOpen(f.id); setFolderId(f.id); }} className="flex flex-1 items-center gap-1.5 py-1.5 text-left text-sm text-zinc-200">
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {isOpen ? <FolderOpen size={15} className="text-amber-400" /> : <Folder size={15} className="text-amber-400" />}
                <span className="truncate">{f.name}</span>
              </button>
              <button onClick={() => { const n = prompt("Rename folder:", f.name); n?.trim() && notesApi.renameFolder(f.id, n.trim()); }} className="p-1 text-zinc-600 opacity-0 hover:text-zinc-200 group-hover:opacity-100"><Pencil size={12} /></button>
              <button onClick={() => { if (confirm(`Delete "${f.name}" with everything inside?`)) { notesApi.deleteFolder(f.id); if (folderId === f.id) setFolderId(null); } }} className="p-1 text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100"><Trash2 size={12} /></button>
            </div>
            {isOpen && renderLevel(f.id, depth + 1)}
          </div>
        );
      })}
      {notes.filter((n) => (n.folderId || null) === parentId).map((n) => <NoteRow key={n.id} n={n} depth={depth + 1} />)}
    </>
  );

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 md:flex-row">
      <aside className="flex max-h-64 w-full shrink-0 flex-col border-b border-zinc-800 md:max-h-none md:w-72 md:border-b-0 md:border-r">
        <div className="space-y-2 border-b border-zinc-800 p-3">
          <div className="flex gap-2">
            <button onClick={newNote} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 py-1.5 text-sm font-medium hover:bg-indigo-400"><FilePlus size={15} /> Note</button>
            <button onClick={newFolder} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 py-1.5 text-sm hover:bg-zinc-800"><FolderPlus size={15} /> Folder</button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-indigo-500" />
          </div>
          <p className="text-xs text-zinc-600">Adding to: <span className="text-zinc-400">{folders.find((f) => f.id === folderId)?.name || "Root"}</span>
            {folderId && <button onClick={() => setFolderId(null)} className="ml-1 text-indigo-400 hover:underline">(root)</button>}</p>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {matches ? (
            matches.length ? matches.map((n) => <NoteRow key={n.id} n={n} depth={0} />) : <p className="p-3 text-sm text-zinc-600">No matches.</p>
          ) : folders.length + notes.length ? renderLevel(null, 0) : (
            <p className="p-3 text-sm text-zinc-600">No notes yet. Create a folder or a note to begin.</p>
          )}
        </div>
      </aside>

      <section className="min-h-0 min-w-0 flex-1">
        {active ? <Editor key={active.id} note={active} folders={folders} api={notesApi} /> : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-zinc-500">
            <NotebookPen size={36} className="text-zinc-700" />
            <p>Select a note or create a new one.</p>
            <p className="text-xs text-zinc-600">Supports Markdown and YouTube / web links.</p>
          </div>
        )}
      </section>
    </div>
  );
}
