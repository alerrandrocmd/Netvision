import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../src/constants/colors';
import { MOCK_DEVICES, MOCK_WIFI } from '../../src/constants/mockData';
import { isInsecureSecurity } from '../../src/utils/networkUtils';

export default function SecurityScreen() {
  const insecure = isInsecureSecurity(MOCK_WIFI.securityType);
  const accentColor = insecure ? Colors.red : Colors.green;
  const unknownDevices = MOCK_DEVICES.filter(d => d.vendor === 'Desconhecido');

  const checks = [
    {
      icon: 'lock',
      label: 'Criptografia',
      ok: !insecure,
      detail: insecure
        ? `${MOCK_WIFI.securityType} — Protocolo vulnerável`
        : `${MOCK_WIFI.securityType} — Seguro`,
    },
    {
      icon: 'wifi-strength-3',
      label: 'Força do Sinal',
      ok: MOCK_WIFI.rssi > -70,
      detail: `${MOCK_WIFI.rssi} dBm — ${MOCK_WIFI.rssi > -70 ? 'Adequado' : 'Fraco'}`,
    },
    {
      icon: 'dns',
      label: 'Servidor DNS',
      ok: true,
      detail: `${MOCK_WIFI.dns1} — Sem vazamentos`,
    },
    {
      icon: 'devices',
      label: 'Dispositivos Suspeitos',
      ok: unknownDevices.length === 0,
      detail: unknownDevices.length === 0
        ? 'Nenhum intruso detectado'
        : `${unknownDevices.length} MAC(s) desconhecido(s)`,
    },
    {
      icon: 'router-network',
      label: 'Redes Abertas Próximas',
      ok: false,
      detail: '1 rede sem senha detectada nas proximidades',
    },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0E1E', '#0D1428']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.title}>Segurança</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={[styles.banner, { borderColor: accentColor + '44' }]}>
          <LinearGradient
            colors={[accentColor + '12', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <Text style={{ fontSize: 40 }}>{insecure ? '🔴' : '🟢'}</Text>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.bannerTitle, { color: accentColor }]}>
              {insecure ? 'REDE VULNERÁVEL' : 'REDE PROTEGIDA'}
            </Text>
            <Text style={styles.bannerSub}>
              {insecure
                ? 'Dados expostos a interceptação. Ação imediata recomendada.'
                : 'Criptografia avançada ativa. Conexão segura.'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ANÁLISE DE SEGURANÇA</Text>
          {checks.map((c, i) => (
            <View key={c.label} style={[styles.checkRow, i < checks.length - 1 && styles.borderBottom]}>
              <MaterialCommunityIcons name={c.icon as any} size={22} color={c.ok ? Colors.green : Colors.red} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.checkLabel}>{c.label}</Text>
                <Text style={styles.checkDetail}>{c.detail}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: c.ok ? Colors.green : Colors.red }]} />
            </View>
          ))}
        </View>

        {unknownDevices.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>⚠ DISPOSITIVOS SUSPEITOS</Text>
            {unknownDevices.map(d => (
              <View key={d.mac} style={styles.suspectRow}>
                <View>
                  <Text style={styles.suspectName}>{d.hostname}</Text>
                  <Text style={styles.suspectMac}>{d.mac}</Text>
                </View>
                <Text style={styles.suspectIp}>{d.ip}</Text>
              </View>
            ))}
            <Text style={styles.tipText}>
              💡 Acesse as configurações do roteador e bloqueie estes MACs.
            </Text>
          </View>
        )}

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
  banner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.xl, borderWidth: 1,
    padding: 18, marginBottom: Spacing.md, overflow: 'hidden',
  },
  bannerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  bannerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  card: {
    backgroundColor: Colors.glassBg, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.glassBorder, padding: 18, marginBottom: Spacing.md,
  },
  sectionLabel: { fontSize: 10, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '700', marginBottom: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  checkLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  checkDetail: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  suspectRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  suspectName: { fontSize: 13, fontWeight: '600', color: Colors.red },
  suspectMac: { fontSize: 10, color: Colors.textSecondary, fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier', marginTop: 2 },
  suspectIp: { fontSize: 12, color: Colors.textSecondary },
  tipText: { fontSize: 12, color: Colors.textSecondary, marginTop: 12, lineHeight: 18 },
});
