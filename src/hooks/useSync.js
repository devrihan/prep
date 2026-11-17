import { useCallback, useEffect, useRef, useState } from "react";

// Syncs progress + notes with /api/sync (see api/sync.js) so both laptops share one copy.
// The app keeps working from localStorage; sync just keeps that copy in step with the server.
//
// status: "off" (no passphrase) | "syncing" | "synced" | "offline" | "auth" (wrong passphrase)
//         | "unavailable" (no API, e.g. local `npm run dev`)

const KEY_STORE = "sde1-sync-key";
const BASE_STORE = "sde1-sync-base";
const SNAP_STORE = "sde1-sync-snapshot"; // copy of what the server held at the last sync
const PUSH_DELAY = 1500;
const PULL_EVERY = 60000;

const readLS = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const writeLS = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Apply this device's changes (base → local) on top of the other device's copy (remote).
// Because it works from what actually changed here, unticks and deletes stick instead of
// being "merged back" from the other side.
function mergeMap(base = {}, local = {}, remote = {}) {
  const out = { ...remote };
  for (const k of new Set([...Object.keys(base), ...Object.keys(local)])) {
    if (same(base[k], local[k])) continue;          // untouched here → keep remote's value
    if (k in local) out[k] = local[k]; else delete out[k];
  }
  return out;
}

function mergeList(base = [], local = [], remote = [], { prepend = false } = {}) {
  const B = new Map(base.map((x) => [x.id, x]));
  const L = new Map(local.map((x) => [x.id, x]));
  const out = new Map(remote.map((x) => [x.id, x]));
  const added = [];
  for (const id of new Set([...B.keys(), ...L.keys()])) {
    const b = B.get(id), l = L.get(id);
    if (same(b, l)) continue;                       // untouched here
    if (!l) { out.delete(id); continue; }           // deleted here
    const r = out.get(id);
    // Edited on both devices → keep the newer edit.
    if (r && b && !same(r, b) && (r.updatedAt || 0) > (l.updatedAt || 0)) continue;
    if (r) out.set(id, l); else added.push(l);
  }
  const rest = [...out.values()];
  return prepend ? [...added, ...rest] : [...rest, ...added];
}

const EMPTY = { completed: {}, custom: {}, notes: { folders: [], notes: [] } };

function merge(base, local, remote) {
  base = base || EMPTY; // first sync on this device: treat everything here as new
  const keys = new Set([...Object.keys(remote.custom || {}), ...Object.keys(local.custom || {})]);
  return {
    completed: mergeMap(base.completed, local.completed, remote.completed),
    custom: Object.fromEntries([...keys].map((k) => [k, mergeList(base.custom?.[k], local.custom?.[k], remote.custom?.[k])])),
    notes: {
      folders: mergeList(base.notes?.folders, local.notes.folders, remote.notes.folders),
      notes: mergeList(base.notes?.notes, local.notes.notes, remote.notes.notes, { prepend: true }),
    },
  };
}

export default function useSync({ state, setState, notesApi }) {
  const [syncKey, setSyncKeyState] = useState(() => readLS(KEY_STORE));
  const [status, setStatus] = useState(syncKey ? "syncing" : "off");
  const [lastSynced, setLastSynced] = useState(null);
  const [detail, setDetail] = useState(""); // exact reason when something's wrong

  const data = { completed: state.completed, custom: state.custom, notes: { folders: notesApi.folders, notes: notesApi.notes } };
  const json = JSON.stringify(data);

  const base = useRef(Number(readLS(BASE_STORE)) || 0); // server version this copy is based on
  const syncedJson = useRef(readLS(SNAP_STORE));          // what the server holds, as far as we know (survives reloads)
  const ready = useRef(false);                            // never push before the first pull
  const busy = useRef(false);
  const latest = useRef({ data, json });
  latest.current = { data, json };

  const setBase = (v) => { base.current = v; writeLS(BASE_STORE, String(v)); };
  const setSynced = (j) => { syncedJson.current = j; writeLS(SNAP_STORE, j); };

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
    const isJson = (r.headers.get("content-type") || "").includes("json");
    const res = isJson ? await r.json().catch(() => ({})) : null;
    if (r.status === 401) throw Object.assign(new Error(), { status: "auth", detail: "Passphrase doesn't match SYNC_KEY on Vercel." });
    if (!isJson || r.status === 404)
      throw Object.assign(new Error(), { status: "unavailable", detail: "No /api/sync function found. Running locally with npm run dev, or api/ wasn't deployed." });
    if (r.status >= 500) throw Object.assign(new Error(), { status: "unavailable", detail: res?.error || `Server error ${r.status}` });
    return { code: r.status, body: res };
  }, [syncKey]);

  const fail = (e) => { setStatus(e.status || "offline"); setDetail(e.detail || "Couldn't reach the server. Will retry."); };
  const ok = () => { setStatus("synced"); setLastSynced(Date.now()); setDetail(""); };

  // Bring in the other laptop's changes. If this copy also has unsaved changes, merge them.
  const handleRemote = useCallback((doc) => {
    const local = latest.current;
    const dirty = local.json !== syncedJson.current;
    const baseData = syncedJson.current ? JSON.parse(syncedJson.current) : null;
    setBase(doc.updatedAt);
    setSynced(JSON.stringify(doc.data));
    // Unsaved changes here → replay them on top of the newer copy; the push effect then saves it.
    apply(dirty ? merge(baseData, local.data, doc.data) : doc.data);
  }, [apply]);

  const pull = useCallback(async () => {
    if (!syncKey || busy.current) return;
    busy.current = true;
    try {
      const { body: doc } = await call("GET");
      if (!doc.data) setSynced(null);                             // empty server: the first push uploads this copy
      else if (doc.updatedAt > base.current) handleRemote(doc);   // other device saved since we last looked
      else if (doc.updatedAt === base.current) setSynced(JSON.stringify(doc.data)); // same version; push only if we edited
      else { setBase(0); setSynced(null); }                       // server was reset: re-upload this copy
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
      else if (code === 200) { setBase(body.updatedAt); setSynced(j); ok(); }
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
    setSynced(null);
    setSyncKeyState(v);
    setStatus(v ? "syncing" : "off");
  };

  return { status, detail, lastSynced, syncKey, setSyncKey, syncNow: pull };
}
