import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { METRICS } from '@hybrid/strength-engine';

/**
 * The placeholder screen. Phase C (Slices 18-25) replaces this with the real
 * logger: session state machine, block list, set logging, timers, offline
 * writes.
 *
 * Like the web bench, it reads METRICS from the engine rather than printing a
 * static string — the cheapest proof that the workspace link is real.
 */
export function App() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Text style={styles.title}>Strength logger</Text>
      <Text style={styles.sub}>Phase C builds here.</Text>
      <Text style={styles.meta}>{Object.keys(METRICS).length} metrics in the registry</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070706', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#e0bc87', fontSize: 24, marginBottom: 8 },
  sub: { color: '#aaa49a', fontSize: 15, marginBottom: 24 },
  meta: { color: '#847d73', fontSize: 13 },
});
