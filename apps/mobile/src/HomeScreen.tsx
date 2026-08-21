import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Line, Stop } from 'react-native-svg';
import {
  loadCondBank,
  saveCondBank,
  type CondWeek,
  type ZoneBank,
} from './condBankStorage';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface SleepMetrics {
  recovery: number;
  strain: number;
  sleep: number;
}

interface NutritionMetrics {
  kcalLeft: number;
  protein: { eaten: number; target: number };
  carbs: { eaten: number; target: number };
  fat: { eaten: number; target: number };
}

interface Session {
  date: string;
  athlete: string;
  workout: string;
  weekId: string;
  isNew?: boolean;
  sleep: SleepMetrics;
  nutrition: NutritionMetrics;
  conditioning: CondWeek;
}

interface TrendCard {
  icon: string;
  label: string;
  value: string;
  unit: string;
  delta: string;
  deltaColor: string;
}

const INITIAL_SESSION: Session = {
  date: 'Thursday, August 20, 2026',
  athlete: 'dan veldman',
  workout: 'Week 1 Day 1',
  weekId: 'W1',
  sleep: { recovery: 71, strain: 62, sleep: 88 },
  nutrition: {
    kcalLeft: 2529,
    protein: { eaten: 0, target: 164 },
    carbs: { eaten: 0, target: 225 },
    fat: { eaten: 0, target: 70 },
  },
  conditioning: {
    low: { banked: 42, target: 90 },
    mod: { banked: 28, target: 60 },
    high: { banked: 14, target: 30 },
  },
};

const MACRO_COLORS = {
  protein: '#c09358',
  carbs: '#33c4ff',
  fat: '#9fc59b',
} as const;

const LIVE_TOTAL_SEC = 20 * 60;
const LIVE_RING_C = 2 * Math.PI * 56;

function applyBank(
  prev: CondWeek,
  added: { low: number; mod: number; high: number },
): CondWeek {
  const bump = (z: ZoneBank, add: number): ZoneBank => ({
    ...z,
    banked: Math.min(z.target, z.banked + Math.max(0, add)),
  });
  return {
    low: bump(prev.low, added.low),
    mod: bump(prev.mod, added.mod),
    high: bump(prev.high, added.high),
  };
}

