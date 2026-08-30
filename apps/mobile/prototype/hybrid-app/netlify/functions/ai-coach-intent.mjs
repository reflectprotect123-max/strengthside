import { preflight, json, method, safeError } from './_lib/http.mjs';

const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-lite';
const ALLOWED_GATES = new Set(['ok', 'caution', 'hold']);
const ALLOWED_EFFORT = new Set(['easy', 'medium', 'hard']);
const ALLOWED_FLAGS = new Set(['pain', 'illness', 'travel', 'deload', 'test']);

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

function validateIntent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  const gate = String(raw.recovery_gate || raw.recoveryGate || '').toLowerCase();
  if (gate && ALLOWED_GATES.has(gate)) out.recovery_gate = gate;
  const effort = String(raw.cond_effort || raw.condEffort || '').toLowerCase();
  if (effort && ALLOWED_EFFORT.has(effort)) out.cond_effort = effort;
  const tone = String(raw.session_tone || raw.sessionTone || '').trim();
  if (tone) out.session_tone = tone.slice(0, 120);
  const flags = Array.isArray(raw.flags)
    ? raw.flags.map((f) => String(f || '').toLowerCase()).filter((f) => ALLOWED_FLAGS.has(f)).slice(0, 6)
    : [];
  if (flags.length) out.flags = [...new Set(flags)];
  const cue = String(raw.athlete_cue || raw.athleteCue || '').trim();
  if (cue) out.athlete_cue = cue.slice(0, 280);
  let confidence = Number(raw.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) confidence = 0.5;
  out.confidence = confidence;
  const reasonCodes = Array.isArray(raw.reason_codes)
    ? raw.reason_codes.map(String).slice(0, 8)
    : [];
  if (reasonCodes.length) out.reason_codes = reasonCodes;
  if (!out.recovery_gate && !out.cond_effort && !out.athlete_cue && !out.flags?.length) return null;
  return out;
}

function systemPrompt() {
  return [
    'Parse coach session instructions into structured training hints for a deterministic engine.',
    'Reply ONLY JSON:',
    '{"recovery_gate":"ok|caution|hold","cond_effort":"easy|medium|hard","session_tone":"short phrase","flags":["pain|illness|travel|deload|test"],"athlete_cue":"one sentence for athlete","confidence":0.0-1.0,"reason_codes":["..."]}',
    'Rules:',
    '- Never output kg, reps, sets, watts, rounds, minutes, or HR numbers.',
    '- "easy day", "tired", "sore", "deload" => recovery_gate caution or hold.',
    '- "push", "hard", "test" => cond_effort hard only if clearly about conditioning intensity.',
    '- pain/injury/niggle => flags includes pain.',
    '- sick/flu => flags includes illness and recovery_gate hold.',
    '- athlete_cue: plain motivational or tactical one-liner, max 280 chars.',
    'No markdown. No prose outside JSON.',
  ].join('\n');
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

  const session = payload.session;
  if (!session || typeof session !== 'object') return json({ error: 'session_required' }, 400);
  if (!String(session.coach_instructions || '').trim()) {
    return json({ error: 'coach_instructions_required' }, 400);
  }

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
        temperature: 0.15,
        messages: [
          { role: 'system', content: systemPrompt() },
          { role: 'user', content: JSON.stringify(session) },
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
    const intent = validateIntent(parsed);
    if (!intent) {
      return json({ error: 'invalid_model_output', raw: String(content || '').slice(0, 500) }, 422);
    }

    return json({ ok: true, intent, model: MODEL, source: 'ai_openrouter' });
  } catch (error) {
    return json({ error: 'openrouter_failed', message: safeError(error) }, 502);
  }
}
