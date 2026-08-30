import { preflight, json, method, safeError } from './_lib/http.mjs';

const ALLOWED = new Set(['hold', 'progress', 'deload', 'retest']);
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-lite';

function validateDecision(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const action = String(raw.action || '');
  if (!ALLOWED.has(action)) return null;
  const reasonCodes = Array.isArray(raw.reason_codes)
    ? raw.reason_codes.map(String).slice(0, 16)
    : [];
  let confidence = Number(raw.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) confidence = 0.5;
  let deltaPct = raw.delta_pct;
  if (deltaPct != null) {
    deltaPct = Number(deltaPct);
    if (!Number.isFinite(deltaPct) || deltaPct < -0.15 || deltaPct > 0.1) deltaPct = undefined;
  }
  return { action, reason_codes: reasonCodes, confidence, delta_pct: deltaPct };
}

function extractJson(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function systemPrompt() {
  return [
    'You decide strength load progression for one exercise after a completed session.',
    'Reply with ONLY JSON: {"action":"hold|progress|deload|retest","reason_codes":["..."],"confidence":0.0-1.0,"delta_pct":optional number}.',
    'Rules: never block training. session_pain "yes" => hold. recovery_gate "hold" => hold unless performance_override true.',
    'progress delta_pct about 0.025; deload about -0.05. No markdown, no prose.',
  ].join(' ');
}

export async function handler(event) {
  const pf = preflight(event);
  if (pf) return pf;
  const badMethod = method(event, ['POST']);
  if (badMethod) return badMethod;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return json({ error: 'openrouter_not_configured' }, 503);

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const flash = payload.flash;
  if (!flash || typeof flash !== 'object') return json({ error: 'flash_required' }, 400);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'http-referer': 'https://thehybridsystem.netlify.app/',
        'x-title': 'THE Hybrid System',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt() },
          { role: 'user', content: JSON.stringify(flash) },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: 'openrouter_http', status: res.status, detail: detail.slice(0, 200) }, 502);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = extractJson(content);
    const decision = validateDecision(parsed);
    if (!decision) return json({ error: 'invalid_model_output', raw: String(content || '').slice(0, 500) }, 422);

    return json({ ok: true, decision, model: MODEL, source: 'ai_openrouter' });
  } catch (error) {
    return json({ error: 'openrouter_failed', message: safeError(error) }, 502);
  }
}
