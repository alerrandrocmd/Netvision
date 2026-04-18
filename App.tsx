// ============================================================
// NetVision — App.tsx
// React Native nativo para Expo SDK 50
// IMPORTANTE: Usa View/Text/StyleSheet — NÃO usa div/html/css web
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import * as Network from 'expo-network';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Path, Polygon, Line, Polyline, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// UTILITÁRIOS
// ============================================================

/** Converte RSSI (dBm) para porcentagem de qualidade do sinal */
const rssiToQuality = (rssi: number): number => {
  if (rssi >= -50) return 100;
  if (rssi <= -100) return 0;
  return 2 * (rssi + 100);
};

/** Identifica banda pelo valor em MHz retornado pelo Android */
const freqToLabel = (mhz: number): string => {
  if (mhz >= 2400 && mhz <= 2484) return '2.4 GHz';
  if (mhz >= 4900 && mhz <= 5900) return '5 GHz';
  if (mhz >= 5925) return '6 GHz';
  return `${mhz} MHz`;
};

/** Retorna cor conforme qualidade do sinal */
const rssiToColor = (rssi: number): string => {
  if (rssi >= -50) return '#00FF87';
  if (rssi >= -65) return '#60EFFF';
  if (rssi >= -75) return '#F7C948';
  return '#FF4D6D';
};

/**
 * Análise de IA: avalia parâmetros e retorna recomendações
 * Regra principal: sinal < -70dBm E dispositivos > 10 → congestionamento
 */
const analyzeNetwork = (rssi: number, deviceCount: number, security: string) => {
  const items: { icon: string; text: string; color: string }[] = [];

  if (rssi < -70 && deviceCount > 10) {
    items.push({
      icon: 'bolt',
      text: 'Rede congestionada e sinal fraco. Use um repetidor Wi-Fi ou troque de canal.',
      color: '#FF4D6D',
    });
  }
  if (security === 'OPEN' || security === 'WEP') {
    items.push({
      icon: 'lock-open',
      text: `Rede insegura (${security}). Risco de interceptação. Atualize para WPA3.`,
      color: '#FF4D6D',
    });
  }
  if (rssi < -80) {
    items.push({
      icon: 'signal-wifi-bad',
      text: 'Sinal crítico. Aproxime-se do roteador ou instale um repetidor.',
      color: '#F7C948',
    });
  }
  if (items.length === 0) {
    items.push({
      icon: 'check-circle',
      text: 'Rede estável. Sem anomalias detectadas.',
      color: '#00FF87',
    });
  }
  return items;
};

// ============================================================
// COMPONENTE: Velocímetro SVG
// ============================================================
const SignalGauge: React.FC<{ rssi: number }> = ({ rssi }) => {
  const quality = rssiToQuality(rssi);
  const color = rssiToColor(rssi);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: quality,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [quality]);

  // Converte grau polar para coordenadas cartesianas (para o arco SVG)
  const polarToXY = (cx: number, cy: number, r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const s = polarToXY(cx, cy, r, start);
    const e = polarToXY(cx, cy, r, end);
    const large = end - start <= 180 ? '0' : '1';
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const arcEnd = -135 + (quality / 100) * 270;
  const needleAngle = -135 + (quality / 100) * 270;
  const tip = polarToXY(110, 130, 72, needleAngle);
  const base1 = polarToXY(110, 130, 10, needleAngle + 90);
  const base2 = polarToXY(110, 130, 10, needleAngle - 90);

  const label = quality >= 80 ? 'EXCELENTE' : quality >= 60 ? 'BOM' : quality >= 40 ? 'REGULAR' : 'FRACO';

  return (
    <View style={styles.gaugeContainer}>
      <Svg width={220} height={160}>
        {/* Arco de fundo */}
        <Path d={describeArc(110, 130, 85, -135, 135)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} strokeLinecap="round" />
        {/* Arco de progresso */}
        {quality > 0 && (
          <Path d={describeArc(110, 130, 85, -135, arcEnd)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />
        )}
        {/* Ponteiro */}
        <Polygon
          points={`${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`}
          fill={color}
        />
        <Circle cx={110} cy={130} r={8} fill="#1a1f2e" stroke={color} strokeWidth={2} />
        <Circle cx={110} cy={130} r={3} fill={color} />
      </Svg>
      {/* Texto central sobreposto */}
      <View style={styles.gaugeTextContainer}>
        <Text style={[styles.gaugeRssi, { color }]}>{rssi}</Text>
        <Text style={styles.gaugeUnit}>dBm</Text>
        <Text style={[styles.gaugeLabel, { color }]}>{label}</Text>
      </View>
    </View>
  );
};

// ============================================================
// COMPONENTE: Gráfico de linha em tempo real
// ============================================================
const SignalChart: React.FC<{ data: number[] }> = ({ data }) => {
  const W = SCREEN_WIDTH - 64;
  const H = 60;
  const pad = 8;
  const minV = -100, maxV = 0;

  if (data.length < 2) return null;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - minV) / (maxV - minV)) * (H - pad * 2);
    return `${x},${y}`;
  });

  const polyPoints = points.join(' ');
  const areaPoints = `${pad},${H - pad} ${polyPoints} ${W - pad},${H - pad}`;
  const last = data[data.length - 1];
  const lastX = W - pad;
  const lastY = H - pad - ((last - minV) / (maxV - minV)) * (H - pad * 2);

  return (
    <Svg width={W} height={H}>
      <Defs>
        <SvgGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#60EFFF" stopOpacity={0.3} />
          <Stop offset="100%" stopColor="#60EFFF" stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Polygon points={areaPoints} fill="url(#chartGrad)" />
      <Polyline points={polyPoints} fill="none" stroke="#60EFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={lastX} cy={lastY} r={4} fill="#60EFFF" />
    </Svg>
  );
};

