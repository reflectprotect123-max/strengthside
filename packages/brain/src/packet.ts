import { scoreReadiness } from './readiness.js';
import type { BrainCheckin, BrainMetrics, BrainPacket, BrainRoom } from './types.js';

export function buildBrainPacket(input: {
  date: string;
  room: BrainRoom;
  metrics: BrainMetrics;
  checkin?: BrainCheckin;
  connected?: Partial<BrainPacket['connected']>;
}): BrainPacket {
  const checkin = input.checkin ?? {};
  const readiness = scoreReadiness(input.metrics, checkin);
  return {
    date: input.date,
    room: input.room,
    metrics: input.metrics,
    checkin,
    todayCall: readiness.todayCall,
    label: readiness.label,
    reason: readiness.reason,
    connected: {
      whoop: !!input.connected?.whoop,
      concept2: !!input.connected?.concept2,
    },
  };
}

export function coachContextFromPacket(packet: BrainPacket): Record<string, unknown> {
  return {
    date: packet.date,
    room: packet.room,
    today_call: packet.todayCall,
    label: packet.label,
    main_limiter: packet.reason,
    metrics: packet.metrics,
    checkin: packet.checkin,
    connected: packet.connected,
  };
}
