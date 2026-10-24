import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
require(join(here, 'session-comments.js'));
const C = globalThis.SessionComments;

test('session reflection becomes the first athlete comment in the thread', () => {
  const session = {
    id: 'sess-1', date: '2026-10-22',
    coachAssignedIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
    feel: {note: 'Felt strong on the row.'},
  };
  const thread = C.fromSession(session, 'athlete-1');
  assert.equal(thread.length, 1);
  assert.equal(thread[0].authorRole, 'athlete');
  assert.equal(thread[0].body, 'Felt strong on the row.');
  assert.equal(thread[0].sessionId, 'sess-1');
  assert.equal(thread[0].assignmentId, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
});

test('a coach reply threads onto the reflection without replacing it', () => {
  const session = {id: 'sess-1', feel: {note: 'Tough set.'}, comments: []};
  const local = C.fromSession(session, 'athlete-1');
  const remote = [{
    id: 'c2', athlete_id: 'athlete-1', session_id: 'sess-1',
    author_role: 'coach', body: 'Nice work. Keep the pace honest.',
    created_at: '2026-10-22T12:00:00Z', parent_id: local[0].id,
  }];
  const thread = C.merge(local, remote);
  assert.equal(thread.length, 2);
  assert.equal(thread[0].body, 'Tough set.');
  assert.equal(thread[1].authorRole, 'coach');
  assert.equal(thread[1].parentId, thread[0].id);
});

test('local thread survives without a network and ignores another athlete', () => {
  const session = {id: 'sess-1', feel: {note: 'Keep this offline.'}, comments: []};
  const local = C.fromSession(session, 'athlete-1');
  const thread = C.merge(local, [
    {id: 'x', athlete_id: 'other', session_id: 'sess-1', author_role: 'coach', body: 'Nope'},
  ]);
  assert.equal(thread.length, 1);
  assert.equal(thread[0].body, 'Keep this offline.');
});

test('html renders the reflection and a coach reply as a thread', () => {
  const html = C.threadHtml([
    {id: 'a', authorRole: 'athlete', body: 'Felt strong.', createdAt: '2026-10-22T10:00:00Z'},
    {id: 'b', authorRole: 'coach', body: 'Good.', parentId: 'a', createdAt: '2026-10-22T11:00:00Z'},
  ]);
  assert.match(html, /Felt strong/);
  assert.match(html, /Good/);
  assert.match(html, /Coach/);
});