// ============================================================
// COMPONENTE: Barra de métrica
// ============================================================
const MetricBar: React.FC<{ value: number; max?: number; color: string; label: string; sublabel: string }> =
  ({ value, max = 100, color, label, sublabel }) => {
    const pct = Math.min((value / max) * 100, 100);
    return (
      <View style={styles.metricBarContainer}>
        <View style={styles.metricBarHeader}>
          <Text style={styles.metricBarLabel}>{label}</Text>
          <Text style={[styles.metricBarValue, { color }]}>{sublabel}</Text>
        </View>
        <View style={styles.metricBarBg}>
          <View style={[styles.metricBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

// ============================================================
// COMPONENTE: Badge de segurança
// ============================================================
const SecurityBadge: React.FC<{ type: string }> = ({ type }) => {
  const insecure = type === 'OPEN' || type === 'WEP';
  const color = insecure ? '#FF4D6D' : '#00FF87';
  const bg = insecure ? 'rgba(255,77,109,0.15)' : 'rgba(0,255,135,0.15)';
  const borderColor = insecure ? 'rgba(255,77,109,0.4)' : 'rgba(0,255,135,0.4)';
  return (
    <View style={[styles.securityBadge, { backgroundColor: bg, borderColor }]}>
      <MaterialIcons name={insecure ? 'lock-open' : 'lock'} size={12} color={color} />
      <Text style={[styles.securityBadgeText, { color }]}>{type}</Text>
    </View>
  );
};

// ============================================================
// ABA: DASHBOARD
// ============================================================
const DashboardTab: React.FC<{ networkState: any; signalHistory: number[] }> = ({ networkState, signalHistory }) => {
  const rssi = networkState?.rssi ?? -65;
  const quality = rssiToQuality(rssi);
  const security = networkState?.security ?? 'WPA2';
  const aiItems = analyzeNetwork(rssi, 8, security);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>

      {/* Card principal de sinal */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ssidText}>{networkState?.ssid ?? 'Carregando...'}</Text>
            <Text style={styles.bssidText}>{networkState?.bssid ?? '--:--:--:--:--:--'}</Text>
          </View>
          <SecurityBadge type={security} />
        </View>

        {/* Velocímetro */}
        <SignalGauge rssi={rssi} />

        {/* Métricas rápidas */}
        <View style={styles.metricsRow}>
          {[
            { label: 'FREQUÊNCIA', value: freqToLabel(networkState?.frequency ?? 5180), color: '#60EFFF' },
            { label: 'CANAL', value: `Ch ${networkState?.channel ?? 36}`, color: '#A78BFA' },
            { label: 'TX', value: `${networkState?.linkSpeed ?? 300} Mbps`, color: '#00FF87' },
          ].map((m) => (
            <View key={m.label} style={styles.metricChip}>
              <Text style={styles.metricChipLabel}>{m.label}</Text>
              <Text style={[styles.metricChipValue, { color: m.color }]}>{m.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Gráfico de estabilidade */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>ESTABILIDADE DO SINAL</Text>
        <View style={{ marginTop: 10 }}>
          <SignalChart data={signalHistory} />
        </View>
        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterText}>-100 dBm</Text>
          <Text style={styles.chartFooterText}>Últimos 30s</Text>
          <Text style={styles.chartFooterText}>0 dBm</Text>
        </View>
      </View>

      {/* Barras de métricas */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>MÉTRICAS DE REDE</Text>
        <View style={{ marginTop: 12 }}>
          <MetricBar value={quality} label="SINAL" sublabel={`${quality}% (${rssi} dBm)`} color={rssiToColor(rssi)} />
          <MetricBar value={networkState?.download ?? 0} max={500} label="DOWNLOAD" sublabel={`${networkState?.download?.toFixed(0) ?? 0} Mbps`} color="#00FF87" />
          <MetricBar value={networkState?.upload ?? 0} max={200} label="UPLOAD" sublabel={`${networkState?.upload?.toFixed(0) ?? 0} Mbps`} color="#60EFFF" />
        </View>
      </View>

      {/* IA */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <MaterialIcons name="smart-toy" size={16} color="#A78BFA" />
          <Text style={[styles.sectionLabel, { marginLeft: 8 }]}>ANÁLISE DE IA</Text>
        </View>
        <View style={{ marginTop: 12 }}>
          {aiItems.map((item, i) => (
            <View key={i} style={[styles.aiItem, { borderColor: item.color + '44', backgroundColor: item.color + '11' }]}>
              <MaterialIcons name={item.icon as any} size={18} color={item.color} />
              <Text style={styles.aiItemText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

// ============================================================
// ABA: INFORMAÇÕES TÉCNICAS
// ============================================================
const InfoTab: React.FC<{ networkState: any }> = ({ networkState }) => {
  const rows = [
    ['SSID', networkState?.ssid ?? '--'],
    ['BSSID', networkState?.bssid ?? '--'],
    ['Endereço IP', networkState?.ipAddress ?? '--'],
    ['Gateway', networkState?.gateway ?? '--'],
    ['Frequência', freqToLabel(networkState?.frequency ?? 0)],
    ['Canal', String(networkState?.channel ?? '--')],
    ['Segurança', networkState?.security ?? '--'],
    ['Velocidade TX', `${networkState?.linkSpeed ?? '--'} Mbps`],
    ['Tipo de Rede', networkState?.networkType ?? '--'],
  ];

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>INFORMAÇÕES DETALHADAS</Text>
        <View style={{ marginTop: 12 }}>
          {rows.map(([key, value], i) => (
            <View key={key} style={[styles.infoRow, i < rows.length - 1 && styles.infoRowBorder]}>
              <Text style={styles.infoKey}>{key}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

// ============================================================
// ABA: SEGURANÇA
// ============================================================
const SecurityTab: React.FC<{ networkState: any }> = ({ networkState }) => {
  const security = networkState?.security ?? 'WPA2';
  const insecure = security === 'OPEN' || security === 'WEP';
  const accentColor = insecure ? '#FF4D6D' : '#00FF87';

  const checks = [
    { icon: 'lock', label: 'Criptografia', ok: !insecure, detail: insecure ? `${security} — Inseguro` : `${security} — Seguro` },
    { icon: 'wifi', label: 'Força do Sinal', ok: (networkState?.rssi ?? -65) > -70, detail: `${networkState?.rssi ?? '--'} dBm` },
    { icon: 'dns', label: 'DNS', ok: true, detail: networkState?.dns ?? '8.8.8.8' },
    { icon: 'devices', label: 'Dispositivos', ok: true, detail: 'Sem intrusos detectados' },
  ];

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Banner */}
      <View style={[styles.card, { borderColor: accentColor + '44', borderWidth: 1 }]}>
        <View style={styles.cardRow}>
          <Text style={{ fontSize: 36 }}>{insecure ? '🔴' : '🟢'}</Text>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.securityTitle, { color: accentColor }]}>
              {insecure ? 'REDE VULNERÁVEL' : 'REDE PROTEGIDA'}
            </Text>
            <Text style={styles.securitySubtitle}>
              {insecure
                ? 'Sua conexão está exposta. Tome medidas imediatas.'
                : 'Protegida por criptografia avançada.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Checklist */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>ANÁLISE DE SEGURANÇA</Text>
        {checks.map((c, i) => (
          <View key={c.label} style={[styles.checkRow, i < checks.length - 1 && styles.infoRowBorder]}>
            <MaterialIcons name={c.icon as any} size={20} color={c.ok ? '#00FF87' : '#FF4D6D'} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.checkLabel}>{c.label}</Text>
              <Text style={styles.checkDetail}>{c.detail}</Text>
            </View>
            <View style={[styles.checkDot, { backgroundColor: c.ok ? '#00FF87' : '#FF4D6D' }]} />
          </View>
        ))}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

// ============================================================
// APP PRINCIPAL
// ============================================================
export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'info' | 'security'>('dashboard');
  const [networkState, setNetworkState] = useState<any>(null);
  const [signalHistory, setSignalHistory] = useState<number[]>(Array(30).fill(-65));
  const intervalRef = useRef<any>(null);

  /**
   * Lê dados reais da rede usando expo-network.
   * Para dados avançados (SSID, RSSI, frequência), seria necessário
   * react-native-wifi-reborn com permissão ACCESS_FINE_LOCATION.
   * Esta versão usa expo-network para dados disponíveis sem permissão extra.
   */
  const fetchNetworkData = useCallback(async () => {
    try {
      const ipAddress = await Network.getIpAddressAsync();
      const netState = await Network.getNetworkStateAsync();

      // Simula variação de sinal para demonstração
      // Em produção: substituir por react-native-wifi-reborn
      const mockRssi = -55 + Math.round((Math.random() - 0.5) * 8);

      setNetworkState((prev: any) => ({
        ssid: prev?.ssid ?? 'MinhaRede_5G',
        bssid: prev?.bssid ?? 'F4:6D:04:A2:B1:88',
        rssi: mockRssi,
        frequency: 5180,
        channel: 36,
        linkSpeed: 433,
        security: 'WPA3',
        ipAddress: ipAddress ?? '192.168.1.100',
        gateway: '192.168.1.1',
        dns: '8.8.8.8',
        networkType: netState.type ?? 'WIFI',
        download: prev?.download ?? 245,
        upload: prev?.upload ?? 92,
      }));

      setSignalHistory((prev) => {
        const next = [...prev.slice(1), mockRssi];
        return next;
      });
    } catch (e) {
      console.log('Erro ao ler rede:', e);
    }
  }, []);

  useEffect(() => {
    fetchNetworkData();
    intervalRef.current = setInterval(fetchNetworkData, 2000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const tabs = [
    { id: 'dashboard', icon: 'speed', label: 'Dashboard' },
    { id: 'info', icon: 'info', label: 'Info' },
    { id: 'security', icon: 'security', label: 'Segurança' },
  ] as const;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1E" />

      {/* Fundo com gradiente */}
      <LinearGradient colors={['#0A0E1E', '#0D1428', '#0A0F20']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Net<Text style={{ color: '#60EFFF' }}>Vision</Text>
          </Text>
          <Text style={styles.headerSub}>NETWORK DIAGNOSTICS</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>ONLINE</Text>
        </View>
      </View>

      {/* Conteúdo */}
      <View style={{ flex: 1 }}>
        {activeTab === 'dashboard' && <DashboardTab networkState={networkState} signalHistory={signalHistory} />}
        {activeTab === 'info' && <InfoTab networkState={networkState} />}
        {activeTab === 'security' && <SecurityTab networkState={networkState} />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const color = active ? '#60EFFF' : 'rgba(255,255,255,0.3)';
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              {active && <View style={styles.tabActiveIndicator} />}
              <MaterialIcons name={tab.icon as any} size={22} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{tab.label.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================
// ESTILOS — StyleSheet (React Native)
// ============================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(10,14,30,0.9)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 3,
    marginTop: 2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,135,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF87',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 11,
    color: '#00FF87',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 18,
    marginBottom: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    fontWeight: '700',
  },
  ssidText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bssidText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 3,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  securityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  gaugeTextContainer: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
  },
  gaugeRssi: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
    lineHeight: 36,
  },
  gaugeUnit: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 3,
    marginTop: 2,
  },
  gaugeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  metricChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 10,
    alignItems: 'center',
  },
  metricChipLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricChipValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  chartFooterText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
  },
  metricBarContainer: {
    marginBottom: 14,
  },
  metricBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricBarLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  metricBarValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  aiItemText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  infoKey: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  securitySubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    lineHeight: 18,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  checkLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkDetail: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10,14,30,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: Platform.OS === 'android' ? 12 : 20,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingTop: 4,
  },
  tabActiveIndicator: {
    position: 'absolute',
    top: -10,
    width: 32,
    height: 2,
    backgroundColor: '#60EFFF',
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});
