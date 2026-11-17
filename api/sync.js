// Vercel serverless function: stores the whole tracker (progress + notes) as one JSON record
// in Upstash Redis. Single user, protected by a passphrase in the SYNC_KEY env var.
//
//   GET  /api/sync            -> { updatedAt, data } (or { updatedAt: 0, data: null } if empty)
//   PUT  /api/sync            body { baseUpdatedAt, data } -> { updatedAt }
//                              409 { updatedAt, data } if another laptop saved in between.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "prep-tracker:doc";

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).result;
}

const readDoc = async () => {
  const raw = await redis(["GET", KEY]);
  return raw ? JSON.parse(raw) : { updatedAt: 0, data: null };
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  // Name what's missing (never values) so setup problems are easy to spot.
  const missing = [
    !URL_ && "KV_REST_API_URL (connect Upstash Redis in Vercel → Storage)",
    !TOKEN && "KV_REST_API_TOKEN (connect Upstash Redis in Vercel → Storage)",
    !process.env.SYNC_KEY && "SYNC_KEY",
  ].filter(Boolean);
  if (missing.length) return res.status(503).json({ error: `Server missing env var: ${missing.join(", ")}. Add it, then redeploy.` });
  if (req.headers["x-sync-key"] !== process.env.SYNC_KEY) return res.status(401).json({ error: "Wrong passphrase" });

  try {
    if (req.method === "GET") return res.status(200).json(await readDoc());

    if (req.method === "PUT") {
      const { baseUpdatedAt = 0, data } = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      if (!data || typeof data !== "object") return res.status(400).json({ error: "Missing data" });
      const current = await readDoc();
      if (current.updatedAt > baseUpdatedAt) return res.status(409).json(current);
      const updatedAt = Math.max(Date.now(), current.updatedAt + 1);
      await redis(["SET", KEY, JSON.stringify({ updatedAt, data })]);
      return res.status(200).json({ updatedAt });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
