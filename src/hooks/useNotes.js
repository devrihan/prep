import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { putBlob, delBlob } from "../lib/db.js";

const KEY = "sde1-notes-v1";
const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const empty = { folders: [], notes: [] };

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.folders) && Array.isArray(s.notes)) return s;
  } catch {}
  return empty;
}

export const NotesContext = createContext(null);
export const useNotesApi = () => useContext(NotesContext);

const isEmptyNote = (n) => !n.body.trim() && !n.attachments.length && !n.links.length;

export default function useNotes() {
  const [data, setData] = useState(load);
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  }, [data]);

  const addFolder = useCallback((name, parentId = null) => {
    const f = { id: uid("f"), name, parentId };
    setData((d) => ({ ...d, folders: [...d.folders, f] }));
    return f.id;
  }, []);

  const renameFolder = useCallback((id, name) =>
    setData((d) => ({ ...d, folders: d.folders.map((f) => (f.id === id ? { ...f, name } : f)) })), []);

  const deleteFolder = useCallback((id) =>
    setData((d) => {
      const ids = new Set([id]);
      let grew = true;
      while (grew) {
        grew = false;
        d.folders.forEach((f) => { if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) { ids.add(f.id); grew = true; } });
      }
      d.notes.filter((n) => ids.has(n.folderId)).forEach((n) => n.attachments.forEach((a) => delBlob(a.id)));
      return { folders: d.folders.filter((f) => !ids.has(f.id)), notes: d.notes.filter((n) => !ids.has(n.folderId)) };
    }), []);

  const addNote = useCallback((folderId = null) => {
    const n = { id: uid("n"), title: "Untitled note", body: "", folderId, updatedAt: Date.now(), attachments: [], links: [] };
    setData((d) => ({ ...d, notes: [n, ...d.notes] }));
    return n.id;
  }, []);

  const updateNote = useCallback((id, patch) =>
    setData((d) => ({ ...d, notes: d.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)) })), []);

  const deleteNote = useCallback((id) =>
    setData((d) => {
      d.notes.find((n) => n.id === id)?.attachments.forEach((a) => delBlob(a.id));
      return { ...d, notes: d.notes.filter((n) => n.id !== id) };
    }), []);

  const addAttachments = useCallback(async (noteId, files) => {
    const added = [];
    for (const file of files) {
      const id = uid("a");
      await putBlob(id, file);
      added.push({ id, name: file.name || "pasted-image", type: file.type, size: file.size });
    }
    setData((d) => ({
      ...d,
      notes: d.notes.map((n) => (n.id === noteId ? { ...n, attachments: [...n.attachments, ...added], updatedAt: Date.now() } : n)),
    }));
  }, []);

  const removeAttachment = useCallback((noteId, attId) => {
    delBlob(attId);
    setData((d) => ({
      ...d,
      notes: d.notes.map((n) => (n.id === noteId ? { ...n, attachments: n.attachments.filter((a) => a.id !== attId) } : n)),
    }));
  }, []);

  // Find (or create) the note tied to a tracker item. Item notes live in a "Video Notes" folder.
  const ensureItemNote = useCallback((item) => {
    const existing = latest.current.notes.find((n) => n.itemId === item.id);
    if (existing) return existing.id;
    const folder = latest.current.folders.find((f) => f.kind === "video");
    const folderId = folder?.id || uid("f");
    const n = {
      id: uid("n"), title: item.title, body: "", folderId, updatedAt: Date.now(), attachments: [], links: [],
      itemId: item.id, videoId: item.videoId || null, url: item.url || null,
    };
    const next = {
      folders: folder ? latest.current.folders : [...latest.current.folders, { id: folderId, name: "Video Notes", parentId: null, kind: "video" }],
      notes: [n, ...latest.current.notes],
    };
    latest.current = next;
    setData(next);
    return n.id;
  }, []);

  // Drop a note that was opened but never written in, so empty item notes don't pile up.
  const pruneIfEmpty = useCallback((id) =>
    setData((d) => {
      const n = d.notes.find((x) => x.id === id);
      return n && isEmptyNote(n) ? { ...d, notes: d.notes.filter((x) => x.id !== id) } : d;
    }), []);

  const replaceAll = useCallback((next) => {
    if (next && Array.isArray(next.folders) && Array.isArray(next.notes)) setData(next);
  }, []);

  return { ...data, addFolder, renameFolder, deleteFolder, addNote, updateNote, deleteNote, addAttachments, removeAttachment, replaceAll, ensureItemNote, pruneIfEmpty };
}
