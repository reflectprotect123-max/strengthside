import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from './index.mjs';

const request = (body, headers = {}) => new Request('https://example.test/functions/v1/brain-coach', {
  method: 'POST',
  headers: { authorization: 'Bearer valid-user-jwt', 'content-type': 'application/json', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('answers preflight without needing a provider secret', async () => {
  const handler = createHandler({ getEnv: () => undefined, fetchImpl: () => assert.fail('must not call provider') });
  const response = await handler(new Request('https://example.test/functions/v1/brain-coach', { method: 'OPTIONS' }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
});

test('requires a bearer token and configured OpenRouter secret', async () => {
  const handler = createHandler({ getEnv: () => undefined, fetchImpl: () => assert.fail('must not call provider') });
  assert.equal((await handler(request({ message: 'Hi' }, { authorization: '' }))).status, 401);
  const response = await handler(request({ message: 'Hi' }));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /OPENROUTER_API_KEY/);
});

test('rejects a bearer token that Supabase Auth cannot validate', async () => {
  const handler = createHandler({
    getEnv: () => 'test-secret',
    verifyAuth: async () => { throw new Error('invalid JWT'); },
    fetchImpl: () => assert.fail('must not call provider'),
  });
  const response = await handler(request({ message: 'Hi' }));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Sign in required' });
});

test('rejects invalid and empty requests before calling OpenRouter', async () => {
  const handler = createHandler({ getEnv: () => 'test-secret', fetchImpl: () => assert.fail('must not call provider') });
  assert.equal((await handler(request('{'))).status, 400);
  assert.equal((await handler(request({ message: '   ' }))).status, 400);
});

test('forwards bounded conversation context and returns only the coach reply', async () => {
  let sent;
  const handler = createHandler({
    getEnv: (name) => ({ OPENROUTER_API_KEY: 'test-secret', OPENROUTER_MODEL: 'test/model' })[name],
    fetchImpl: async (url, options) => {
      sent = { url, options, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({ model: 'test/model', choices: [{ message: { content: '  Keep the next set controlled.  ' } }] }), { status: 200 });
    },
  });
  const history = Array.from({ length: 10 }, (_, index) => ({ role: 'user', content: `message ${index}` }));
  const response = await handler(request({ message: 'How did that set look?', history, packet: { sleep: 82 } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reply: 'Keep the next set controlled.', model: 'test/model' });
  assert.equal(sent.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(sent.options.headers.authorization, 'Bearer test-secret');
  assert.equal(sent.body.messages.length, 10); // system + last eight history items + current message
  assert.equal(sent.body.messages[1].content, 'message 2');
  assert.match(sent.body.messages[0].content, /"sleep":82/);
  assert.equal(sent.body.max_tokens, 512);
});

test('does not expose upstream error bodies or network exceptions', async () => {
  const rejected = createHandler({ getEnv: () => 'test-secret', fetchImpl: async () => new Response('private provider detail', { status: 429 }) });
  const response = await rejected(request({ message: 'Hi' }));
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: 'Coach provider request failed' });
  const offline = createHandler({ getEnv: () => 'test-secret', fetchImpl: async () => { throw new Error('network detail'); } });
  assert.deepEqual(await (await offline(request({ message: 'Hi' }))).json(), { error: 'Coach service is temporarily unavailable' });
});
