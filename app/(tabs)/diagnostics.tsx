import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../../src/constants/colors';
import { MOCK_NEARBY, MOCK_WIFI } from '../../src/constants/mockData';
import { freqToLabel, rssiToColor, rssiToQuality } from '../../src/utils/networkUtils';
import { recommendBestChannel } from '../../src/services/AIAdvisor';

export default function DiagnosticsScreen() {
  const bestChannel = recommendBestChannel(MOCK_NEARBY);

  const InfoRow = ({ label, value, color = Colors.textPrimary }: { label: string; value: string; color?: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoKey}>{label}</Text>
      <Text style={[styles.infoVal, { color }]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0E1E', '#0D1428']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.title}>Diagnóstico Wi-Fi</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>INFORMAÇÕES DA REDE</Text>
          <View style={{ marginTop: Spacing.md }}>
            <InfoRow label="SSID"         value={MOCK_WIFI.ssid}                      color={Colors.cyan}   />
            <InfoRow label="BSSID"        value={MOCK_WIFI.bssid}                                           />
            <InfoRow label="Endereço IP"  value={MOCK_WIFI.ipAddress}                 color={Colors.green}  />
            <InfoRow label="Gateway"      value={MOCK_WIFI.gateway}                                         />
            <InfoRow label="DNS Primário" value={MOCK_WIFI.dns1}                                            />
            <InfoRow label="DNS Secundário" value={MOCK_WIFI.dns2}                                          />
            <InfoRow label="Frequência"   value={freqToLabel(MOCK_WIFI.frequency)}    color={Colors.purple} />
            <InfoRow label="Canal"        value={`${MOCK_WIFI.channel}`}              color={Colors.purple} />
            <InfoRow label="Velocidade TX" value={`${MOCK_WIFI.linkSpeed} Mbps`}      color={Colors.green}  />
            <InfoRow label="Segurança"    value={MOCK_WIFI.securityType}              color={Colors.green}  />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>REDES DETECTADAS</Text>
            <View style={styles.channelBadge}>
              <Text style={styles.channelLabel}>CANAL IDEAL</Text>
              <Text style={styles.channelValue}>Ch {bestChannel}</Text>
            </View>
          </View>
          <View style={{ marginTop: Spacing.md }}>
            {MOCK_NEARBY.map((net, i) => {
              const q = rssiToQuality(net.rssi);
              const c = rssiToColor(net.rssi);
              return (
                <View key={i} style={[styles.netCard, net.isCurrentNetwork && styles.netCardActive]}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.row, { gap: 6 }]}>
                        <Text style={[styles.netSsid, net.isCurrentNetwork && { color: Colors.green }]}>
                          {net.ssid}
                        </Text>
                        {net.isCurrentNetwork && (
                          <View style={styles.connBadge}>
                            <Text style={styles.connText}>CONECTADO</Text>
                          </View>
                        )}
                        {net.securityType === 'OPEN' && (
                          <View style={styles.openBadge}>
                            <Text style={styles.openText}>ABERTA</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.netMeta}>
                        Ch {net.channel} · {freqToLabel(net.frequency)} · {net.securityType}
                      </Text>
                    </View>
                    <Text style={[styles.netRssi, { color: c }]}>{net.rssi} dBm</Text>
                  </View>
                  <View style={styles.signalBar}>
                    <View style={[styles.signalFill, { width: `${q}%`, backgroundColor: c }]} />
                  </View>
                </View>
              );
            })}
          </View>
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
  sectionLabel: { fontSize: 10, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  infoKey: { fontSize: 12, color: Colors.textSecondary },
  infoVal: { fontSize: 12, fontWeight: '600', fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },
  channelBadge: { alignItems: 'flex-end' },
  channelLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  channelValue: { fontSize: 20, fontWeight: '900', color: Colors.green },
  netCard: {
    backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  netCardActive: {
    backgroundColor: 'rgba(0,255,135,0.05)',
    borderColor: 'rgba(0,255,135,0.2)',
  },
  netSsid: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  netMeta: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },
  netRssi: { fontSize: 12, fontWeight: '700' },
  connBadge: {
    backgroundColor: Colors.greenDim, borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  connText: { fontSize: 9, color: Colors.green, fontWeight: '700' },
  openBadge: {
    backgroundColor: Colors.redDim, borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  openText: { fontSize: 9, color: Colors.red, fontWeight: '700' },
  signalBar: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2, marginTop: 8, overflow: 'hidden',
  },
  signalFill: { height: '100%', borderRadius: 2 },
});
