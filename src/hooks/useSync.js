import { useCallback, useEffect, useRef, useState } from "react";

// Syncs progress + notes with /api/sync (see api/sync.js) so both laptops share one copy.
// The app keeps working from localStorage; sync just keeps that copy in step with the server.
//
// status: "off" (no passphrase) | "syncing" | "synced" | "offline" | "auth" (wrong passphrase)
//         | "unavailable" (no API, e.g. local `npm run dev`)

const KEY_STORE = "sde1-sync-key";
const BASE_STORE = "sde1-sync-base";
const PUSH_DELAY = 1500;
const PULL_EVERY = 60000;

const readLS = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const writeLS = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };

const unionById = (a = [], b = []) => {
  const seen = new Set(a.map((x) => x.id));
  return [...a, ...b.filter((x) => !seen.has(x.id))];
};

// Used only when both laptops changed things before seeing each other's save.
function merge(local, remote) {
  const byId = new Map();
  [...remote.notes.notes, ...local.notes.notes].forEach((n) => {
    const prev = byId.get(n.id);
    if (!prev || (n.updatedAt || 0) >= (prev.updatedAt || 0)) byId.set(n.id, n);
  });
  const customKeys = new Set([...Object.keys(remote.custom || {}), ...Object.keys(local.custom || {})]);
  return {
    completed: { ...remote.completed, ...local.completed },
    custom: Object.fromEntries([...customKeys].map((k) => [k, unionById(local.custom?.[k], remote.custom?.[k])])),
    notes: {
      folders: unionById(local.notes.folders, remote.notes.folders),
      notes: [...byId.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    },
  };
}

export default function useSync({ state, setState, notesApi }) {
  const [syncKey, setSyncKeyState] = useState(() => readLS(KEY_STORE));
  const [status, setStatus] = useState(syncKey ? "syncing" : "off");
  const [lastSynced, setLastSynced] = useState(null);

  const data = { completed: state.completed, custom: state.custom, notes: { folders: notesApi.folders, notes: notesApi.notes } };
  const json = JSON.stringify(data);

  const base = useRef(Number(readLS(BASE_STORE)) || 0); // server version this copy is based on
  const syncedJson = useRef(null);                        // what the server holds, as far as we know
  const ready = useRef(false);                            // never push before the first pull
  const busy = useRef(false);
  const latest = useRef({ data, json });
  latest.current = { data, json };

  const setBase = (v) => { base.current = v; writeLS(BASE_STORE, String(v)); };

  const apply = useCallback((d) => {
    setState({ completed: d.completed || {}, custom: d.custom || { dsa: [], dev: [] } });
    notesApi.replaceAll(d.notes || { folders: [], notes: [] });
  }, [setState, notesApi.replaceAll]);

  const call = useCallback(async (method, body) => {
    const r = await fetch("/api/sync", {
      method,
      headers: { "x-sync-key": syncKey, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 401) throw Object.assign(new Error(), { status: "auth" });
    if (r.status === 404 || r.status === 503 || !(r.headers.get("content-type") || "").includes("json"))
      throw Object.assign(new Error(), { status: "unavailable" });
    return { code: r.status, body: await r.json() };
  }, [syncKey]);

  const fail = (e) => setStatus(e.status || "offline");
  const ok = () => { setStatus("synced"); setLastSynced(Date.now()); };

  // Bring in the other laptop's changes. If this copy also has unsaved changes, merge them.
  const handleRemote = useCallback((doc) => {
    const local = latest.current;
    const dirty = local.json !== syncedJson.current;
    setBase(doc.updatedAt);
    syncedJson.current = JSON.stringify(doc.data);
    if (dirty) apply(merge(local.data, doc.data)); // differs from server → the push effect saves the merge
    else apply(doc.data);
  }, [apply]);

  const pull = useCallback(async () => {
    if (!syncKey || busy.current) return;
    busy.current = true;
    try {
      const { body: doc } = await call("GET");
      if (!doc.data) syncedJson.current = null;                   // empty server: the first push uploads this copy
      else if (doc.updatedAt > base.current) handleRemote(doc);   // other laptop saved since we last looked
      else if (doc.updatedAt === base.current) syncedJson.current = JSON.stringify(doc.data); // same version; push only if we edited
      else { setBase(0); syncedJson.current = null; }             // server was reset: re-upload this copy
      ready.current = true;
      ok();
    } catch (e) { fail(e); }
    finally { busy.current = false; }
  }, [syncKey, call, handleRemote]);

  const push = useCallback(async () => {
    if (!syncKey || !ready.current || busy.current) return;
    const { data: d, json: j } = latest.current;
    if (j === syncedJson.current) return;
    busy.current = true;
    setStatus("syncing");
    try {
      const { code, body } = await call("PUT", { baseUpdatedAt: base.current, data: d });
      if (code === 409) handleRemote(body);
      else if (code === 200) { setBase(body.updatedAt); syncedJson.current = j; ok(); }
      else throw new Error();
    } catch (e) { fail(e); }
    finally { busy.current = false; }
  }, [syncKey, call, handleRemote]);

  // Pull on start, when you come back to the tab, and every minute while it's visible.
  useEffect(() => {
    if (!syncKey) { setStatus("off"); return; }
    ready.current = false;
    pull();
    const onVis = () => (document.visibilityState === "visible" ? pull() : push());
    const t = setInterval(() => document.visibilityState === "visible" && pull(), PULL_EVERY);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", pull);
    window.addEventListener("online", pull);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", pull);
      window.removeEventListener("online", pull);
    };
  }, [syncKey, pull, push]);

  // Save shortly after any change (debounced while typing). Retries when a push was blocked.
  useEffect(() => {
    if (!syncKey || json === syncedJson.current) return;
    const t = setTimeout(push, busy.current ? PUSH_DELAY * 2 : PUSH_DELAY);
    return () => clearTimeout(t);
  }, [json, syncKey, push, status]);

  const setSyncKey = (k) => {
    const v = k?.trim() || null;
    writeLS(KEY_STORE, v);
    setBase(0);
    syncedJson.current = null;
    setSyncKeyState(v);
    setStatus(v ? "syncing" : "off");
  };

  return { status, lastSynced, syncKey, setSyncKey, syncNow: pull };
}
