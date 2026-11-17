// Tiny IndexedDB wrapper for note attachments (images, videos, files).
// localStorage is too small for media, so blobs live here, keyed by attachment id.
const open = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open("prep-tracker", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("blobs");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async (mode, fn) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", mode);
    const req = fn(tx.objectStore("blobs"));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
};

export const putBlob = (id, blob) => run("readwrite", (s) => s.put(blob, id));
export const getBlob = (id) => run("readonly", (s) => s.get(id));
export const delBlob = (id) => run("readwrite", (s) => s.delete(id));
