import { CORS, json, search } from './_lib.js';
export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  return json({ results: await search(new URL(request.url).searchParams.get('q') || '') });
}
