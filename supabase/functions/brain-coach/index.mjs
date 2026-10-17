const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/free';

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, x-hybrid-product',
    'access-control-max-age': '86400',
  };
}

function jsonResponse(status, value, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders(), 'content-type': 'application/json', 'cache-control': 'no-store', ...extraHeaders },
  });
}

function coachPrompt(packet) {
  return [
    'You are a personal training coach inside the Hybrid athlete app.',
    'Use ONLY metrics in the context JSON. Do not invent numbers.',
    'You do not prescribe exact loads or change programs — explain alignment with the athlete plan.',
    'Keep answers concise (2-5 sentences unless asked for detail). Not a doctor.',
    'Context:',
    JSON.stringify(packet ?? {}),
  ].join('\n');
}

export function createHandler({ getEnv, fetchImpl = fetch, verifyAuth } = {}) {
  const env = getEnv || ((name) => Deno.env.get(name));
  return async function handleCoachRequest(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
    if (request.method !== 'POST') return jsonResponse(405, { error: 'POST only' }, { allow: 'POST, OPTIONS' });
    try {
      if (verifyAuth) await verifyAuth(request);
      else if (!request.headers.get('authorization')?.startsWith('Bearer ')) throw new Error('unauthorized');
    } catch {
      return jsonResponse(401, { error: 'Sign in required' });
    }

    const apiKey = env('OPENROUTER_API_KEY');
    if (!apiKey) return jsonResponse(503, { error: 'Coach unavailable (OPENROUTER_API_KEY not set)' });

    let body;
    try { body = await request.json(); }
    catch { return jsonResponse(400, { error: 'Invalid JSON' }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonResponse(400, { error: 'Invalid JSON' });

    const message = String(body.message || '').trim();
    if (!message) return jsonResponse(400, { error: 'message required' });
    const history = Array.isArray(body.history) ? body.history : [];
    const packet = body.packet && typeof body.packet === 'object' && !Array.isArray(body.packet) ? body.packet : {};
    const messages = [
      { role: 'system', content: coachPrompt(packet) },
      ...history
        .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && item.content)
        .slice(-8)
        .map((item) => ({ role: item.role, content: String(item.content) })),
      { role: 'user', content: message },
    ];

    let upstream;
    try {
      upstream = await fetchImpl(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'X-Title': 'Hybrid Strength Coach',
        },
        body: JSON.stringify({ model: env('OPENROUTER_MODEL') || DEFAULT_MODEL, messages, max_tokens: 512 }),
      });
    } catch {
      return jsonResponse(502, { error: 'Coach service is temporarily unavailable' });
    }

    const text = await upstream.text();
    if (!upstream.ok) return jsonResponse(upstream.status, { error: 'Coach provider request failed' });
    let result;
    try { result = JSON.parse(text); }
    catch { return jsonResponse(502, { error: 'Coach provider returned invalid JSON' }); }
    const reply = result?.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) return jsonResponse(502, { error: 'Coach returned no text' });
    return jsonResponse(200, { reply: reply.trim(), model: result?.model || DEFAULT_MODEL });
  };
}

if (typeof Deno !== 'undefined' && import.meta.main) {
  const { ownerFromRequest } = await import('../_shared/auth.ts');
  Deno.serve(createHandler({ verifyAuth: ownerFromRequest }));
}
