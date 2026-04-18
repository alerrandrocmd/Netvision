export type SecurityType = 'OPEN' | 'WEP' | 'WPA' | 'WPA2' | 'WPA3' | 'UNKNOWN';
export type FrequencyBand = '2.4 GHz' | '5 GHz' | '6 GHz' | 'Desconhecida';
export type DeviceType =
  | 'router' | 'phone' | 'laptop' | 'tv'
  | 'iot' | 'camera' | 'tablet' | 'server'
  | 'game_console' | 'printer' | 'unknown';
export type SignalQuality = 'EXCELENTE' | 'BOM' | 'REGULAR' | 'FRACO' | 'CRÍTICO';
export type Severity = 'critical' | 'warning' | 'info' | 'ok';

export interface WifiData {
  ssid: string;
  bssid: string;
  rssi: number;
  frequency: number;
  channel: number;
  linkSpeed: number;
  ipAddress: string;
  gateway: string;
  dns1: string;
  dns2: string;
  securityType: SecurityType;
  signalQuality: number;
  frequencyBand: FrequencyBand;
}

export interface NetworkDevice {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  deviceType: DeviceType;
  isCurrentDevice: boolean;
  isTrusted: boolean;
  isNew: boolean;
  rssi: number;
  lastSeen: number;
}

export interface NearbyNetwork {
  ssid: string;
  bssid: string;
  rssi: number;
  frequency: number;
  channel: number;
  securityType: SecurityType;
  frequencyBand: FrequencyBand;
  isCurrentNetwork: boolean;
}

export interface SpeedTestResult {
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  packetLoss: number;
  timestamp: number;
}

export interface AIRecommendation {
  id: string;
  severity: Severity;
  icon: string;
  title: string;
  description: string;
  action?: string;
}
