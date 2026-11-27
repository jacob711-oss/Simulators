import { CORS, json } from '../../_lib.js';
// The storage area (a Cloudflare R2 bucket bound as STORAGE).
//   GET    /api/files            -> list of files
//   GET    /api/files/<name>     -> download a file
//   PUT    /api/files/<name>     -> upload (needs header X-Storage-Key = your STORAGE_KEY secret)
//   DELETE /api/files/<name>     -> delete (needs X-Storage-Key)
export async function onRequest({ request, env, params }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (!env.STORAGE) return json({ error: 'Storage is not connected yet: add an R2 binding named STORAGE in the Pages project settings.' }, 503);
  const name = (params.name || []).join('/');
  const allowed = env.STORAGE_KEY && request.headers.get('X-Storage-Key') === env.STORAGE_KEY;
  if (!name) {
    if (request.method !== 'GET') return json({ error: 'Give a file name' }, 400);
    const l = await env.STORAGE.list({ limit: 1000 });
    return json({ files: l.objects.map(o => ({ name: o.key, size: o.size, uploaded: o.uploaded })) });
  }
  if (request.method === 'GET') {
    const o = await env.STORAGE.get(name);
    if (!o) return json({ error: 'Not found' }, 404);
    return new Response(o.body, { headers: { ...CORS, 'Content-Type': o.httpMetadata?.contentType || 'application/octet-stream' } });
  }
  if (!allowed) return json({ error: 'Wrong or missing X-Storage-Key' }, 401);
  if (request.method === 'PUT') {
    await env.STORAGE.put(name, request.body, { httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' } });
    return json({ saved: name });
  }
  if (request.method === 'DELETE') { await env.STORAGE.delete(name); return json({ deleted: name }); }
  return json({ error: 'Method not allowed' }, 405);
}
