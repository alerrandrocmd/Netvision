import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Platform, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop, Polyline, Polygon as SvgPolygon } from 'react-native-svg';
import { Colors, Spacing, Radius } from '../../src/constants/colors';
import { MOCK_DEVICES, MOCK_NEARBY, MOCK_WIFI } from '../../src/constants/mockData';
import { analyzeNetwork } from '../../src/services/AIAdvisor';
import { rssiToColor, rssiToLabel, rssiToQuality, freqToLabel, isInsecureSecurity } from '../../src/utils/networkUtils';
import { WifiData, AIRecommendation } from '../../src/types/network.types';

const { width: SW } = Dimensions.get('window');

const SignalGauge: React.FC<{ rssi: number }> = ({ rssi }) => {
  const quality = rssiToQuality(rssi);
  const color = rssiToColor(rssi);
  const label = rssiToLabel(rssi);

  const polar = (cx: number, cy: number, r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arc = (cx: number, cy: number, r: number, s: number, e: number) => {
    const sp = polar(cx, cy, r, s);
    const ep = polar(cx, cy, r, e);
    const large = e - s > 180 ? '1' : '0';
    return `M ${sp.x} ${sp.y} A ${r} ${r} 0 ${large} 1 ${ep.x} ${ep.y}`;
  };

  const needleAngle = -135 + (quality / 100) * 270;
  const tip = polar(110, 128, 68, needleAngle);
  const b1 = polar(110, 128, 10, needleAngle + 90);
  const b2 = polar(110, 128, 10, needleAngle - 90);
  const arcEnd = quality > 0 ? -135 + (quality / 100) * 270 : -135;

  return (
    <View style={styles.gaugeWrapper}>
      <Svg width={220} height={155}>
        <Path d={arc(110, 128, 82, -135, 135)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} strokeLinecap="round" />
        {quality > 0 && (
          <Path d={arc(110, 128, 82, -135, arcEnd)} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" />
        )}
        <SvgPolygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill={color} />
        <Circle cx={110} cy={128} r={9} fill="#1a1f2e" stroke={color} strokeWidth={2} />
        <Circle cx={110} cy={128} r={3} fill={color} />
      </Svg>
      <View style={styles.gaugeCenterText}>
        <Text style={[styles.gaugeRssi, { color }]}>{rssi}</Text>
        <Text style={styles.gaugeUnit}>dBm</Text>
        <Text style={[styles.gaugeLabel, { color }]}>{label}</Text>
      </View>
    </View>
  );
};

const SignalChart: React.FC<{ data: number[] }> = ({ data }) => {
  const W = SW - 64, H = 56, pad = 6;
  if (data.length < 2) return null;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - -100) / 100) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const area = `${pad},${H - pad} ${pts} ${W - pad},${H - pad}`;
  const last = data[data.length - 1];
  const lx = W - pad;
  const ly = H - pad - ((last - -100) / 100) * (H - pad * 2);
  return (
    <Svg width={W} height={H}>
      <Defs>
        <SvgGrad id="cg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#60EFFF" stopOpacity={0.25} />
          <Stop offset="100%" stopColor="#60EFFF" stopOpacity={0} />
        </SvgGrad>
      </Defs>
      <SvgPolygon points={area} fill="url(#cg)" />
      <Polyline points={pts} fill="none" stroke="#60EFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={lx} cy={ly} r={4} fill="#60EFFF" />
    </Svg>
  );
};

