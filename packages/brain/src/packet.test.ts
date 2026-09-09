import { describe, expect, it } from 'vitest';
import { buildBrainPacket } from './packet.js';

describe('buildBrainPacket', () => {
  it('builds a packet with today call from metrics', () => {
    const packet = buildBrainPacket({
      date: '2026-09-09',
      room: 'engine',
      metrics: { recovery: 72, strain: 12, sleepScore: 80 },
      connected: { whoop: true },
    });
    expect(packet.room).toBe('engine');
    expect(packet.connected.whoop).toBe(true);
    expect(['build', 'control', 'minimum']).toContain(packet.todayCall);
  });
});
