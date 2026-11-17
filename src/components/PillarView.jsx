import React, { useState } from "react";
import { Plus, Inbox } from "lucide-react";
import ItemCard from "./ItemCard.jsx";
import AddItemModal from "./AddItemModal.jsx";
import Ring from "./Ring.jsx";
import { PLAYLIST_ID } from "../data/systemDesign.js";

export default function PillarView({ pillar, items, completed, stat, onToggle, onAdd, onRemove }) {
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const Icon = pillar.icon;
  const isSD = pillar.key === "sd";

  const visible = items.filter((i) => (filter === "all" ? true : filter === "done" ? completed[i.id] : !completed[i.id]));
  const tabs = [["all", `All (${items.length})`], ["pending", `Pending (${items.length - stat.done})`], ["done", `Completed (${stat.done})`]];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/40 p-5">
        <Ring value={stat.pct} size={84} stroke={9} color={pillar.hex}><span className="text-lg font-bold">{stat.pct}%</span></Ring>
        <div className="flex-1">
          <div className={`flex items-center gap-2 text-sm font-medium ${pillar.text}`}><Icon size={16} /> {pillar.label}</div>
          <div className="mt-1 text-2xl font-bold">{stat.done} / {stat.total} <span className="text-base font-normal text-zinc-500">completed</span></div>
        </div>
        {!isSD && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white">
            <Plus size={16} /> Add Custom Item
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="mb-4 inline-flex gap-1 rounded-xl bg-zinc-900 p-1 text-sm">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-lg px-3 py-1.5 ${filter === k ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>{l}</button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 py-20 text-center">
          <Inbox className="mb-3 text-zinc-600" size={34} />
          <p className="text-zinc-400">Roadmap not added yet — ready when you are.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              number={String(items.indexOf(item) + 1).padStart(2, "0")}
              done={!!completed[item.id]}
              onToggle={() => onToggle(item.id)}
              playlistId={isSD ? PLAYLIST_ID : null}
              onRemove={item.custom ? () => onRemove(item.id) : null}
            />
          ))}
        </ul>
      )}

      {adding && <AddItemModal onClose={() => setAdding(false)} onAdd={(t, u) => { onAdd(t, u); setAdding(false); }} />}
    </div>
  );
}