const MetricBar: React.FC<{ value: number; max?: number; color: string; label: string; sublabel: string }> =
  ({ value, max = 100, color, label, sublabel }) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(anim, { toValue: Math.min(value / max, 1), duration: 800, useNativeDriver: false }).start();
    }, [value]);
    return (
      <View style={styles.barContainer}>
        <View style={styles.barHeader}>
          <Text style={styles.barLabel}>{label}</Text>
          <Text style={[styles.barValue, { color }]}>{sublabel}</Text>
        </View>
        <View style={styles.barBg}>
          <Animated.View style={[styles.barFill, { backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      </View>
    );
  };

const AICard: React.FC<{ rec: AIRecommendation }> = ({ rec }) => {
  const colors: Record<string, string> = { critical: Colors.red, warning: Colors.yellow, info: Colors.cyan, ok: Colors.green };
  const c = colors[rec.severity];
  return (
    <View style={[styles.aiCard, { borderColor: c + '44', backgroundColor: c + '11' }]}>
      <MaterialCommunityIcons name={rec.icon as any} size={20} color={c} />
      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
        <Text style={[styles.aiTitle, { color: c }]}>{rec.title}</Text>
        <Text style={styles.aiDesc}>{rec.description}</Text>
        {rec.action && <Text style={[styles.aiAction, { color: c }]}>→ {rec.action}</Text>}
      </View>
    </View>
  );
};

const SecurityBadge: React.FC<{ type: string }> = ({ type }) => {
  const insecure = type === 'OPEN' || type === 'WEP';
  const color = insecure ? Colors.red : Colors.green;
  return (
    <View style={[styles.secBadge, { borderColor: color + '55', backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={insecure ? 'lock-open' : 'lock'} size={11} color={color} />
      <Text style={[styles.secBadgeText, { color }]}>{type}</Text>
    </View>
  );
};

export default function DashboardScreen() {
  const [wifi, setWifi] = useState<WifiData>(MOCK_WIFI);
  const [history, setHistory] = useState<number[]>(Array(30).fill(-58));
  const [speed] = useState({ download: 245, upload: 92, ping: 18 });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      const newRssi = Math.round(Math.max(-90, Math.min(-40, wifi.rssi + (Math.random() - 0.5) * 5)));
      setWifi(prev => ({ ...prev, rssi: newRssi, signalQuality: rssiToQuality(newRssi) }));
      setHistory(prev => [...prev.slice(1), newRssi]);
    }, 2000);
    return () => clearInterval(interval);
  }, [wifi.rssi]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const unknownDevices = MOCK_DEVICES.filter(d => d.vendor === 'Desconhecido').length;
  const aiRecs = analyzeNetwork({
    rssi: wifi.rssi,
    deviceCount: MOCK_DEVICES.length,
    securityType: wifi.securityType,
    nearbyNetworks: MOCK_NEARBY,
    unknownDevices,
  });

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0E1E', '#0D1428', '#0A0F20']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Net<Text style={{ color: Colors.cyan }}>Vision</Text></Text>
          <Text style={styles.appSub}>NETWORK DIAGNOSTICS</Text>
        </View>
        <View style={styles.onlineBadge}>
          <Animated.View style={[styles.onlineDot, { opacity: pulseAnim }]} />
          <Text style={styles.onlineText}>ONLINE</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ssid}>{wifi.ssid}</Text>
              <Text style={styles.bssid}>{wifi.bssid}</Text>
            </View>
            <SecurityBadge type={wifi.securityType} />
          </View>
          <SignalGauge rssi={wifi.rssi} />
          <View style={styles.chipsRow}>
            {[
              { label: 'FREQUÊNCIA', value: freqToLabel(wifi.frequency), color: Colors.cyan },
              { label: 'CANAL', value: `Ch ${wifi.channel}`, color: Colors.purple },
              { label: 'TX', value: `${wifi.linkSpeed} Mbps`, color: Colors.green },
            ].map(c => (
              <View key={c.label} style={styles.chip}>
                <Text style={styles.chipLabel}>{c.label}</Text>
                <Text style={[styles.chipValue, { color: c.color }]}>{c.value}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ESTABILIDADE DO SINAL</Text>
          <View style={{ marginTop: Spacing.sm }}>
            <SignalChart data={history} />
          </View>
          <View style={styles.row}>
            <Text style={styles.chartEdge}>-100 dBm</Text>
            <Text style={styles.chartEdge}>Últimos 60s</Text>
            <Text style={styles.chartEdge}>0 dBm</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>MÉTRICAS</Text>
          <View style={{ marginTop: Spacing.md }}>
            <MetricBar value={wifi.signalQuality} label="SINAL" sublabel={`${wifi.signalQuality}% (${wifi.rssi} dBm)`} color={rssiToColor(wifi.rssi)} />
            <MetricBar value={speed.download} max={500} label="DOWNLOAD" sublabel={`${speed.download} Mbps`} color={Colors.green} />
            <MetricBar value={speed.upload} max={200} label="UPLOAD" sublabel={`${speed.upload} Mbps`} color={Colors.cyan} />
            <MetricBar value={Math.max(0, 100 - speed.ping)} label="LATÊNCIA" sublabel={`${speed.ping} ms`} color={Colors.purple} />
          </View>
        </View>
        <View style={styles.card}>
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <MaterialCommunityIcons name="robot" size={16} color={Colors.purple} />
            <Text style={[styles.sectionLabel, { marginLeft: Spacing.xs }]}>ANÁLISE DE IA</Text>
          </View>
          {aiRecs.map(rec => <AICard key={rec.id} rec={rec} />)}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  appTitle: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1 },
  appSub: { fontSize: 10, color: Colors.textMuted, letterSpacing: 3, marginTop: 2 },
  onlineBadge: {
    flexDirection: 'row', alignItems: 'center', borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.greenBorder, backgroundColor: Colors.greenDim,
    paddingHorizontal: Spacing.md, paddingVertical: 5,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green, marginRight: 6 },
  onlineText: { fontSize: 11, color: Colors.green, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  card: {
    backgroundColor: Colors.glassBg, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.glassBorder,
    padding: 18, marginBottom: Spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ssid: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  bssid: { fontSize: 11, color: Colors.textSecondary, marginTop: 3, fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },
  secBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  secBadgeText: { fontSize: 11, fontWeight: '700', marginLeft: 3 },
  gaugeWrapper: { alignItems: 'center', justifyContent: 'center', position: 'relative', marginVertical: 4 },
  gaugeCenterText: { position: 'absolute', bottom: 8, alignItems: 'center' },
  gaugeRssi: { fontSize: 30, fontWeight: '900', fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier', lineHeight: 34 },
  gaugeUnit: { fontSize: 10, color: Colors.textMuted, letterSpacing: 3, marginTop: 2 },
  gaugeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 3 },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  chip: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 10, alignItems: 'center',
  },
  chipLabel: { fontSize: 9, color: Colors.textLabel, letterSpacing: 1, marginBottom: 4 },
  chipValue: { fontSize: 12, fontWeight: '700' },
  sectionLabel: { fontSize: 10, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '700' },
  chartEdge: { fontSize: 9, color: Colors.textMuted },
  barContainer: { marginBottom: Spacing.md },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { fontSize: 11, color: Colors.textSecondary, letterSpacing: 1 },
  barValue: { fontSize: 11, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  aiCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  aiTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  aiDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 17 },
  aiAction: { fontSize: 11, marginTop: 5, fontWeight: '600' },
});
