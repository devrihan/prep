import React, { useState } from "react";
import { X } from "lucide-react";

export default function AddItemModal({ onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    let u = url.trim();
    if (u && !/^https?:\/\//i.test(u)) u = "https://" + u;
    onAdd(title.trim(), u);
  };
  const input = "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-500";
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Add Custom Item</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-200"><X size={18} /></button>
        </div>
        <input autoFocus className={input} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={input} placeholder="Link (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-medium hover:bg-indigo-400">Add</button>
      </form>
    </div>
  );
}
