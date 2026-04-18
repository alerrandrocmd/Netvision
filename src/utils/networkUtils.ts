import { Colors } from '../constants/colors';
import { FrequencyBand, SecurityType, SignalQuality } from '../types/network.types';

export const rssiToQuality = (rssi: number): number => {
  if (rssi >= -50) return 100;
  if (rssi <= -100) return 0;
  return 2 * (rssi + 100);
};

export const freqToLabel = (mhz: number): FrequencyBand => {
  if (mhz >= 2400 && mhz <= 2484) return '2.4 GHz';
  if (mhz >= 4900 && mhz <= 5900) return '5 GHz';
  if (mhz >= 5925) return '6 GHz';
  return 'Desconhecida';
};

export const frequencyToChannel = (mhz: number): number => {
  if (mhz === 2484) return 14;
  if (mhz >= 2412 && mhz <= 2472) return (mhz - 2412) / 5 + 1;
  if (mhz >= 5170 && mhz <= 5825) return (mhz - 5170) / 5 + 34;
  return 0;
};

export const rssiToColor = (rssi: number): string => {
  if (rssi >= -50) return Colors.signalExcellent;
  if (rssi >= -65) return Colors.signalGood;
  if (rssi >= -75) return Colors.signalFair;
  return Colors.signalPoor;
};

export const rssiToLabel = (rssi: number): SignalQuality => {
  if (rssi >= -50) return 'EXCELENTE';
  if (rssi >= -65) return 'BOM';
  if (rssi >= -75) return 'REGULAR';
  if (rssi >= -85) return 'FRACO';
  return 'CRÍTICO';
};

export const deviceTypeEmoji = (type: string): string => {
  const map: Record<string, string> = {
    router: '🌐', phone: '📱', laptop: '💻',
    tv: '📺', iot: '💡', camera: '📷',
    tablet: '📟', server: '🖥️', game_console: '🎮',
    printer: '🖨️', unknown: '❓',
  };
  return map[type] ?? '❓';
};

export const isInsecureSecurity = (type: SecurityType): boolean =>
  type === 'OPEN' || type === 'WEP';
