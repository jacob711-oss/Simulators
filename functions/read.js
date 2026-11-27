import { CORS, read } from './_lib.js';
export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const t = await read(new URL(request.url).searchParams.get('url') || '');
  return new Response(t, { headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' } });
}
