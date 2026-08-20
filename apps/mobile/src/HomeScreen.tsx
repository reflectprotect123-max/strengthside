import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Stop } from 'react-native-svg';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface SleepMetrics {
  recovery: number;
  strain: number;
  sleep: number;
}

interface Session {
  date: string;
  athlete: string;
  workout: string;
  isNew?: boolean;
  sleep: SleepMetrics;
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
    date: 'Monday, August 10, 2026',
    athlete: 'dan veldman',
    workout: 'Week 1 Day 1',
    sleep: { recovery: 71, strain: 62, sleep: 88 },
  },
  {
    date: 'Wednesday, July 29, 2026',
    athlete: 'dan veldman',
    workout: 'Full Body Strength',
    isNew: true,
    sleep: { recovery: 64, strain: 78, sleep: 72 },
  },
];

export function HomeScreen() {
  const [overviewSession, setOverviewSession] = useState<Session | null>(null);

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
            onOpenSleep={() => setOverviewSession(session)}
          />
        ))}
      </ScrollView>

      <BottomNavigation />

      <ReadinessOverview
        session={overviewSession}
        onClose={() => setOverviewSession(null)}
      />
    </View>
  );
}

function SessionCard({
  session,
  onOpenSleep,
}: {
  session: Session;
  onOpenSleep: () => void;
}) {
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
        style={styles.sleepRow}
        onPress={onOpenSleep}
        accessibilityRole="button"
        accessibilityLabel={`Sleep overview for ${session.date}`}
      >
        <Text style={styles.sleepLabel}>SLEEP</Text>
        <WhoopRings metrics={session.sleep} size={92} />
        <View style={styles.sleepLegend}>
          <LegendDot color="#3dff9e" label="Recovery" value={`${session.sleep.recovery}%`} />
          <LegendDot color="#33c4ff" label="Strain" value={`${session.sleep.strain}%`} />
          <LegendDot color="#e0bc87" label="Sleep" value={`${session.sleep.sleep}%`} />
        </View>
        <Ionicons name="chevron-forward" size={18} color="#847d73" />
      </Pressable>
    </View>
  );
}

function WhoopRings({ metrics, size }: { metrics: SleepMetrics; size: number }) {
  const stroke = Math.max(7, size * 0.08);
  const gap = stroke + 3;
  const center = size / 2;
  const rings = [
    { progress: metrics.recovery / 100, color: '#3dff9e', radius: center - stroke / 2 - 2 },
    { progress: metrics.strain / 100, color: '#33c4ff', radius: center - stroke / 2 - 2 - gap },
    { progress: metrics.sleep / 100, color: '#e0bc87', radius: center - stroke / 2 - 2 - gap * 2 },
  ];

  return (
    <Svg width={size} height={size}>
      {rings.map(ring => (
        <Circle
          key={ring.color}
          cx={center}
          cy={center}
          r={ring.radius}
          fill="none"
          stroke="#ffffff14"
          strokeWidth={stroke}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      ))}
      {rings.map(ring => {
        const circumference = 2 * Math.PI * ring.radius;
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
            strokeDashoffset={circumference * (1 - ring.progress)}
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        );
      })}
    </Svg>
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
                <Circle
                  cx="96"
                  cy="96"
                  r="72"
                  fill="none"
                  stroke="#ffffff0f"
                  strokeWidth="11"
                  rotation={-90}
                  origin="96, 96"
                />
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
                  rotation={-90}
                  origin="96, 96"
                />
                <Line
                  x1="96"
                  y1="96"
                  x2="96"
                  y2="34"
                  stroke="#e0bc87"
                  strokeWidth="2"
                  strokeLinecap="round"
                  rotation={needleDeg}
                  origin="96, 96"
                />
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
  sleepRow: {
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
  sleepLabel: {
    color: '#c09358',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  sleepLegend: {
    flex: 1,
    gap: 6,
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