export function HomeScreen() {
  const [session, setSession] = useState(INITIAL_SESSION);
  const [overview, setOverview] = useState<'sleep' | 'live' | null>(null);
  const [bankReady, setBankReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const conditioning = await loadCondBank(
        INITIAL_SESSION.athlete,
        INITIAL_SESSION.weekId,
      );
      if (cancelled) return;
      if (conditioning) {
        setSession(prev => ({ ...prev, conditioning }));
      }
      setBankReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bankMinutes = (added: { low: number; mod: number; high: number }) => {
    setSession(prev => {
      const nextWeek = applyBank(prev.conditioning, added);
      void saveCondBank(prev.athlete, prev.weekId, nextWeek);
      return { ...prev, conditioning: nextWeek };
    });
    setOverview(null);
  };

  return (
    <View style={styles.app} testID={bankReady ? 'home-bank-ready' : 'home-bank-loading'}>
      <StatusBar style="light" backgroundColor="#101010" translucent={false} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ALL ATHLETES</Text>
        <View style={styles.latestButton}>
          <Text style={styles.latestText}>W1 · D1</Text>
        </View>
      </View>

      <ScrollView
        style={styles.sessions}
        contentContainerStyle={styles.sessionsContent}
        showsVerticalScrollIndicator={false}
      >
        <SessionCard
          session={session}
          onOpenSleep={() => setOverview('sleep')}
          onOpenLive={() => setOverview('live')}
        />
      </ScrollView>

      <BottomNavigation />

      {overview === 'sleep' ? (
        <ReadinessOverview session={session} onClose={() => setOverview(null)} />
      ) : null}
      {overview === 'live' ? (
        <LiveRingScreen
          session={session}
          onClose={() => setOverview(null)}
          onBank={bankMinutes}
        />
      ) : null}
    </View>
  );
}

function SessionCard({
  session,
  onOpenSleep,
  onOpenLive,
}: {
  session: Session;
  onOpenSleep: () => void;
  onOpenLive: () => void;
}) {
  const recovery = session.sleep.recovery;
  const readyLabel = recovery >= 67 ? `High · ${recovery}` : recovery >= 34 ? `Mod · ${recovery}` : `Low · ${recovery}`;
  const readyColor = recovery >= 67 ? '#3dff9e' : recovery >= 34 ? '#c09358' : '#ff5b57';
  const weekBanked =
    session.conditioning.low.banked + session.conditioning.mod.banked + session.conditioning.high.banked;
  const weekTarget =
    session.conditioning.low.target + session.conditioning.mod.target + session.conditioning.high.target;
  const zones = zonesForReadiness(recovery);
  const bankByKey = {
    low: session.conditioning.low,
    mod: session.conditioning.mod,
    high: session.conditioning.high,
  } as const;

  return (
    <View style={styles.sessionCard}>
      <View style={styles.athleteRow}>
        <View style={styles.avatar}>
          <Ionicons name="flash-outline" size={18} color="#e0bc87" />
        </View>
        <View style={styles.athleteCopy}>
          <Text style={styles.athleteName}>{session.athlete}</Text>
          <Text style={styles.workoutName}>
            {session.date.replace(/,.*/, '')} · {session.workout}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.card}
        onPress={onOpenSleep}
        accessibilityRole="button"
        accessibilityLabel={`Sleep overview for ${session.date}`}
      >
        <View style={styles.cardHead}>
          <Text style={styles.cardKicker}>SLEEP</Text>
          <Text style={styles.readyLine}>
            <Text style={styles.readyMute}>Ready </Text>
            <Text style={{ color: readyColor, fontWeight: '800' }}>{readyLabel}</Text>
          </Text>
        </View>
        <View style={styles.sleepRow}>
          <WhoopRings metrics={session.sleep} size={76} />
          <View style={styles.moduleLegend}>
            <LegendDot color="#3dff9e" label="Recovery" value={`${session.sleep.recovery}%`} />
            <LegendDot color="#33c4ff" label="Strain" value={`${session.sleep.strain}%`} />
            <LegendDot color="#e0bc87" label="Sleep" value={`${session.sleep.sleep}%`} />
          </View>
        </View>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={onOpenLive}
        accessibilityRole="button"
        accessibilityLabel={`Conditioning live ring for ${session.date}`}
      >
        <Text style={styles.cardKicker}>CONDITIONING</Text>
        <View style={styles.weekBank}>
          <Text style={styles.weekBankLabel}>Week banked</Text>
          <Text style={styles.weekBankValue}>
            {weekBanked} / {weekTarget} min
          </Text>
        </View>
        <View style={styles.rails}>
          {zones.map(zone => {
            const bank = bankByKey[zone.key];
            const pct = bank.target ? Math.min(100, Math.round((bank.banked / bank.target) * 100)) : 0;
            return (
              <View key={zone.key} style={styles.rail}>
                <View style={styles.railMeta}>
                  <Text style={styles.railName}>{zone.name}</Text>
                  <Text style={styles.railMins}>
                    {bank.banked}/{bank.target}m
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: zone.color }]} />
                </View>
              </View>
            );
          })}
        </View>
        <Text style={styles.hint}>Tap to train</Text>
      </Pressable>

      <View style={styles.card} accessibilityLabel="Nutrition">
        <Text style={styles.cardKicker}>NUTRITION</Text>
        <View style={styles.kcalRow}>
          <View>
            <Text style={styles.kcalValue}>{session.nutrition.kcalLeft.toLocaleString()}</Text>
            <Text style={styles.kcalUnit}>kcal left</Text>
          </View>
          <View style={styles.macroRings}>
            <SmallMacroRing
              letter="P"
              color={MACRO_COLORS.protein}
              eaten={session.nutrition.protein.eaten}
              target={session.nutrition.protein.target}
            />
            <SmallMacroRing
              letter="C"
              color={MACRO_COLORS.carbs}
              eaten={session.nutrition.carbs.eaten}
              target={session.nutrition.carbs.target}
            />
            <SmallMacroRing
              letter="F"
              color={MACRO_COLORS.fat}
              eaten={session.nutrition.fat.eaten}
              target={session.nutrition.fat.target}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Hybrid APK-style 3-zone ceilings: higher recovery lifts the day’s bands. */
