import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
require(join(here, 'exercise-video.js'));
const V = globalThis.ExerciseVideo;

test('parses YouTube watch, short and embed URLs into an in-app player', () => {
  const watch = V.parse('https://www.youtube.com/watch?v=dQw4w9wgGcQ');
  assert.equal(watch.kind, 'youtube');
  assert.equal(watch.videoId, 'dQw4w9wgGcQ');
  assert.match(watch.embedSrc, /youtube-nocookie\.com\/embed\/dQw4w9wgGcQ/);
  assert.equal(V.parse('https://youtu.be/dQw4w9wgGcQ').videoId, 'dQw4w9wgGcQ');
  assert.equal(V.parse('https://www.youtube.com/embed/dQw4w9wgGcQ').videoId, 'dQw4w9wgGcQ');
  assert.equal(V.parse('https://www.youtube.com/shorts/dQw4w9wgGcQ').videoId, 'dQw4w9wgGcQ');
});

test('treats direct mp4 URLs as an in-app video and other https links as external', () => {
  const mp4 = V.parse('https://cdn.example.test/squat.mp4');
  assert.equal(mp4.kind, 'mp4');
  assert.equal(mp4.src, 'https://cdn.example.test/squat.mp4');
  const link = V.parse('https://coach.example.test/demos/squat');
  assert.equal(link.kind, 'link');
  assert.equal(link.src, 'https://coach.example.test/demos/squat');
});

test('rejects blank, javascript and non-http URLs', () => {
  assert.equal(V.parse(''), null);
  assert.equal(V.parse('javascript:alert(1)'), null);
  assert.equal(V.parse('ftp://files.example/a.mp4'), null);
  assert.equal(V.parse('   '), null);
});

test('Play demo button is omitted without a URL and is not the timer control', () => {
  assert.equal(V.buttonHtml({title: 'Back Squat'}), '');
  const html = V.buttonHtml({title: 'Back Squat', videoUrl: 'https://youtu.be/dQw4w9wgGcQ'});
  assert.match(html, /Play demo/);
  assert.match(html, /Logger\.playVideo/);
  assert.doesNotMatch(html, /Logger\.timerPlay/);
  assert.doesNotMatch(html, /Start last timer/);
});
