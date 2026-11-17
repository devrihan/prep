// Development pillar: videos are added from the UI (per topic) and saved in localStorage.
// Optional seed items can go here. Shape:
// { id: "dev-1", topic: "react", title: "...", url: "https://youtube.com/watch?v=...", videoId: "..." }
export const devItems = [];

export const DEV_TOPICS = [
  { key: "js", label: "JavaScript" },
  { key: "ts", label: "TypeScript" },
  { key: "react", label: "React" },
  { key: "node", label: "Node / Express" },
  { key: "misc", label: "Miscellaneous", untracked: true }, // also catches older items with no topic
];

const CORE = new Set(DEV_TOPICS.filter((t) => !t.untracked).map((t) => t.key));
// Misc (or topic-less) dev videos are reference only: excluded from progress stats.
export const isMiscDev = (item) => !CORE.has(item.topic);