export function zonesForReadiness(recovery: number, maxHr = 190) {
  const shift = Math.round(((recovery - 50) / 50) * 8);
  let loHi = Math.round(maxHr * 0.7) + Math.round(shift * 0.4);
  let modHi = Math.round(maxHr * 0.85) + Math.round(shift * 0.6);
  loHi = clamp(loHi, Math.round(maxHr * 0.55), Math.round(maxHr * 0.78));
  modHi = clamp(modHi, loHi + 8, maxHr - 5);
  return [
    {
      key: 'low' as const,
      short: 'Rec',
      name: 'Recovery',
      color: '#33c4ff',
      lo: Math.round(maxHr * 0.5),
      hi: loHi,
    },
    {
      key: 'mod' as const,
      short: 'Mod',
      name: 'Moderate',
      color: '#3dff9e',
      lo: loHi + 1,
      hi: modHi,
    },
    {
      key: 'high' as const,
      short: 'Ovl',
      name: 'Overload',
      color: '#ff5b57',
      lo: modHi + 1,
      hi: maxHr,
    },
  ] as const;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type Zone = ReturnType<typeof zonesForReadiness>[number];

function zoneOf(bpm: number, zones: readonly Zone[]) {
  return zones.find(z => bpm >= z.lo && bpm <= z.hi) ?? null;
}

function fmtClock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function WhoopRings({ metrics, size }: { metrics: SleepMetrics; size: number }) {
  return (
    <ProgressRings
      size={size}
      rings={[
        { progress: metrics.recovery / 100, color: '#3dff9e' },
        { progress: metrics.strain / 100, color: '#33c4ff' },
        { progress: metrics.sleep / 100, color: '#e0bc87' },
      ]}
    />
  );
}

function ProgressRings({
  size,
  rings,
}: {
  size: number;
  rings: Array<{ progress: number; color: string }>;
}) {
  const stroke = Math.max(6, size * 0.08);
  const gap = stroke + 2;
  const center = size / 2;
  const drawn = rings.map((ring, index) => ({
    ...ring,
    radius: center - stroke / 2 - 2 - gap * index,
  }));

  return (
    <Svg width={size} height={size}>
      <G transform={`rotate(-90 ${center} ${center})`}>
        {drawn.map(ring => (
          <Circle
            key={`${ring.color}-track`}
            cx={center}
            cy={center}
            r={ring.radius}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={stroke}
          />
        ))}
        {drawn.map(ring => {
          const circumference = 2 * Math.PI * ring.radius;
          const progress = Math.min(1, Math.max(0, ring.progress));
          return (
            <Circle
              key={`${ring.color}-progress`}
              cx={center}
              cy={center}
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - progress)}
            />
          );
        })}
      </G>
    </Svg>
  );
}

