// Interfaces para dados de rede
// Definições de tipos para facilitar o gerenciamento e a legibilidade dos dados da rede.
export interface NetworkData {
    ipAddress: string; // Endereço IP
    macAddress: string; // Endereço MAC
    status: 'active' | 'inactive'; // Estado do dispositivo na rede
}