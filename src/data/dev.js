// Development pillar. Source playlist: "Dev revive" (PLd62E-tBZ0hA), pulled 2026-11-17.
// More videos can still be added per topic from the UI (those sync via the app, not this file).
// Shape: { id, topic, title, duration, videoId } — topic is a DEV_TOPICS key.
export const devItems = [
  { id: "dev-1", topic: "js", title: "JavaScript for Beginners | Learn JavaScript in one hour!", duration: "1:34:42", videoId: "e2fKYP_7B_Y" },
  { id: "dev-2", topic: "ts", title: "Learn TypeScript in 40 Minutes (Full Course)", duration: "40:40", videoId: "DTR2p7D6tjk" },
  { id: "dev-3", topic: "react", title: "Complete React JS Course | MERN Stack Development", duration: "3:26:26", videoId: "E6tAtRi82QY" },
  { id: "dev-4", topic: "node", title: "Learn Node.js & Express with Project in 2 Hours", duration: "1:42:53", videoId: "H9M02of22z4" },
  { id: "dev-5", topic: "node", title: "Complete Authentication System | JWT, Refresh Token, OTP, Logout All Devices", duration: "2:43:17", videoId: "pkKn8q5AvsY" },
];

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