function SmallMacroRing({
  letter,
  color,
  eaten,
  target,
}: {
  letter: string;
  color: string;
  eaten: number;
  target: number;
}) {
  const size = 40;
  const r = 14;
  const c = 2 * Math.PI * r;
  const progress = target > 0 ? Math.min(1, eaten / target) : 0;
  return (
    <View style={styles.macroRing}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2a2a2a" strokeWidth={4} />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="butt"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - progress)}
          />
        </G>
      </Svg>
      <Text style={styles.macroLetter}>{letter}</Text>
      <Text style={styles.macroValue}>
        {eaten}/{target}
      </Text>
    </View>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

function ReadinessOverview({ session, onClose }: { session: Session; onClose: () => void }) {
  const recovery = session.sleep.recovery;
  const bandPos = Math.min(96, Math.max(4, recovery));
  const bandLabel = recovery >= 67 ? 'High' : recovery >= 34 ? 'Moderate' : 'Low';
  const bandColor = recovery >= 67 ? '#9fc59b' : recovery >= 34 ? '#d1a464' : '#cf7f7c';
  const ringOffset = 452.4 * (1 - recovery / 100);
  const needleDeg = (recovery / 100) * 360;
  const trends: TrendCard[] = [
    { icon: '∿', label: 'HRV', value: '62', unit: 'ms', delta: '+4 ms vs previous reading', deltaColor: '#9fc59b' },
    { icon: '♥', label: 'Resting HR', value: '48', unit: 'bpm', delta: '−1 bpm vs previous reading', deltaColor: '#9fc59b' },
    {
      icon: '☾',
      label: 'Sleep performance',
      value: String(session.sleep.sleep),
      unit: '%',
      delta: '+6% vs previous reading',
      deltaColor: '#9fc59b',
    },
    {
      icon: '⚡',
      label: 'Strain',
      value: String(session.sleep.strain),
      unit: '',
      delta: '+1.4 vs previous reading',
      deltaColor: '#aaa49a',
    },
  ];

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.overview}>
        <StatusBar style="light" backgroundColor="#070706" translucent={false} />
        <Pressable style={styles.backLink} onPress={onClose} accessibilityRole="button">
          <Text style={styles.backLinkText}>← Back</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.overviewContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewDate}>{session.date}</Text>
          <Text style={styles.overviewAthlete}>{session.athlete}</Text>

          <View style={styles.gaugeCard}>
            <View style={styles.gaugeWrap}>
              <Svg width={192} height={192} viewBox="0 0 192 192">
                <Defs>
                  <LinearGradient id="brassBezel" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#c8a06d" />
                    <Stop offset="45%" stopColor="#8a6a3f" />
                    <Stop offset="55%" stopColor="#8a6a3f" />
                    <Stop offset="100%" stopColor="#e0bc87" />
                  </LinearGradient>
                </Defs>
                <Circle cx="96" cy="96" r="90" fill="none" stroke="url(#brassBezel)" strokeWidth="2.5" opacity={0.8} />
                <G transform="rotate(-90 96 96)">
                  <Circle cx="96" cy="96" r="72" fill="none" stroke="#ffffff0f" strokeWidth="11" />
                  <Circle
                    cx="96"
                    cy="96"
                    r="72"
                    fill="none"
                    stroke="#3dff9e"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray="452.4 452.4"
                    strokeDashoffset={ringOffset}
                  />
                </G>
                <G transform={`rotate(${needleDeg} 96 96)`}>
                  <Line x1="96" y1="96" x2="96" y2="34" stroke="#e0bc87" strokeWidth="2" strokeLinecap="round" />
                </G>
                <Circle cx="96" cy="96" r="4.5" fill="#e0bc87" />
              </Svg>
              <View style={styles.gaugeCenter}>
                <Text style={styles.gaugeValue}>
                  {recovery}
                  <Text style={styles.gaugePercent}>%</Text>
                </Text>
                <Text style={styles.gaugeCaption}>Recovery</Text>
              </View>
            </View>

            <View style={styles.bandBlock}>
              <View style={styles.bandLabels}>
                <Text style={styles.bandTitle}>Readiness</Text>
                <Text style={[styles.bandStatus, { color: bandColor }]}>{bandLabel}</Text>
              </View>
              <View style={styles.bandTrack}>
                <View style={styles.bandSegmentRed} />
                <View style={styles.bandSegmentAmber} />
                <View style={styles.bandSegmentGreen} />
                <View style={[styles.bandThumb, { left: `${bandPos}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.trendGrid}>
            {trends.map(card => (
              <View key={card.label} style={styles.trendCard}>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendIcon}>{card.icon}</Text>
                  <Text style={styles.trendLabel}>{card.label}</Text>
                </View>
                <View style={styles.trendValueRow}>
                  <Text style={styles.trendValue}>{card.value}</Text>
                  {card.unit ? <Text style={styles.trendUnit}>{card.unit}</Text> : null}
                </View>
                <Text style={[styles.trendDelta, { color: card.deltaColor }]}>{card.delta}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function LiveRingScreen({
  session,
  onClose,
  onBank,
}: {
  session: Session;
  onClose: () => void;
  onBank: (added: { low: number; mod: number; high: number }) => void;
}) {
  const zones = zonesForReadiness(session.sleep.recovery);
  const maxHr = 190;
  const [bpm, setBpm] = useState(95);
  const [elapsed, setElapsed] = useState(0);
  const [zoneSec, setZoneSec] = useState({ low: 0, mod: 0, high: 0 });
  const bpmRef = useRef(95);
  const elapsedRef = useRef(0);
  const zoneRef = useRef({ low: 0, mod: 0, high: 0 });

  useEffect(() => {
    const liveZones = zonesForReadiness(session.sleep.recovery);
    bpmRef.current = 95;
    elapsedRef.current = 0;
    zoneRef.current = { low: 0, mod: 0, high: 0 };
    setBpm(95);
    setElapsed(0);
    setZoneSec({ low: 0, mod: 0, high: 0 });

    const tick = setInterval(() => {
      elapsedRef.current = Math.min(LIVE_TOTAL_SEC, elapsedRef.current + 1);
      const active = zoneOf(bpmRef.current, liveZones);
      if (active) {
        zoneRef.current = {
          ...zoneRef.current,
          [active.key]: zoneRef.current[active.key] + 1,
        };
      }
      setElapsed(elapsedRef.current);
      setZoneSec({ ...zoneRef.current });
    }, 1000);

    const walk = setInterval(() => {
      const e = elapsedRef.current;
      bpmRef.current = Math.max(
        70,
        Math.min(maxHr, Math.round(95 + (e / LIVE_TOTAL_SEC) * 80 + Math.sin(e / 8) * 6)),
      );
      setBpm(bpmRef.current);
    }, 500);

    return () => {
      clearInterval(tick);
      clearInterval(walk);
    };
  }, [session.sleep.recovery]);

  const z = zoneOf(bpm, zones);
  const color = z ? z.color : '#555';
  const frac = Math.min(1, bpm / maxHr);
  let phase: string;
  if (elapsed < 120) phase = `Warm-up · ${fmtClock(120 - elapsed)}`;
  else if (elapsed < LIVE_TOTAL_SEC - 120) {
    const into = elapsed - 120;
    phase = `Work ${Math.floor(into / 60) + 1} · ${fmtClock(60 - (into % 60))}`;
  } else if (elapsed >= LIVE_TOTAL_SEC) phase = 'Complete';
  else phase = `Cool-down · ${fmtClock(LIVE_TOTAL_SEC - elapsed)}`;

  const nudge = (delta: number) => {
    bpmRef.current = Math.max(60, Math.min(maxHr, bpmRef.current + delta));
    setBpm(bpmRef.current);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.overview}>
        <StatusBar style="light" backgroundColor="#070706" translucent={false} />
        <View style={styles.liveTop}>
          <Pressable style={styles.exitBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.exitBtnText}>Exit</Text>
          </Pressable>
          <Text style={styles.liveTitle}>Live ring</Text>
        </View>

        <ScrollView contentContainerStyle={styles.liveBody} showsVerticalScrollIndicator={false}>
          <View style={styles.hud}>
            <View style={styles.liveRingWrap}>
              <Svg width={128} height={128} viewBox="0 0 140 140">
                <Circle cx="70" cy="70" r="56" fill="none" stroke="#2a2e36" strokeWidth="12" />
                <Circle
                  cx="70"
                  cy="70"
                  r="56"
                  fill="none"
                  stroke={color}
                  strokeWidth="12"
                  strokeDasharray={`${LIVE_RING_C} ${LIVE_RING_C}`}
                  strokeDashoffset={LIVE_RING_C * (1 - frac)}
                  transform="rotate(-90 70 70)"
                />
              </Svg>
              <View style={styles.liveRingHole}>
                <Text style={[styles.liveBpm, { color }]}>{bpm}</Text>
                <Text style={styles.liveBpmLabel}>BPM</Text>
              </View>
            </View>
            <View style={styles.liveSide}>
              <Text style={[styles.liveZone, { color }]}>{z ? z.name : 'Below'}</Text>
              <Text style={styles.liveClock}>{fmtClock(elapsed)}</Text>
              <Text style={styles.liveOf}>of {fmtClock(LIVE_TOTAL_SEC)}</Text>
              <Text style={styles.livePhase}>{phase}</Text>
            </View>
          </View>

          <View style={styles.scrub}>
            <Pressable style={styles.scrubBtn} onPress={() => nudge(-5)} accessibilityLabel="Lower demo bpm">
              <Text style={styles.scrubBtnText}>−</Text>
            </Pressable>
            <Text style={styles.scrubLab}>Demo bpm</Text>
            <Pressable style={styles.scrubBtn} onPress={() => nudge(5)} accessibilityLabel="Raise demo bpm">
              <Text style={styles.scrubBtnText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.holdCard}>
            <Text style={styles.holdHead}>Hold bands</Text>
            {zones.map(zone => (
              <View key={zone.key} style={styles.holdRow}>
                <View style={styles.holdLeft}>
                  <View style={[styles.legendDot, { backgroundColor: zone.color }]} />
                  <Text style={styles.holdName}>{zone.name}</Text>
                </View>
                <Text style={styles.holdRange}>
                  {zone.lo}–{zone.hi}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.finishBtn}
            accessibilityRole="button"
            accessibilityLabel="Finish and bank minutes"
            onPress={() =>
              onBank({
                low: Math.ceil(zoneSec.low / 60),
                mod: Math.ceil(zoneSec.mod / 60),
                high: Math.ceil(zoneSec.high / 60),
              })
            }
          >
            <Text style={styles.finishBtnText}>Finish · bank</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function BottomNavigation() {
  return (
    <View style={styles.bottomNavigation}>
      <NavItem icon="home-outline" label="Home" active />
      <NavItem icon="calendar-outline" label="Train" />
      <NavItem icon="list-outline" label="Log" />
      <NavItem icon="person-circle-outline" label="Me" />
    </View>
  );
}

function NavItem({ icon, label, active = false }: { icon: IoniconName; label: string; active?: boolean }) {
  return (
    <Pressable style={styles.navItem}>
      <Ionicons name={icon} size={26} color={active ? '#e0bc87' : '#555'} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#101010',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#f2f2f2',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },
  latestButton: {
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestText: { color: '#c09358', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  sessions: { flex: 1 },
  sessionsContent: { paddingBottom: 8 },
  sessionCard: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, gap: 8 },
  athleteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  athleteCopy: { flex: 1 },
  athleteName: { color: '#f5f1e9', fontSize: 14, fontWeight: '800', textTransform: 'lowercase' },
  workoutName: { color: '#847d73', fontSize: 11, fontWeight: '600', marginTop: 1 },
  card: {
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  cardKicker: {
    color: '#c09358',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  readyLine: { fontSize: 11 },
  readyMute: { color: '#847d73', fontWeight: '600' },
  sleepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  moduleLegend: { flex: 1, gap: 5 },
  weekBank: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  weekBankLabel: {
    color: '#847d73',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  weekBankValue: { color: '#e0bc87', fontSize: 13, fontWeight: '800' },
  rails: { gap: 7 },
  rail: { gap: 3 },
  railMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  railName: {
    color: '#aaa49a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  railMins: { color: '#f5f1e9', fontSize: 11, fontWeight: '700' },
  track: { height: 5, borderRadius: 3, backgroundColor: '#2a2e36', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  hint: { marginTop: 8, textAlign: 'center', color: '#847d73', fontSize: 10, fontWeight: '600' },
  kcalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  kcalValue: { color: '#f5f1e9', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  kcalUnit: { color: '#847d73', fontSize: 11, fontWeight: '600', marginTop: 2 },
  macroRings: { flexDirection: 'row', gap: 8 },
  macroRing: { width: 44, alignItems: 'center', gap: 2 },
  macroLetter: { color: '#aaa49a', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  macroValue: { color: '#847d73', fontSize: 9, fontWeight: '700' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { color: '#aaa49a', fontSize: 12, fontWeight: '600', minWidth: 68 },
  legendValue: { color: '#f5f1e9', fontSize: 12, fontWeight: '800' },
  overview: { flex: 1, backgroundColor: '#070706' },
  backLink: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  backLinkText: { color: '#aaa49a', fontSize: 12 },
  overviewContent: { paddingHorizontal: 20, paddingBottom: 40 },
  overviewDate: { color: '#f5f1e9', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  overviewAthlete: { color: '#c09358', fontSize: 13, fontWeight: '700', marginBottom: 16, textTransform: 'lowercase' },
  gaugeCard: {
    alignItems: 'center',
    gap: 22,
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    backgroundColor: '#0a0a09',
    marginBottom: 20,
  },
  gaugeWrap: { width: 192, height: 192, alignItems: 'center', justifyContent: 'center' },
  gaugeCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  gaugeValue: { color: '#f5f1e9', fontSize: 42, fontWeight: '900', letterSpacing: -1.4 },
  gaugePercent: { fontSize: 15, fontWeight: '700' },
  gaugeCaption: { marginTop: 6, color: '#847d73', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' },
  bandBlock: { width: '100%', maxWidth: 360 },
  bandLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bandTitle: { color: '#847d73', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  bandStatus: { fontSize: 12, fontWeight: '700' },
  bandTrack: { height: 6, borderRadius: 999, overflow: 'visible', flexDirection: 'row' },
  bandSegmentRed: { flex: 1, backgroundColor: '#cf7f7c', borderTopLeftRadius: 999, borderBottomLeftRadius: 999 },
  bandSegmentAmber: { flex: 1, backgroundColor: '#d1a464' },
  bandSegmentGreen: { flex: 1, backgroundColor: '#9fc59b', borderTopRightRadius: 999, borderBottomRightRadius: 999 },
  bandThumb: {
    position: 'absolute',
    top: '50%',
    width: 15,
    height: 15,
    marginTop: -7.5,
    marginLeft: -7.5,
    borderRadius: 8,
    backgroundColor: '#f5f1e9',
    borderWidth: 3,
    borderColor: '#0a0a09',
  },
  trendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  trendCard: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#141311',
    borderRadius: 14,
    padding: 14,
  },
  trendHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  trendIcon: { color: '#847d73', fontSize: 14 },
  trendLabel: { color: '#aaa49a', fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  trendValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8, marginBottom: 3 },
  trendValue: { color: '#f5f1e9', fontSize: 25, fontWeight: '800' },
  trendUnit: { color: '#847d73', fontSize: 11 },
  trendDelta: { fontSize: 11, fontWeight: '700' },
  liveTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  exitBtn: { backgroundColor: '#1c1c1c', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  exitBtnText: { color: '#c09358', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  liveTitle: { color: '#f5f1e9', fontSize: 18, fontWeight: '800' },
  liveBody: { padding: 16, gap: 12, paddingBottom: 28 },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 16,
  },
  liveRingWrap: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  liveRingHole: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  liveBpm: { fontSize: 40, fontWeight: '900', lineHeight: 42 },
  liveBpmLabel: { color: '#847d73', fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginTop: 2 },
  liveSide: { flex: 1 },
  liveZone: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  liveClock: { color: '#f5f1e9', fontSize: 34, fontWeight: '900', marginTop: 4 },
  liveOf: { color: '#847d73', fontSize: 13, marginTop: 2 },
  livePhase: { color: '#c09358', fontSize: 14, fontWeight: '600', marginTop: 10 },
  scrub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 8,
  },
  scrubBtn: {
    width: 52,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrubBtnText: { color: '#e0bc87', fontSize: 22, fontWeight: '700' },
  scrubLab: {
    flex: 1,
    textAlign: 'center',
    color: '#847d73',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  holdCard: {
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
  },
  holdHead: {
    color: '#847d73',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  holdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  holdLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  holdName: { color: '#aaa49a', fontSize: 14, fontWeight: '600' },
  holdRange: { color: '#f5f1e9', fontSize: 14, fontWeight: '700' },
  finishBtn: {
    marginTop: 4,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#c2974e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: { color: '#1b1509', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
  bottomNavigation: {
    height: 56,
    backgroundColor: '#0c0c0c',
    borderTopWidth: 1,
    borderTopColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: { alignItems: 'center', minWidth: 64 },
  navLabel: { marginTop: 2, color: '#555', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  navLabelActive: { color: '#e0bc87' },
});
