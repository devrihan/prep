import { Layers, Code2, Wrench } from "lucide-react";
import { systemDesignItems } from "./data/systemDesign.js";
import { dsaItems } from "./data/dsa.js";
import { devItems } from "./data/dev.js";

export const PILLARS = [
  { key: "sd", label: "System Design", icon: Layers, hex: "#6366f1", accent: "bg-indigo-500", text: "text-indigo-400", base: systemDesignItems },
  { key: "dsa", label: "DSA", icon: Code2, hex: "#10b981", accent: "bg-emerald-500", text: "text-emerald-400", base: dsaItems },
  { key: "dev", label: "Development", icon: Wrench, hex: "#f59e0b", accent: "bg-amber-500", text: "text-amber-400", base: devItems },
];

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export const toSeconds = (d) => (d || "").split(":").reduce((a, p) => a * 60 + Number(p), 0) || 0;
