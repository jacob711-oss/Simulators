import { CORS } from './_lib.js';
// Relays Quasar's AI requests. With an OPENAI_API_KEY secret it uses OpenAI; otherwise the free Pollinations service.
export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: CORS });
  const body = await request.json();
  const r = env.OPENAI_API_KEY
    ? await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.OPENAI_API_KEY }, body: JSON.stringify({ model: env.OPENAI_MODEL || 'gpt-4o-mini', messages: body.messages, stream: !!body.stream }) })
    : await fetch('https://text.pollinations.ai/openai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return new Response(r.body, { status: r.status, headers: { ...CORS, 'Content-Type': r.headers.get('Content-Type') || 'application/json' } });
}
