// TypeScript interfaces for network data
export interface NetworkData {
    ip: string;
    mac: string;
    hostname: string;
    status: 'active' | 'inactive';
}

export interface NetworkStatistics {
    totalDevices: number;
    activeDevices: number;
    inactiveDevices: number;
}