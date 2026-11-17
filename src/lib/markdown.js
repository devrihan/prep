// Minimal, safe markdown renderer (HTML is escaped first, so no script injection).
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const inline = (raw) => {
  let s = esc(raw);
  s = s.replace(/`([^`]+)`/g, '<code class="rounded bg-zinc-800 px-1.5 py-0.5 text-[0.85em] text-pink-300">$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="text-indigo-400 underline">$1</a>'
  );
  return s;
};

export function renderMarkdown(src) {
  const lines = src.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      out.push(`<pre class="my-3 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-sm text-zinc-300"><code>${esc(code.join("\n"))}</code></pre>`);
      continue;
    }
    const h = /^(#{1,3})\s+(.*)/.exec(line);
    if (h) {
      const size = ["text-2xl", "text-xl", "text-lg"][h[1].length - 1];
      out.push(`<h${h[1].length} class="mt-5 mb-2 ${size} font-semibold text-zinc-100">${inline(h[2])}</h${h[1].length}>`);
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
        items.push(`<li>${inline(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""))}</li>`);
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag} class="my-2 ml-5 ${ordered ? "list-decimal" : "list-disc"} space-y-1">${items.join("")}</${tag}>`);
      continue;
    }
    if (line.startsWith(">")) {
      out.push(`<blockquote class="my-2 border-l-2 border-indigo-500 pl-3 text-zinc-400">${inline(line.replace(/^>\s?/, ""))}</blockquote>`);
      i++;
      continue;
    }
    if (!line.trim()) { i++; continue; }
    out.push(`<p class="my-2 leading-relaxed">${inline(line)}</p>`);
    i++;
  }
  return out.join("");
}
