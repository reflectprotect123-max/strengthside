import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Line, Stop } from 'react-native-svg';

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
  isNew?: boolean;
  sleep: SleepMetrics;
  nutrition: NutritionMetrics;
}

interface TrendCard {
  icon: string;
  label: string;
  value: string;
  unit: string;
  delta: string;
  deltaColor: string;
}

const SESSIONS: Session[] = [
  {
    date: 'Thursday, August 20, 2026',
    athlete: 'dan veldman',
    workout: 'Week 1 Day 1',
    sleep: { recovery: 71, strain: 62, sleep: 88 },
    nutrition: {
      kcalLeft: 2529,
      protein: { eaten: 0, target: 164 },
      carbs: { eaten: 0, target: 225 },
      fat: { eaten: 0, target: 70 },
    },
  },
];

const MACRO_COLORS = {
  protein: '#e879a9',
  carbs: '#e8a35c',
  fat: '#9fc59b',
} as const;

export function HomeScreen() {
  const [overview, setOverview] = useState<{ session: Session; kind: 'sleep' | 'conditioning' } | null>(
    null,
  );

  return (
    <View style={styles.app}>
      <StatusBar style="light" backgroundColor="#101010" translucent={false} />

      <View style={styles.header}>
        <Pressable style={styles.headerIcon} accessibilityLabel="Filter athletes">
          <Ionicons name="filter" size={27} color="#d8d8d8" />
        </Pressable>
        <Text style={styles.headerTitle}>ALL ATHLETES</Text>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Open calendar">
            <Ionicons name="calendar-outline" size={31} color="#dddddd" />
          </Pressable>
          <Pressable style={styles.latestButton}>
            <Text style={styles.latestText}>LATEST</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.sessions}
        contentContainerStyle={styles.sessionsContent}
        showsVerticalScrollIndicator={false}
      >
        {SESSIONS.map(session => (
          <SessionCard
            key={session.date}
            session={session}
            onOpenSleep={() => setOverview({ session, kind: 'sleep' })}
            onOpenConditioning={() => setOverview({ session, kind: 'conditioning' })}
          />
        ))}
      </ScrollView>

      <BottomNavigation />

      {overview?.kind === 'sleep' ? (
        <ReadinessOverview session={overview.session} onClose={() => setOverview(null)} />
      ) : null}
      {overview?.kind === 'conditioning' ? (
        <ConditioningOverview session={overview.session} onClose={() => setOverview(null)} />
      ) : null}
    </View>
  );
}

