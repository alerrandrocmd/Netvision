import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, Radius } from '../../src/constants/colors';

const SpeedCircle: React.FC<{ value: number; max: number; color: string; label: string; unit?: string }> =
  ({ value, max, color, label, unit = 'Mbps' }) => {
    const r = 46, circ = 2 * Math.PI * r;
    const pct = Math.min(value / max, 1);
    const offset = circ - pct * circ;
    return (
      <View style={styles.circleWrapper}>
        <Svg width={110} height={110}>
          <Circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
          <Circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 55 55)" />
        </Svg>
        <View style={styles.circleCenter}>
          <Text style={[styles.circleVal, { color }]}>{value.toFixed(0)}</Text>
          <Text style={styles.circleUnit}>{unit}</Text>
        </View>
        <Text style={styles.circleLabel}>{label}</Text>
      </View>
    );
  };

export default function SpeedScreen() {
  const [testing, setTesting] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'done'>('idle');
  const [result, setResult] = useState({ download: 0, upload: 0, ping: 0 });

  const runTest = () => {
    setTesting(true);
    setResult({ download: 0, upload: 0, ping: 0 });
    setPhase('ping');
    let t = 0;
    const interval = setInterval(() => {
      t += 0.15;
      if (t < 1.5) {
        setPhase('ping');
        setResult(p => ({ ...p, ping: Math.round(15 + Math.random() * 5) }));
      } else if (t < 4.5) {
        setPhase('download');
        setResult(p => ({ ...p, download: Math.min(245, (t - 1.5) * 82 + Math.random() * 10) }));
      } else if (t < 6.5) {
        setPhase('upload');
        setResult(p => ({ ...p, upload: Math.min(92, (t - 4.5) * 46 + Math.random() * 5) }));
      } else {
        clearInterval(interval);
        setTesting(false);
        setPhase('done');
      }
    }, 150);
  };

  const phases = ['ping', 'download', 'upload'] as const;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0E1E', '#0D1428']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.title}>Teste de Velocidade</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.meters}>
            <SpeedCircle value={result.download} max={500} color={Colors.green}  label="DOWNLOAD" />
            <SpeedCircle value={result.upload}   max={200} color={Colors.cyan}   label="UPLOAD"   />
            <SpeedCircle value={result.ping}     max={200} color={Colors.purple} label="PING" unit="ms" />
          </View>
          {(testing || phase === 'done') && (
            <View style={styles.phases}>
              {phases.map((p) => {
                const order = ['ping', 'download', 'upload'];
                const done = phase === 'done' || order.indexOf(phase) > order.indexOf(p);
                const active = phase === p;
                const c = done ? Colors.green : active ? Colors.cyan : 'rgba(255,255,255,0.2)';
                return (
                  <View key={p} style={styles.phaseItem}>
                    <View style={[styles.phaseDot, { backgroundColor: c }]} />
                    <Text style={[styles.phaseText, { color: c }]}>{p.toUpperCase()}</Text>
                  </View>
                );
              })}
            </View>
          )}
          <TouchableOpacity
            onPress={runTest}
            disabled={testing}
            style={[styles.testBtn, testing && { opacity: 0.5 }]}
          >
            <Text style={styles.testBtnText}>
              {testing ? '⟳  TESTANDO...' : '▶  INICIAR TESTE'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DETALHES</Text>
          {[
            ['Jitter',       '3 ms'],
            ['Packet Loss',  '0%'],
            ['Servidor',     'São Paulo, BR'],
            ['Protocolo',    'IPv4'],
          ].map(([k, v]) => (
            <View key={k} style={styles.detailRow}>
              <Text style={styles.detailKey}>{k}</Text>
              <Text style={styles.detailVal}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  content: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.glassBg, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.glassBorder, padding: 18, marginBottom: Spacing.md,
  },
  meters: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  circleWrapper: { alignItems: 'center' },
  circleCenter: { position: 'absolute', top: 28, alignItems: 'center' },
  circleVal: { fontSize: 18, fontWeight: '900', fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },
  circleUnit: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
  circleLabel: { fontSize: 10, color: Colors.textSecondary, letterSpacing: 1, marginTop: 4 },
  phases: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 16 },
  phaseItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phaseDot: { width: 7, height: 7, borderRadius: 4 },
  phaseText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  testBtn: {
    padding: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(96,239,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(96,239,255,0.25)',
  },
  testBtnText: { fontSize: 14, fontWeight: '700', color: Colors.cyan, letterSpacing: 2 },
  sectionLabel: { fontSize: 10, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '700', marginBottom: 12 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  detailKey: { fontSize: 12, color: Colors.textSecondary },
  detailVal: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
});
