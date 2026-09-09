export type BrainRoom = 'strength' | 'engine' | 'nutrition';

export type TodayCall = 'build' | 'control' | 'minimum';

export type BrainMetrics = {
  recovery?: number | null;
  strain?: number | null;
  sleepScore?: number | null;
  hrvMs?: number | null;
  restingHr?: number | null;
};

export type BrainCheckin = {
  sleepQuality?: number | null;
  energy?: number | null;
  muscleSoreness?: number | null;
  jointStress?: number | null;
  mentalStress?: number | null;
};

export type BrainPacket = {
  date: string;
  room: BrainRoom;
  metrics: BrainMetrics;
  checkin: BrainCheckin;
  todayCall: TodayCall;
  label: string;
  reason: string;
  connected: {
    whoop: boolean;
    concept2: boolean;
  };
};

export type CoachMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};