function SessionCard({
  session,
  onOpenSleep,
  onOpenConditioning,
}: {
  session: Session;
  onOpenSleep: () => void;
  onOpenConditioning: () => void;
}) {
  const zones = zonesForReadiness(session.sleep.recovery);

  return (
    <View style={styles.sessionCard}>
      <Text style={styles.sessionDate}>{session.date}</Text>

      <View style={styles.athleteRow}>
        <View style={styles.avatar}>
          <View style={styles.avatarRing} />
          <Ionicons name="flash-outline" size={22} color="#77736c" />
        </View>
        <View style={styles.athleteCopy}>
          <Text style={styles.athleteName}>
            {session.athlete}
            {session.isNew && <Text> — New 👋</Text>}
          </Text>
          <Text style={styles.workoutName}>{session.workout}</Text>
        </View>
      </View>

      <Pressable
        style={styles.moduleRow}
        onPress={onOpenSleep}
        accessibilityRole="button"
        accessibilityLabel={`Sleep overview for ${session.date}`}
      >
        <Text style={styles.moduleLabel}>SLEEP</Text>
        <WhoopRings metrics={session.sleep} size={92} />
        <View style={styles.moduleLegend}>
          <LegendDot color="#3dff9e" label="Recovery" value={`${session.sleep.recovery}%`} />
          <LegendDot color="#33c4ff" label="Strain" value={`${session.sleep.strain}%`} />
          <LegendDot color="#e0bc87" label="Sleep" value={`${session.sleep.sleep}%`} />
        </View>
        <Ionicons name="chevron-forward" size={18} color="#847d73" />
      </Pressable>

      <Pressable
        style={[styles.moduleRow, styles.moduleRowSpaced]}
        onPress={onOpenConditioning}
        accessibilityRole="button"
        accessibilityLabel={`Conditioning zones for ${session.date}`}
      >
        <Text style={styles.moduleLabel}>CONDITIONING</Text>
        <View style={styles.conditioningBody}>
          <Text style={styles.conditioningHint}>Zones move with today’s readiness</Text>
          <MorpheusZoneBar zones={zones} />
          <View style={styles.zoneLegend}>
            {zones.map(zone => (
              <View key={zone.key} style={styles.zoneLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: zone.color }]} />
                <Text style={styles.zoneLegendName}>{zone.short}</Text>
                <Text style={styles.zoneLegendRange}>
                  {zone.lo}–{zone.hi}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#847d73" />
      </Pressable>

      <View style={[styles.moduleRow, styles.moduleRowSpaced, styles.nutritionModule]}>
        <Text style={styles.moduleLabel}>NUTRITION</Text>
        <NutritionRings nutrition={session.nutrition} size={92} />
        <View style={styles.nutritionBody}>
          <View style={styles.nutritionTodayRow}>
            <Text style={styles.nutritionToday}>TODAY</Text>
            <View style={styles.nutritionTodayDot} />
          </View>
          <Text style={styles.nutritionKcal}>
            {session.nutrition.kcalLeft.toLocaleString()}
            <Text style={styles.nutritionKcalUnit}> kcal left</Text>
          </Text>
          <MacroBar
            letter="P"
            color={MACRO_COLORS.protein}
            eaten={session.nutrition.protein.eaten}
            target={session.nutrition.protein.target}
          />
          <MacroBar
            letter="C"
            color={MACRO_COLORS.carbs}
            eaten={session.nutrition.carbs.eaten}
            target={session.nutrition.carbs.target}
          />
          <MacroBar
            letter="F"
            color={MACRO_COLORS.fat}
            eaten={session.nutrition.fat.eaten}
            target={session.nutrition.fat.target}
          />
        </View>
      </View>
    </View>
  );
}

/** Morpheus-style HR ceilings: higher recovery lifts the day’s zone ceilings. */
export function zonesForReadiness(recovery: number, maxHr = 190) {
  const shift = Math.round(((recovery - 50) / 50) * 8);
  const recoverHi = clamp(Math.round(maxHr * 0.6) + shift, 95, maxHr - 45);
  const aerobicHi = clamp(Math.round(maxHr * 0.72) + shift, recoverHi + 8, maxHr - 28);
  const anaerobicHi = clamp(Math.round(maxHr * 0.84) + shift, aerobicHi + 8, maxHr - 12);
  const peakHi = maxHr;

  return [
    { key: 'recovery', short: 'Rec', name: 'Recovery', color: '#33c4ff', lo: Math.round(maxHr * 0.5), hi: recoverHi },
    { key: 'aerobic', short: 'Aer', name: 'Aerobic', color: '#3dff9e', lo: recoverHi + 1, hi: aerobicHi },
    { key: 'anaerobic', short: 'An', name: 'Anaerobic', color: '#ffc24d', lo: aerobicHi + 1, hi: anaerobicHi },
    { key: 'peak', short: 'Peak', name: 'Peak', color: '#ff5b57', lo: anaerobicHi + 1, hi: peakHi },
  ] as const;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type Zone = ReturnType<typeof zonesForReadiness>[number];

function MorpheusZoneBar({ zones }: { zones: readonly Zone[] }) {
  const total = zones[zones.length - 1].hi - zones[0].lo;
  return (
    <View style={styles.zoneBar}>
      {zones.map((zone, index) => {
        const width = ((zone.hi - zone.lo + 1) / total) * 100;
        return (
          <View
            key={zone.key}
            style={[
              styles.zoneSegment,
              {
                backgroundColor: zone.color,
                width: `${width}%`,
                borderTopLeftRadius: index === 0 ? 999 : 0,
                borderBottomLeftRadius: index === 0 ? 999 : 0,
                borderTopRightRadius: index === zones.length - 1 ? 999 : 0,
                borderBottomRightRadius: index === zones.length - 1 ? 999 : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
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

function NutritionRings({ nutrition, size }: { nutrition: NutritionMetrics; size: number }) {
  return (
    <ProgressRings
      size={size}
      rings={[
        {
          progress: nutrition.protein.target ? nutrition.protein.eaten / nutrition.protein.target : 0,
          color: MACRO_COLORS.protein,
        },
        {
          progress: nutrition.carbs.target ? nutrition.carbs.eaten / nutrition.carbs.target : 0,
          color: MACRO_COLORS.carbs,
        },
        {
          progress: nutrition.fat.target ? nutrition.fat.eaten / nutrition.fat.target : 0,
          color: MACRO_COLORS.fat,
        },
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
  const stroke = Math.max(7, size * 0.08);
  const gap = stroke + 3;
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
            stroke="#ffffff14"
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
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - progress)}
            />
          );
        })}
      </G>
    </Svg>
  );
}

function MacroBar({
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
  const ratio = target > 0 ? Math.min(1, eaten / target) : 0;
  return (
    <View style={styles.macroRow}>
      <Text style={[styles.macroLetter, { color }]}>{letter}</Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValue}>
        {eaten} / {target}g
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

function ReadinessOverview({
  session,
  onClose,
}: {
  session: Session | null;
  onClose: () => void;
}) {
  if (!session) return null;

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
                <Circle
                  cx="96"
                  cy="96"
                  r="90"
                  fill="none"
                  stroke="url(#brassBezel)"
                  strokeWidth="2.5"
                  opacity={0.8}
                />
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
                  <Line
                    x1="96"
                    y1="96"
                    x2="96"
                    y2="34"
                    stroke="#e0bc87"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
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

function ConditioningOverview({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const recovery = session.sleep.recovery;
  const zones = zonesForReadiness(recovery);
  const bandLabel = recovery >= 67 ? 'High' : recovery >= 34 ? 'Moderate' : 'Low';
  const guidance =
    recovery >= 67
      ? 'High readiness — anaerobic and peak work are on the table today.'
      : recovery >= 34
        ? 'Moderate readiness — bias aerobic volume; keep peak short.'
        : 'Low readiness — stay in recovery / easy aerobic zones.';

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

          <View style={styles.conditioningHero}>
            <Text style={styles.conditioningHeroEyebrow}>Morpheus · today</Text>
            <Text style={styles.conditioningHeroTitle}>Conditioning zones</Text>
            <Text style={styles.conditioningHeroCopy}>
              Ceilings shift with readiness ({recovery}% · {bandLabel}).
            </Text>
            <MorpheusZoneBar zones={zones} />
            <Text style={styles.conditioningGuidance}>{guidance}</Text>
          </View>

          <View style={styles.zoneDetailList}>
            {zones.map(zone => (
              <View key={zone.key} style={styles.zoneDetailCard}>
                <View style={styles.zoneDetailHeader}>
                  <View style={[styles.legendDot, { backgroundColor: zone.color }]} />
                  <Text style={styles.zoneDetailName}>{zone.name}</Text>
                </View>
                <Text style={styles.zoneDetailRange}>
                  {zone.lo}–{zone.hi} bpm
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function BottomNavigation() {
  return (
    <View style={styles.bottomNavigation}>
      <NavItem icon="home-outline" label="Home" active />
      <NavItem icon="calendar-outline" label="Training" />
      <NavItem icon="chatbox-ellipses-outline" label="Chat" />
      <NavItem icon="book-outline" label="Library" />
      <NavItem icon="person-circle-outline" label="Me" />
    </View>
  );
}

function NavItem({ icon, label, active = false }: { icon: IoniconName; label: string; active?: boolean }) {
  return (
    <Pressable style={styles.navItem}>
      <Ionicons name={icon} size={30} color={active ? '#f1f1f1' : '#d8d8d8'} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    height: 104,
    paddingHorizontal: 19,
    backgroundColor: '#101010',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 45,
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#f2f2f2',
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },
  headerActions: {
    width: 107,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  latestButton: {
    minWidth: 55,
    height: 25,
    borderRadius: 4,
    backgroundColor: '#eeeeee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestText: {
    color: '#353535',
    fontSize: 9,
    fontWeight: '800',
  },
  sessions: {
    flex: 1,
  },
  sessionsContent: {
    paddingBottom: 12,
  },
  sessionCard: {
    paddingTop: 21,
    paddingHorizontal: 20,
    paddingBottom: 22,
    backgroundColor: '#191919',
    borderBottomWidth: 10,
    borderBottomColor: '#101010',
  },
  sessionDate: {
    color: '#e2e2e2',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  athleteRow: {
    minHeight: 80,
    paddingTop: 19,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 53,
    height: 53,
    borderRadius: 27,
    marginRight: 11,
    overflow: 'hidden',
    backgroundColor: '#363632',
    borderWidth: 1,
    borderColor: '#484843',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#55554f',
  },
  athleteCopy: {
    paddingTop: 1,
  },
  athleteName: {
    color: '#5d8df4',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  workoutName: {
    color: '#dddddd',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '400',
  },
  moduleRow: {
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(224,188,135,0.22)',
    backgroundColor: 'rgba(192,147,88,0.09)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moduleRowSpaced: {
    marginTop: 12,
  },
  moduleLabel: {
    color: '#c09358',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    width: 92,
  },
  moduleLegend: {
    flex: 1,
    gap: 6,
  },
  conditioningBody: {
    flex: 1,
    gap: 10,
  },
  conditioningHint: {
    color: '#847d73',
    fontSize: 11,
    fontWeight: '600',
  },
  zoneBar: {
    height: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 999,
  },
  zoneSegment: {
    height: '100%',
  },
  zoneLegend: {
    gap: 5,
  },
  zoneLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  zoneLegendName: {
    color: '#aaa49a',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 36,
  },
  zoneLegendRange: {
    color: '#f5f1e9',
    fontSize: 13,
    fontWeight: '800',
  },
  nutritionModule: {
    alignItems: 'flex-start',
  },
  nutritionBody: {
    flex: 1,
    gap: 7,
    paddingTop: 2,
  },
  nutritionTodayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nutritionToday: {
    color: '#847d73',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  nutritionTodayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e8a35c',
  },
  nutritionKcal: {
    color: '#f5f1e9',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  nutritionKcalUnit: {
    color: '#aaa49a',
    fontSize: 14,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroLetter: {
    width: 12,
    fontSize: 12,
    fontWeight: '800',
  },
  macroTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#ffffff14',
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 999,
  },
  macroValue: {
    color: '#aaa49a',
    fontSize: 11,
    fontWeight: '600',
    minWidth: 62,
    textAlign: 'right',
  },
  conditioningHero: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    backgroundColor: '#0a0a09',
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  conditioningHeroEyebrow: {
    color: '#c09358',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  conditioningHeroTitle: {
    color: '#f5f1e9',
    fontSize: 22,
    fontWeight: '800',
  },
  conditioningHeroCopy: {
    color: '#aaa49a',
    fontSize: 13,
    lineHeight: 18,
  },
  conditioningGuidance: {
    color: '#e0bc87',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  zoneDetailList: {
    gap: 10,
  },
  zoneDetailCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#141311',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoneDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoneDetailName: {
    color: '#f5f1e9',
    fontSize: 15,
    fontWeight: '700',
  },
  zoneDetailRange: {
    color: '#33c4ff',
    fontSize: 16,
    fontWeight: '800',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: '#aaa49a',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 68,
  },
  legendValue: {
    color: '#f5f1e9',
    fontSize: 13,
    fontWeight: '800',
  },
  overview: {
    flex: 1,
    backgroundColor: '#070706',
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  backLinkText: {
    color: '#aaa49a',
    fontSize: 12,
  },
  overviewContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  overviewDate: {
    color: '#f5f1e9',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  overviewAthlete: {
    color: '#c09358',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'lowercase',
  },
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
  gaugeWrap: {
    width: 192,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValue: {
    color: '#f5f1e9',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.4,
  },
  gaugePercent: {
    fontSize: 15,
    fontWeight: '700',
  },
  gaugeCaption: {
    marginTop: 6,
    color: '#847d73',
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  bandBlock: {
    width: '100%',
    maxWidth: 360,
  },
  bandLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bandTitle: {
    color: '#847d73',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bandStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  bandTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'visible',
    flexDirection: 'row',
  },
  bandSegmentRed: {
    flex: 1,
    backgroundColor: '#cf7f7c',
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },
  bandSegmentAmber: {
    flex: 1,
    backgroundColor: '#d1a464',
  },
  bandSegmentGreen: {
    flex: 1,
    backgroundColor: '#9fc59b',
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
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
  trendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trendCard: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#141311',
    borderRadius: 14,
    padding: 14,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  trendIcon: {
    color: '#847d73',
    fontSize: 14,
  },
  trendLabel: {
    color: '#aaa49a',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  trendValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 8,
    marginBottom: 3,
  },
  trendValue: {
    color: '#f5f1e9',
    fontSize: 25,
    fontWeight: '800',
  },
  trendUnit: {
    color: '#847d73',
    fontSize: 11,
  },
  trendDelta: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomNavigation: {
    height: 83,
    backgroundColor: '#101010',
    borderTopWidth: 1,
    borderTopColor: '#292929',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  navItem: {
    width: '20%',
    alignItems: 'center',
  },
  navLabel: {
    marginTop: 2,
    color: '#c8c8c8',
    fontSize: 12,
    lineHeight: 16,
  },
  navLabelActive: {
    color: '#f0f0f0',
    fontWeight: '700',
  },
});
