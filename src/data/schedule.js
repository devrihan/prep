import { Layers, Code2, Wrench, Briefcase } from "lucide-react";

// Topics used in the weekly timetable. `pillar` links a topic to its tracker page.
export const TOPICS = {
  dsa: { label: "DSA", short: "DSA", icon: Code2, pillar: "dsa", hex: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", bar: "bg-emerald-500" },
  dev: { label: "Development", short: "Dev", icon: Wrench, pillar: "dev", hex: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", bar: "bg-amber-500" },
  sd: { label: "System Design", short: "Sys Design", icon: Layers, pillar: "sd", hex: "#6366f1", text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", bar: "bg-indigo-500" },
  job: { label: "Job Hunt", short: "Job Hunt", icon: Briefcase, pillar: null, hex: "#ec4899", text: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30", bar: "bg-pink-500" },
};

export const SCHEDULE_TITLE = "Weekly 9-Hour SDE Prep";
export const SCHEDULE_TARGET = "Target: 6–7+ LPA by March 2027";

// `dow` matches Date#getDay() (0 = Sunday). Weeks run Monday → Sunday.
export const SCHEDULE = [
  { key: "mon", label: "Mon", name: "Monday", dow: 1, sessions: [{ topic: "dsa", hours: 1 }] },
  { key: "tue", label: "Tue", name: "Tuesday", dow: 2, sessions: [{ topic: "dev", hours: 1 }] },
  { key: "wed", label: "Wed", name: "Wednesday", dow: 3, sessions: [{ topic: "dsa", hours: 1 }] },
  { key: "thu", label: "Thu", name: "Thursday", dow: 4, sessions: [{ topic: "sd", hours: 1 }] },
  { key: "fri", label: "Fri", name: "Friday", dow: 5, sessions: [{ topic: "dev", hours: 1 }] },
  { key: "sat", label: "Sat", name: "Saturday", dow: 6, sessions: [{ topic: "dsa", hours: 1 }, { topic: "job", hours: 1 }] },
  { key: "sun", label: "Sun", name: "Sunday", dow: 0, sessions: [{ topic: "sd", hours: 1 }, { topic: "dsa", hours: 1 }] },
];

export const dayHours = (day) => day.sessions.reduce((a, s) => a + s.hours, 0);
export const WEEK_HOURS = SCHEDULE.reduce((a, d) => a + dayHours(d), 0);

export const TOPIC_HOURS = Object.keys(TOPICS).map((k) => ({
  key: k,
  hours: SCHEDULE.reduce((a, d) => a + d.sessions.filter((s) => s.topic === k).reduce((x, s) => x + s.hours, 0), 0),
}));

// Monday of the week containing `t`, as YYYY-MM-DD (local time).
export function weekStart(t = Date.now()) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Key stored in `completed` when a day's session is ticked off (synced like everything else).
export const sessionKey = (week, dayKey) => `sched:${week}:${dayKey}`;

export const todayEntry = (t = Date.now()) => SCHEDULE.find((d) => d.dow === new Date(t).getDay());
