import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Wifi, Shield, Zap, Info, Activity } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function App() {
  const [signal, setSignal] = useState(-65);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* CABEÇALHO COM SEU NOME */}
        <View style={styles.header}>
          <Text style={styles.brandName}>NETVISION</Text>
          <Text style={styles.userName}>By Alerrandro</Text>
        </View>

        {/* CARD DE STATUS ESTILO GTI */}
        <View style={styles.mainCard}>
          <Wifi color="#60efff" size={48} strokeWidth={1.5} />
          <Text style={styles.signalText}>{signal} dBm</Text>
          <Text style={styles.statusLabel}>CONEXÃO ESTÁVEL</Text>
          
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '75%' }]} />
          </View>
        </View>

        {/* INFO GRID */}
        <View style={styles.grid}>
          <View style={styles.smallCard}>
            <Zap color="#60efff" size={20} />
            <Text style={styles.cardLabel}>LATÊNCIA</Text>
            <Text style={styles.cardValue}>12ms</Text>
          </View>
          <View style={styles.smallCard}>
            <Shield color="#60efff" size={20} />
            <Text style={styles.cardLabel}>SEGURANÇA</Text>
            <Text style={styles.cardValue}>WPA3</Text>
          </View>
        </View>

      </ScrollView>

      {/* MENU INFERIOR */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}><Activity color="#60efff" size={24} /></TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}><Wifi color="#fff" size={24} /></TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}><Info color="#fff" size={24} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1e',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  brandName: {
    color: '#60efff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  mainCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  signalText: {
    color: '#fff',
    fontSize: 42,
    fontWeight: 'bold',
    marginTop: 15,
  },
  statusLabel: {
    color: '#60efff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  progressBarBg: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 25,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#60efff',
    borderRadius: 2,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    width: (width - 60) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardLabel: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.5,
    marginTop: 10,
  },
  cardValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#0d1428',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
