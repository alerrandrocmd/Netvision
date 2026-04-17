import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import * as Network from 'expo-network';
import * as Device from 'expo-device';
import { Activity, Globe, Cpu, ShieldAlert, Wifi, Terminal } from 'lucide-react-native';

export default function App() {
  const [netInfo, setNetInfo] = useState({ ip: '0.0.0.0', type: 'Checking...' });
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const getNetworkData = async () => {
      const ip = await Network.getIpAddressAsync();
      const state = await Network.getNetworkStateAsync();
      setNetInfo({ ip, type: state.type });
    };
    getNetworkData();
    
    const timer = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Terminal color="#00FF9C" size={18} />
        <Text style={styles.systemStatus}>CORE SYSTEM ACTIVE</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.mainTitle}>NETVISION <Text style={styles.proBadge}>ADVANCED</Text></Text>
          <Text style={styles.subTitle}>Full Stack Network Analytics | By Alerrandro</Text>
        </View>

        {/* MONITOR DE TRANSMISSÃO EM TEMPO REAL */}
        <View style={styles.monitorCard}>
          <View style={styles.cardHeader}>
            <Activity color="#00FF9C" size={20} />
            <Text style={styles.cardTitle}>DATA TRAFFIC ANALYSIS</Text>
          </View>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.label}>UPLOAD RATE</Text>
              <Text style={styles.value}>4.2 MB/s</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.label}>DOWNLOAD RATE</Text>
              <Text style={styles.value}>128.7 MB/s</Text>
            </View>
          </View>
        </View>

        {/* GRID DE MÉTRICAS DE BAIXO NÍVEL */}
        <View style={styles.grid}>
          <View style={styles.dataNode}>
            <Globe color="#00FF9C" size={20} />
            <Text style={styles.nodeLabel}>IPV4 ADDRESS</Text>
            <Text style={styles.nodeValue}>{netInfo.ip}</Text>
          </View>
          <View style={styles.dataNode}>
            <Cpu color="#00FF9C" size={20} />
            <Text style={styles.nodeLabel}>CPU LATENCY</Text>
            <Text style={styles.nodeValue}>0.8ms</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.dataNode}>
            <ShieldAlert color="#00FF9C" size={20} />
            <Text style={styles.nodeLabel}>ENCRYPTION</Text>
            <Text style={styles.nodeValue}>AES-256</Text>
          </View>
          <View style={styles.dataNode}>
            <Wifi color="#00FF9C" size={20} />
            <Text style={styles.nodeLabel}>WIFI BAND</Text>
            <Text style={styles.nodeValue}>5.0 GHz</Text>
          </View>
        </View>

        {/* TERMINAL LOG */}
        <View style={styles.terminalBox}>
          <Text style={styles.terminalText}>{`> INITIALIZING DIAGNOSTIC...`}</Text>
          <Text style={styles.terminalText}>{`> HANDSHAKE ESTABLISHED WITH GATEWAY`}</Text>
          <Text style={styles.terminalText}>{`> DEVICE: ${Device.modelName}`}</Text>
          <Text style={styles.terminalText}>{`> UPTIME: ${uptime}s`}</Text>
          <Text style={styles.terminalText}>{`> PACKET LOSS: 0.001%`}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.scanButton}>
        <Text style={styles.scanButtonText}>EXECUTE FULL SCAN</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  systemStatus: { color: '#00FF9C', fontSize: 10, marginLeft: 8, fontWeight: 'bold', letterSpacing: 2 },
  header: { marginBottom: 30 },
  mainTitle: { color: '#F8FAFC', fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  proBadge: { color: '#00FF9C', fontSize: 12 },
  subTitle: { color: '#64748B', fontSize: 13, marginTop: 4 },
  monitorCard: { backgroundColor: '#0F172A', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginLeft: 10, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  label: { color: '#64748B', fontSize: 10, marginBottom: 5 },
  value: { color: '#F8FAFC', fontSize: 22, fontWeight: '700' },
  divider: { width: 1, height: 40, backgroundColor: '#1E293B' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  dataNode: { backgroundColor: '#0F172A', width: '48%', borderRadius: 12, padding: 15, borderLeftWidth: 3, borderLeftColor: '#00FF9C' },
  nodeLabel: { color: '#64748B', fontSize: 10, marginTop: 10 },
  nodeValue: { color: '#CBD5E1', fontSize: 15, fontWeight: '600', marginTop: 2 },
  terminalBox: { backgroundColor: '#000', padding: 15, borderRadius: 8, marginTop: 10, minHeight: 120 },
  terminalText: { color: '#00FF9C', fontFamily: 'monospace', fontSize: 11, marginBottom: 4 },
  scanButton: { backgroundColor: '#00FF9C', padding: 18, borderRadius: 12, alignItems: 'center', marginVertical: 20 },
  scanButtonText: { color: '#020617', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
});
