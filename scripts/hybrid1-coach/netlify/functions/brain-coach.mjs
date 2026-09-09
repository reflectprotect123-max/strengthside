/**
 * OpenRouter coach — lives on hybrid1 only (same ownership lane as WHOOP tokens).
 * Athlete site proxies here via brain-coach.mjs + _hybrid-proxy.mjs.
 */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/free';

function cors(methods = 'POST, OPTIONS') {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': methods,
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
  };
}

function systemPrompt(packet) {
  return [
    'You are a personal training coach inside the Hybrid athlete app.',
    'Use ONLY metrics in the context JSON. Do not invent numbers.',
    'You do not prescribe exact loads or change programs — explain alignment with the athlete plan.',
    'Keep answers concise (2-5 sentences unless asked for detail). Not a doctor.',
    'Context:',
    JSON.stringify(packet ?? {}),
  ].join('\n');
}

export async function handler(event) {
  const method = (event.httpMethod || 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }
  if (method !== 'POST') {
    return { statusCode: 405, headers: cors('POST, OPTIONS'), body: JSON.stringify({ error: 'POST only' }) };
  }

  const auth = event.headers.authorization || event.headers.Authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { ...cors(), 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Sign in required' }),
    };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { ...cors(), 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Coach unavailable (OPENROUTER_API_KEY not set)' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: { ...cors(), 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  const message = String(body.message || '').trim();
  const history = Array.isArray(body.history) ? body.history : [];
  const packet = body.packet && typeof body.packet === 'object' ? body.packet : {};

  if (!message) {
    return {
      statusCode: 400,
      headers: { ...cors(), 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'message required' }),
    };
  }

  const messages = [
    { role: 'system', content: systemPrompt(packet) },
    ...history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-8)
      .map((m) => ({ role: m.role, content: String(m.content) })),
    { role: 'user', content: message },
  ];

  const upstream = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'HTTP-Referer': 'https://thehybridsystem.netlify.app',
      'X-Title': 'Hybrid Coach',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages,
      max_tokens: 512,
    }),
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return {
      statusCode: upstream.status,
      headers: { ...cors(), 'content-type': 'application/json' },
      body: text || JSON.stringify({ error: 'OpenRouter error' }),
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      statusCode: 502,
      headers: { ...cors(), 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Bad upstream JSON' }),
    };
  }

  const reply = parsed?.choices?.[0]?.message?.content ?? '';
  return {
    statusCode: 200,
    headers: { ...cors(), 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify({ reply, model: parsed?.model || DEFAULT_MODEL }),
  };
}
