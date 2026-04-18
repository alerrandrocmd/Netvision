import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../src/constants/colors';
import { MOCK_DEVICES } from '../../src/constants/mockData';
import { deviceTypeEmoji, rssiToColor, rssiToQuality } from '../../src/utils/networkUtils';
import { NetworkDevice } from '../../src/types/network.types';

export default function DevicesScreen() {
  const [scanning, setScanning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startScan = () => {
    setScanning(true);
    setDevices([]);
    scanAnim.setValue(0);
    Animated.timing(scanAnim, { toValue: 1, duration: 3000, useNativeDriver: false }).start();
    MOCK_DEVICES.forEach((device, i) => {
      setTimeout(() => {
        setDevices(prev => [...prev, device]);
        if (i === MOCK_DEVICES.length - 1) setScanning(false);
      }, (i + 1) * 200);
    });
  };

  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [scanning]);

  const DeviceCard: React.FC<{ device: NetworkDevice }> = ({ device }) => {
    const isExpanded = expanded === device.ip;
    const isSuspect = device.vendor === 'Desconhecido';
    const borderColor = device.isCurrentDevice
      ? Colors.greenBorder : isSuspect
      ? Colors.redBorder : Colors.glassBorder;

    return (
      <TouchableOpacity
        onPress={() => setExpanded(isExpanded ? null : device.ip)}
        activeOpacity={0.8}
        style={[styles.deviceCard, { borderColor }]}
      >
        <View style={styles.deviceRow}>
          <View style={[styles.deviceIcon, {
            backgroundColor: device.isCurrentDevice ? Colors.greenDim
              : isSuspect ? Colors.redDim : 'rgba(255,255,255,0.05)',
            borderColor: device.isCurrentDevice ? Colors.greenBorder
              : isSuspect ? Colors.redBorder : 'rgba(255,255,255,0.08)',
          }]}>
            <Text style={{ fontSize: 20 }}>{deviceTypeEmoji(device.deviceType)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <View style={styles.row}>
              <Text style={[styles.hostname, device.isCurrentDevice && { color: Colors.green }]}>
                {device.hostname}
              </Text>
              {device.isCurrentDevice && (
                <View style={styles.badgeGreen}><Text style={styles.badgeText}>VOCÊ</Text></View>
              )}
              {device.isNew && !device.isCurrentDevice && (
                <View style={styles.badgeRed}><Text style={styles.badgeText}>NOVO!</Text></View>
              )}
              {isSuspect && (
                <View style={styles.badgeRed}><Text style={styles.badgeText}>⚠ SUSPEITO</Text></View>
              )}
            </View>
            <Text style={styles.vendorText}>{device.vendor} · {device.ip}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.rssiText, { color: rssiToColor(device.rssi) }]}>
              {device.rssi} dBm
            </Text>
            <View style={styles.onlineRow}>
              <View style={[styles.dot, { backgroundColor: Colors.green }]} />
              <Text style={styles.onlineLabel}>Online</Text>
            </View>
          </View>
        </View>
        {isExpanded && (
          <View style={styles.expandedBox}>
            {[
              ['MAC', device.mac],
              ['Fabricante', device.vendor],
              ['IP', device.ip],
              ['Sinal', `${device.rssi} dBm (${rssiToQuality(device.rssi)}%)`],
              ['Status', device.isTrusted ? 'Confiável ✓' : 'Não verificado'],
            ].map(([k, v]) => (
              <View key={k} style={styles.detailRow}>
                <Text style={styles.detailKey}>{k}</Text>
                <Text style={styles.detailValue}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0E1E', '#0D1428']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dispositivos</Text>
          <Text style={styles.subtitle}>
            {devices.length > 0 ? `${devices.length} encontrados` : 'Aguardando scan'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={startScan}
          disabled={scanning}
          style={[styles.scanBtn, scanning && { opacity: 0.7 }]}
        >
          <Animated.View style={{ opacity: pulseAnim }}>
            <MaterialCommunityIcons name="radar" size={16} color={Colors.cyan} />
          </Animated.View>
          <Text style={styles.scanBtnText}>{scanning ? 'ESCANEANDO...' : 'ESCANEAR'}</Text>
        </TouchableOpacity>
      </View>
      {scanning && (
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, {
            width: scanAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
      )}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {devices.length === 0 && !scanning && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="radar" size={48} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyText}>Toque em ESCANEAR para{'\n'}descobrir dispositivos na rede</Text>
          </View>
        )}
        {devices.map(d => <DeviceCard key={d.ip} device={d} />)}
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
  title: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.cyanBorder, backgroundColor: Colors.cyanDim,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  scanBtnText: { fontSize: 12, color: Colors.cyan, fontWeight: '700' },
  progressBg: { height: 3, backgroundColor: 'rgba(96,239,255,0.1)' },
  progressFill: { height: '100%', backgroundColor: Colors.cyan },
  list: { padding: Spacing.lg },
  deviceCard: {
    backgroundColor: Colors.glassBg, borderRadius: Radius.xl,
    borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  deviceRow: { flexDirection: 'row', alignItems: 'center' },
  deviceIcon: {
    width: 46, height: 46, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  hostname: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  badgeGreen: {
    backgroundColor: Colors.greenDim, borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeRed: {
    backgroundColor: Colors.redDim, borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: Colors.textPrimary },
  vendorText: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  rssiText: { fontSize: 13, fontWeight: '700' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  onlineLabel: { fontSize: 10, color: Colors.textMuted },
  expandedBox: {
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailKey: { fontSize: 11, color: Colors.textSecondary },
  detailValue: { fontSize: 11, color: Colors.textPrimary, fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
