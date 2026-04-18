import { NetworkDevice, NearbyNetwork, WifiData } from '../types/network.types';

export const MOCK_WIFI: WifiData = {
  ssid: 'HomeNetwork_5G',
  bssid: 'F4:6D:04:A2:B1:88',
  rssi: -58,
  frequency: 5180,
  channel: 36,
  linkSpeed: 433,
  ipAddress: '192.168.1.105',
  gateway: '192.168.1.1',
  dns1: '8.8.8.8',
  dns2: '8.8.4.4',
  securityType: 'WPA3',
  signalQuality: 84,
  frequencyBand: '5 GHz',
};

export const MOCK_DEVICES: NetworkDevice[] = [
  { ip: '192.168.1.1',   mac: 'F4:6D:04:A2:B1:88', hostname: 'Router TP-Link',         vendor: 'TP-Link',        deviceType: 'router',       isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -30, lastSeen: Date.now() },
  { ip: '192.168.1.105', mac: 'AA:BB:CC:DD:EE:FF', hostname: 'Meu Dispositivo',         vendor: 'Google',         deviceType: 'phone',        isCurrentDevice: true,  isTrusted: true,  isNew: false, rssi: -58, lastSeen: Date.now() },
  { ip: '192.168.1.102', mac: '3C:06:30:11:A1:F2', hostname: 'iPhone de Ana',           vendor: 'Apple',          deviceType: 'phone',        isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -62, lastSeen: Date.now() },
  { ip: '192.168.1.103', mac: 'B8:27:EB:4C:A2:D3', hostname: 'Raspberry Pi',            vendor: 'RPi Foundation', deviceType: 'server',       isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -71, lastSeen: Date.now() },
  { ip: '192.168.1.104', mac: 'DC:A6:32:BE:F1:09', hostname: 'SmartTV Samsung',         vendor: 'Samsung',        deviceType: 'tv',           isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -66, lastSeen: Date.now() },
  { ip: '192.168.1.106', mac: '50:D4:F7:C1:B2:E4', hostname: 'MacBook Pro',             vendor: 'Apple',          deviceType: 'laptop',       isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -54, lastSeen: Date.now() },
  { ip: '192.168.1.107', mac: '78:4F:43:A8:D1:C6', hostname: 'Echo Dot',               vendor: 'Amazon',         deviceType: 'iot',          isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -69, lastSeen: Date.now() },
  { ip: '192.168.1.108', mac: 'AC:84:C6:B3:F2:11', hostname: 'Câmera IP',              vendor: 'Hikvision',      deviceType: 'camera',       isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -74, lastSeen: Date.now() },
  { ip: '192.168.1.109', mac: 'C8:3A:35:D4:E2:90', hostname: 'Notebook Dell',          vendor: 'Dell',           deviceType: 'laptop',       isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -60, lastSeen: Date.now() },
  { ip: '192.168.1.110', mac: '28:C6:8E:A1:B3:77', hostname: 'Chromecast',             vendor: 'Google',         deviceType: 'tv',           isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -65, lastSeen: Date.now() },
  { ip: '192.168.1.111', mac: '00:17:88:F1:D2:C8', hostname: 'Lâmpada Hue',           vendor: 'Philips',        deviceType: 'iot',          isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -78, lastSeen: Date.now() },
  { ip: '192.168.1.112', mac: 'E8:65:D4:B2:A1:F3', hostname: 'Dispositivo Desconhecido', vendor: 'Desconhecido', deviceType: 'unknown',      isCurrentDevice: false, isTrusted: false, isNew: true,  rssi: -80, lastSeen: Date.now() },
  { ip: '192.168.1.113', mac: '44:07:0B:C3:E1:29', hostname: 'Xbox Series X',          vendor: 'Microsoft',      deviceType: 'game_console', isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -55, lastSeen: Date.now() },
  { ip: '192.168.1.114', mac: 'F0:27:2D:A4:B1:E5', hostname: 'Impressora HP',          vendor: 'HP',             deviceType: 'printer',      isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -72, lastSeen: Date.now() },
  { ip: '192.168.1.115', mac: '70:5A:0F:D3:C2:B8', hostname: 'iPad Pro',               vendor: 'Apple',          deviceType: 'tablet',       isCurrentDevice: false, isTrusted: true,  isNew: false, rssi: -63, lastSeen: Date.now() },
];

export const MOCK_NEARBY: NearbyNetwork[] = [
  { ssid: 'HomeNetwork_5G', bssid: 'F4:6D:04:A2:B1:88', rssi: -58, frequency: 5180, channel: 36, securityType: 'WPA3', frequencyBand: '5 GHz',   isCurrentNetwork: true  },
  { ssid: 'Vizinho_WiFi',   bssid: 'AA:11:22:33:44:55', rssi: -72, frequency: 2437, channel: 6,  securityType: 'WPA2', frequencyBand: '2.4 GHz', isCurrentNetwork: false },
  { ssid: 'NET_CLARO_2.4',  bssid: 'BB:22:33:44:55:66', rssi: -80, frequency: 2437, channel: 6,  securityType: 'WPA2', frequencyBand: '2.4 GHz', isCurrentNetwork: false },
  { ssid: 'VIVO_FIBER_5G',  bssid: 'CC:33:44:55:66:77', rssi: -75, frequency: 5200, channel: 40, securityType: 'WPA3', frequencyBand: '5 GHz',   isCurrentNetwork: false },
  { ssid: 'REDE_ABERTA',    bssid: 'DD:44:55:66:77:88', rssi: -68, frequency: 2412, channel: 1,  securityType: 'OPEN', frequencyBand: '2.4 GHz', isCurrentNetwork: false },
];
