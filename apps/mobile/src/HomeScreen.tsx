import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Session {
  date: string;
  athlete: string;
  workout: string;
  blocks: string;
  minutes: string;
  kilograms: string;
  isNew?: boolean;
  showComment?: boolean;
}

const SESSIONS: Session[] = [
  {
    date: 'Monday, August 10, 2026',
    athlete: 'dan veldman',
    workout: 'Week 1 Day 1',
    blocks: '3/5',
    minutes: '-',
    kilograms: '6550',
    showComment: true,
  },
  {
    date: 'Wednesday, July 29, 2026',
    athlete: 'dan veldman',
    workout: 'Full Body Strength',
    blocks: '5/6',
    minutes: '60',
    kilograms: '4020',
    isNew: true,
  },
];

export function HomeScreen() {
  const [expanded, setExpanded] = useState(false);

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

      <View style={styles.expandRow}>
        <Text style={styles.expandLabel}>Expand all cards</Text>
        <Switch
          value={expanded}
          onValueChange={setExpanded}
          trackColor={{ false: '#555555', true: '#597aad' }}
          thumbColor={expanded ? '#eeeeee' : '#c6c6c6'}
          ios_backgroundColor="#555555"
          style={styles.expandSwitch}
        />
      </View>

      <ScrollView
        style={styles.sessions}
        contentContainerStyle={styles.sessionsContent}
        showsVerticalScrollIndicator={false}
      >
        {SESSIONS.map(session => (
          <SessionCard key={session.date} session={session} expanded={expanded} />
        ))}
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

function SessionCard({ session, expanded }: { session: Session; expanded: boolean }) {
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

      <View style={styles.statsRow}>
        <Stat icon="pie-chart-outline" value={session.blocks} label="Blocks" accent />
        <ReadinessStat />
        <Stat icon="time-outline" value={session.minutes} label="Minutes" />
        <Stat icon="speedometer-outline" value="-" label="Intensity" muted />
        <Stat icon="bag-handle-outline" value={session.kilograms} label="KG" />
      </View>

      <Pressable style={styles.seeMore} accessibilityState={{ expanded }}>
        <Text style={styles.seeMoreText}>{expanded ? 'See Less' : 'See More'}</Text>
      </Pressable>

      {session.showComment && (
        <Pressable style={styles.commentButton}>
          <Text style={styles.commentButtonText}>Session Comment</Text>
        </Pressable>
      )}
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
  accent = false,
  muted = false,
}: {
  icon: IoniconName;
  value: string;
  label: string;
  accent?: boolean;
  muted?: boolean;
}) {
  const color = accent ? '#00e5a5' : muted ? '#747474' : '#d3d3d3';
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={58} color={color} />
      <Text style={[styles.statValue, muted && styles.mutedStat]}>{value}</Text>
      <Text style={[styles.statLabel, muted && styles.mutedStat]}>{label}</Text>
    </View>
  );
}

function ReadinessStat() {
  return (
    <View style={styles.stat}>
      <View style={styles.readinessIcon}>
        <Ionicons name="water-outline" size={57} color="#797979" />
        <View style={styles.readinessMarks}>
          <View style={styles.readinessMark} />
          <View style={styles.readinessMark} />
          <View style={styles.readinessMark} />
        </View>
      </View>
      <Text style={styles.statValue}>-</Text>
      <Text style={styles.statLabel}>Readiness</Text>
    </View>
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
  expandRow: {
    height: 63,
    paddingHorizontal: 20,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandLabel: {
    color: '#d0d0d0',
    fontSize: 17,
  },
  expandSwitch: {
    transform: [{ scaleX: 0.92 }, { scaleY: 0.92 }],
  },
  sessions: {
    flex: 1,
  },
  sessionsContent: {
    paddingBottom: 12,
  },
  sessionCard: {
    minHeight: 391,
    paddingTop: 21,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  statsRow: {
    height: 115,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stat: {
    width: '19.2%',
    alignItems: 'center',
  },
  statValue: {
    color: '#dedede',
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
  },
  statLabel: {
    color: '#d0d0d0',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  mutedStat: {
    color: '#777777',
  },
  readinessIcon: {
    width: 67,
    height: 58,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  readinessMarks: {
    position: 'absolute',
    right: 0,
    top: 6,
    gap: 7,
  },
  readinessMark: {
    width: 11,
    height: 6,
    backgroundColor: '#797979',
  },
  seeMore: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 3,
  },
  seeMoreText: {
    color: '#5a8ef6',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
  },
  commentButton: {
    height: 51,
    marginTop: 14,
    borderRadius: 5,
    backgroundColor: '#5b88ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
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
