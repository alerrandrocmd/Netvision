import { AIRecommendation, NearbyNetwork, SecurityType } from '../types/network.types';

interface AnalysisParams {
  rssi: number;
  deviceCount: number;
  securityType: SecurityType;
  nearbyNetworks: NearbyNetwork[];
  unknownDevices: number;
}

export const analyzeNetwork = (params: AnalysisParams): AIRecommendation[] => {
  const { rssi, deviceCount, securityType, nearbyNetworks, unknownDevices } = params;
  const recs: AIRecommendation[] = [];

  if (rssi < -70 && deviceCount > 10) {
    recs.push({
      id: 'congestion',
      severity: 'critical',
      icon: 'lightning-bolt',
      title: 'Rede Congestionada',
      description: `Sinal fraco (${rssi} dBm) com ${deviceCount} dispositivos conectados.`,
      action: 'Use um repetidor Wi-Fi ou troque de canal no roteador.',
    });
  }

  if (securityType === 'OPEN' || securityType === 'WEP') {
    recs.push({
      id: 'security',
      severity: 'critical',
      icon: 'shield-alert',
      title: 'Rede Vulnerável',
      description: `Protocolo ${securityType} expõe seus dados a interceptação.`,
      action: 'Acesse o roteador e ative WPA3 ou WPA2-AES.',
    });
  }

  if (rssi < -80) {
    recs.push({
      id: 'signal',
      severity: 'warning',
      icon: 'wifi-strength-1',
      title: 'Sinal Crítico',
      description: `RSSI de ${rssi} dBm indica distância excessiva do roteador.`,
      action: 'Instale um repetidor Wi-Fi Mesh próximo a este ponto.',
    });
  }

  const currentNet = nearbyNetworks.find(n => n.isCurrentNetwork);
  const interference = nearbyNetworks.filter(
    n => !n.isCurrentNetwork && n.channel === currentNet?.channel
  );
  if (interference.length >= 2) {
    recs.push({
      id: 'channel',
      severity: 'warning',
      icon: 'antenna',
      title: 'Interferência de Canal',
      description: `${interference.length} redes no mesmo canal (${currentNet?.channel}).`,
      action: 'Veja o canal recomendado na aba Diagnóstico.',
    });
  }

  if (unknownDevices > 0) {
    recs.push({
      id: 'intruder',
      severity: 'critical',
      icon: 'account-alert',
      title: `${unknownDevices} Dispositivo(s) Suspeito(s)`,
      description: 'MACs desconhecidos detectados na sua rede.',
      action: 'Verifique a aba Dispositivos e bloqueie no roteador.',
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: 'ok',
      severity: 'ok',
      icon: 'check-circle',
      title: 'Rede Saudável',
      description: 'Sinal, segurança e desempenho dentro dos parâmetros ideais.',
    });
  }

  const order: Record<string, number> = { critical: 0, warning: 1, info: 2, ok: 3 };
  return recs.sort((a, b) => order[a.severity] - order[b.severity]);
};

export const recommendBestChannel = (nearbyNetworks: NearbyNetwork[]): number => {
  const load: Record<number, number> = { 1: 0, 6: 0, 11: 0 };
  nearbyNetworks
    .filter(n => n.frequencyBand === '2.4 GHz')
    .forEach(n => {
      if (n.channel <= 3) load[1]++;
      else if (n.channel <= 8) load[6]++;
      else load[11]++;
    });
  return parseInt(Object.entries(load).sort((a, b) => a[1] - b[1])[0][0]);
};
