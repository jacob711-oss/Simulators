// Shared helpers for the Quasar server (Cloudflare Pages Functions)
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Storage-Key',
};
const UA = 'Mozilla/5.0 (compatible; QuasarServer/1.0)';
export const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
export const strip = h => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
export async function search(q) {
  const out = [];
  const add = (title, url, text) => { if (url && !out.some(o => o.url === url)) out.push({ title, url, text: (text || '').slice(0, 900) }); };
  try {
    const h = await (await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q), { headers: { 'User-Agent': UA } })).text();
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(h)) && out.length < 8) {
      let u = m[1]; const g = u.match(/[?&]uddg=([^&]+)/); if (g) u = decodeURIComponent(g[1]); if (u.startsWith('//')) u = 'https:' + u;
      add(strip(m[2]), u, strip(m[3]));
    }
  } catch (e) {}
  try {
    const j = await (await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=2&prop=extracts|info&inprop=url&exintro=1&explaintext=1&exsentences=6&gsrsearch=' + encodeURIComponent(q), { headers: { 'User-Agent': UA } })).json();
    Object.values((j.query && j.query.pages) || {}).forEach(p => add(p.title + ' (Wikipedia)', p.fullurl, p.extract));
  } catch (e) {}
  return out;
}
export async function read(url) {
  if (!/^https?:\/\//.test(url)) return 'That is not a web address.';
  const t = await (await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,text/plain' } })).text();
  return (/<html|<body|<div/i.test(t) ? strip(t) : t).slice(0, 12000);
}
