// Extract an 11-char YouTube video id from any common link shape.
export function parseVideoId(input) {
  const s = (input || "").trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : "https://" + s);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1, 12) || null;
    if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      if (v) return v.slice(0, 11);
      const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

export const thumbUrl = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

// Fetch title/channel via oEmbed (no API key). Falls back to noembed if YouTube blocks CORS.
export async function fetchVideoMeta(id) {
  const watch = `https://www.youtube.com/watch?v=${id}`;
  const sources = [
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`,
    `https://noembed.com/embed?url=${encodeURIComponent(watch)}`,
  ];
  for (const src of sources) {
    try {
      const r = await fetch(src);
      if (!r.ok) continue;
      const d = await r.json();
      if (d?.title) return { title: d.title, channel: d.author_name || "" };
    } catch {}
  }
  return null;
}
