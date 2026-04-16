import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// NETVISION - Aplicativo Profissional de Diagnóstico de Rede
// Desenvolvido com React (simulação fiel do React Native/Expo)
// Stack: TypeScript-like patterns, Glassmorfismo, Dark Mode Premium
// ============================================================

// --- UTILITÁRIOS E CONSTANTES ---

/**
 * Converte valor RSSI (dBm) para porcentagem de qualidade do sinal
 * Android retorna valores entre -100 (sem sinal) e 0 (sinal máximo)
 */
const rssiToQuality = (rssi) => {
  if (rssi >= -50) return 100;
  if (rssi <= -100) return 0;
  return Math.round(2 * (rssi + 100));
};

/**
 * Converte frequência em MHz para label legível
 * WifiInfo.getFrequency() no Android retorna MHz
 */
const freqToLabel = (mhz) => {
  if (mhz >= 2400 && mhz <= 2484) return "2.4 GHz";
  if (mhz >= 4900 && mhz <= 5900) return "5 GHz";
  if (mhz >= 5925 && mhz <= 7125) return "6 GHz (Wi-Fi 6E)";
  return `${mhz} MHz`;
};

/**
 * Retorna cor baseada na qualidade do sinal
 */
const rssiToColor = (rssi) => {
  if (rssi >= -50) return "#00ff87";
  if (rssi >= -65) return "#60efff";
  if (rssi >= -75) return "#f7c948";
  return "#ff4d6d";
};

/**
 * Motor de IA: Analisa parâmetros da rede e retorna recomendações
 * Lógica: (sinal < -70dBm AND dispositivos > 10) → congestionamento
 */
const aiNetworkAnalysis = (rssi, deviceCount, securityType, frequency) => {
  const recommendations = [];
  let severity = "ok";

  if (rssi < -70 && deviceCount > 10) {
    recommendations.push({
      icon: "⚡",
      text: "Rede altamente congestionada e sinal fraco. Recomenda-se o uso de um repetidor Wi-Fi ou troca de canal.",
      severity: "critical",
    });
    severity = "critical";
  }
  if (securityType === "OPEN" || securityType === "WEP") {
    recommendations.push({
      icon: "🔓",
      text: `Rede sem criptografia adequada (${securityType}). Risco de interceptação de dados. Atualize para WPA3.`,
      severity: "danger",
    });
    severity = "danger";
  }
  if (rssi < -80) {
    recommendations.push({
      icon: "📡",
      text: "Sinal crítico. Aproxime-se do roteador ou instale um repetidor de sinal.",
      severity: "warning",
    });
  }
  if (frequency === 2437 && deviceCount > 5) {
    recommendations.push({
      icon: "📶",
      text: "Canal 2.4GHz congestionado. Considere migrar dispositivos para a banda 5GHz.",
      severity: "info",
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      icon: "✅",
      text: "Rede estável. Sem anomalias detectadas. Segurança e desempenho dentro dos parâmetros ideais.",
      severity: "ok",
    });
  }
  return { recommendations, severity };
};

// --- DADOS SIMULADOS (replicando o que as APIs nativas retornariam) ---
const MOCK_WIFI_INFO = {
  ssid: "HomeNetwork_5G",
  bssid: "F4:6D:04:A2:B1:88",
  rssi: -58,
  frequency: 5180,
  channel: 36,
  linkSpeed: 433,
  txLinkSpeed: 433,
  rxLinkSpeed: 400,
  securityType: "WPA3",
  ipAddress: "192.168.1.105",
  gateway: "192.168.1.1",
  dns1: "8.8.8.8",
  dns2: "8.8.4.4",
  subnetMask: "255.255.255.0",
  macAddress: "AA:BB:CC:DD:EE:FF",
  networkId: 7,
};

const MOCK_DEVICES = [
  { ip: "192.168.1.1", mac: "F4:6D:04:A2:B1:88", hostname: "Router TP-Link", vendor: "TP-Link", type: "router", isCurrentDevice: false, rssi: -30, lastSeen: "Online" },
  { ip: "192.168.1.105", mac: "AA:BB:CC:DD:EE:FF", hostname: "Meu Dispositivo", vendor: "Google", type: "phone", isCurrentDevice: true, rssi: -58, lastSeen: "Agora" },
  { ip: "192.168.1.102", mac: "3C:06:30:11:A1:F2", hostname: "iPhone de Ana", vendor: "Apple", type: "phone", isCurrentDevice: false, rssi: -62, lastSeen: "Online" },
  { ip: "192.168.1.103", mac: "B8:27:EB:4C:A2:D3", hostname: "Raspberry Pi", vendor: "Raspberry Pi Foundation", type: "server", isCurrentDevice: false, rssi: -71, lastSeen: "Online" },
  { ip: "192.168.1.104", mac: "DC:A6:32:BE:F1:09", hostname: "SmartTV Samsung", vendor: "Samsung", type: "tv", isCurrentDevice: false, rssi: -66, lastSeen: "Online" },
  { ip: "192.168.1.106", mac: "50:D4:F7:C1:B2:E4", hostname: "MacBook Pro", vendor: "Apple", type: "laptop", isCurrentDevice: false, rssi: -54, lastSeen: "Online" },
  { ip: "192.168.1.107", mac: "78:4F:43:A8:D1:C6", hostname: "Echo Dot", vendor: "Amazon", type: "iot", isCurrentDevice: false, rssi: -69, lastSeen: "Online" },
  { ip: "192.168.1.108", mac: "AC:84:C6:B3:F2:11", hostname: "Câmera IP", vendor: "Hikvision", type: "camera", isCurrentDevice: false, rssi: -74, lastSeen: "Online" },
  { ip: "192.168.1.109", mac: "C8:3A:35:D4:E2:90", hostname: "Notebook Dell", vendor: "Dell", type: "laptop", isCurrentDevice: false, rssi: -60, lastSeen: "Online" },
  { ip: "192.168.1.110", mac: "28:C6:8E:A1:B3:77", hostname: "Chromecast", vendor: "Google", type: "tv", isCurrentDevice: false, rssi: -65, lastSeen: "Online" },
  { ip: "192.168.1.111", mac: "00:17:88:F1:D2:C8", hostname: "Lâmpada Hue", vendor: "Philips", type: "iot", isCurrentDevice: false, rssi: -78, lastSeen: "Online" },
  { ip: "192.168.1.112", mac: "E8:65:D4:B2:A1:F3", hostname: "Dispositivo Desconhecido", vendor: "Unknown", type: "unknown", isCurrentDevice: false, rssi: -80, lastSeen: "Online" },
  { ip: "192.168.1.113", mac: "44:07:0B:C3:E1:29", hostname: "Xbox Series X", vendor: "Microsoft", type: "game", isCurrentDevice: false, rssi: -55, lastSeen: "Online" },
  { ip: "192.168.1.114", mac: "F0:27:2D:A4:B1:E5", hostname: "Impressora HP", vendor: "HP", type: "printer", isCurrentDevice: false, rssi: -72, lastSeen: "Online" },
  { ip: "192.168.1.115", mac: "70:5A:0F:D3:C2:B8", hostname: "Tablet iPad", vendor: "Apple", type: "tablet", isCurrentDevice: false, rssi: -63, lastSeen: "Online" },
];

const MOCK_NEARBY_NETWORKS = [
  { ssid: "HomeNetwork_5G", rssi: -58, channel: 36, frequency: 5180, security: "WPA3", isCurrentNetwork: true },
  { ssid: "Vizinho_WiFi", rssi: -72, channel: 6, frequency: 2437, security: "WPA2", isCurrentNetwork: false },
  { ssid: "NET_CLARO_2.4", rssi: -80, channel: 6, frequency: 2437, security: "WPA2", isCurrentNetwork: false },
  { ssid: "VIVO_FIBER_5G", rssi: -75, channel: 40, frequency: 5200, security: "WPA3", isCurrentNetwork: false },
  { ssid: "TIM_LIVE_2G", rssi: -85, channel: 11, frequency: 2462, security: "WPA2", isCurrentNetwork: false },
  { ssid: "REDE_ABERTA", rssi: -68, channel: 1, frequency: 2412, security: "OPEN", isCurrentNetwork: false },
];

// Ícones SVG inline para substituir Lucide/MaterialCommunityIcons
const icons = {
  wifi: (s = 20, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={c}/>
    </svg>
  ),
  shield: (s = 20, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  activity: (s = 20, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  cpu: (s = 20, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  zap: (s = 20, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  radar: (s = 20, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><line x1="12" y1="12" x2="19.07" y2="4.93"/>
    </svg>
  ),
  bot: (s = 20, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  ),
  map: (s = 20, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  ),
};

const deviceIcons = {
  router: "🌐", phone: "📱", laptop: "💻", tv: "📺", iot: "💡",
  camera: "📷", tablet: "📟", server: "🖥️", game: "🎮", printer: "🖨️", unknown: "❓",
};

// ============================================================
// COMPONENTE: Velocímetro Central (SVG Animado)
// ============================================================
const SignalGauge = ({ rssi }) => {
  const quality = rssiToQuality(rssi);
  const color = rssiToColor(rssi);
  const angle = -135 + (quality / 100) * 270;
  const label = quality >= 80 ? "EXCELENTE" : quality >= 60 ? "BOM" : quality >= 40 ? "REGULAR" : "FRACO";

  // Arco SVG para o gauge
  const polarToCartesian = (cx, cy, r, deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const describeArc = (cx, cy, r, start, end) => {
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, end);
    const large = end - start <= 180 ? "0" : "1";
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      <svg width="220" height="160" viewBox="0 0 220 160">
        {/* Fundo do arco */}
        <path d={describeArc(110, 130, 85, -135, 135)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round"/>
        {/* Arco de qualidade */}
        <path d={describeArc(110, 130, 85, -135, -135 + (quality / 100) * 270)} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "all 0.8s ease" }}/>
        {/* Ticks */}
        {[0, 25, 50, 75, 100].map((v) => {
          const a = -135 + (v / 100) * 270;
          const outer = polarToCartesian(110, 130, 95, a);
          const inner = polarToCartesian(110, 130, 88, a);
          return <line key={v} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>;
        })}
        {/* Ponteiro */}
        {(() => {
          const tip = polarToCartesian(110, 130, 72, angle);
          const base1 = polarToCartesian(110, 130, 10, angle + 90);
          const base2 = polarToCartesian(110, 130, 10, angle - 90);
          return (
            <polygon points={`${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`}
              fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "all 0.8s ease" }}/>
          );
        })()}
        {/* Centro do ponteiro */}
        <circle cx="110" cy="130" r="8" fill="#1a1f2e" stroke={color} strokeWidth="2"/>
        <circle cx="110" cy="130" r="3" fill={color}/>
        {/* Labels de escala */}
        {["FRACO", "", "BOM", "", "MAX"].map((t, i) => {
          const a = -135 + (i / 4) * 270;
          const p = polarToCartesian(110, 130, 107, a);
          return t ? <text key={i} x={p.x} y={p.y} fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="middle" dominantBaseline="middle">{t}</text> : null;
        })}
      </svg>
      {/* Valor central */}
      <div style={{ position: "absolute", bottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 900, color, fontFamily: "'Courier New', monospace", letterSpacing: "-2px", lineHeight: 1, textShadow: `0 0 20px ${color}` }}>
          {rssi}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "3px", marginTop: 2 }}>dBm</div>
        <div style={{ fontSize: 12, color, fontWeight: 700, letterSpacing: "2px", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
};

// ============================================================
// COMPONENTE: Linha de sinal em tempo real (Mini Grafico)
// ============================================================
const SignalChart = ({ data }) => {
  const w = 280, h = 60, pad = 8;
  const min = -100, max = 0;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60efff" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#60efff" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Área sob a linha */}
      <polygon points={`${pad},${h - pad} ${pts} ${w - pad},${h - pad}`} fill="url(#lineGrad)"/>
      {/* Linha */}
      <polyline points={pts} fill="none" stroke="#60efff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 4px #60efff)" }}/>
      {/* Último ponto */}
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const x = w - pad;
        const y = h - pad - ((last - min) / (max - min)) * (h - pad * 2);
        return <circle cx={x} cy={y} r="4" fill="#60efff" style={{ filter: "drop-shadow(0 0 6px #60efff)" }}/>;
      })()}
    </svg>
  );
};

// ============================================================
// COMPONENTE: Barra de progresso com glassmorfismo
// ============================================================
const GlassBar = ({ value, max = 100, color = "#60efff", label, sublabel }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>{label}</span>
      <span style={{ fontSize: 11, color, fontWeight: 700 }}>{sublabel}</span>
    </div>
    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: `linear-gradient(90deg, ${color}88, ${color})`,
        borderRadius: 3, boxShadow: `0 0 8px ${color}66`, transition: "width 0.8s ease" }}/>
    </div>
  </div>
);

// ============================================================
// COMPONENTE: Badge de Segurança
// ============================================================
const SecurityBadge = ({ type }) => {
  const isInsecure = type === "OPEN" || type === "WEP";
  const isLegacy = type === "WPA";
  const color = isInsecure ? "#ff4d6d" : isLegacy ? "#f7c948" : "#00ff87";
  const bg = isInsecure ? "rgba(255,77,109,0.15)" : isLegacy ? "rgba(247,201,72,0.15)" : "rgba(0,255,135,0.15)";
  const label = isInsecure ? "⚠ INSEGURA" : isLegacy ? "⚠ LEGADA" : "✓ SEGURA";

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
      background: bg, border: `1px solid ${color}44`, borderRadius: 20,
      boxShadow: isInsecure ? `0 0 12px ${color}44` : "none" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color,
        boxShadow: `0 0 6px ${color}`, animation: isInsecure ? "pulse 1.5s infinite" : "none" }}/>
      <span style={{ fontSize: 11, color, fontWeight: 700, letterSpacing: "1px" }}>{label}</span>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{type}</span>
    </div>
  );
};

// ============================================================
// ABA: DASHBOARD PRINCIPAL
// ============================================================
const DashboardTab = ({ wifiInfo, signalHistory, speedData }) => {
  const quality = rssiToQuality(wifiInfo.rssi);
  const { recommendations } = aiNetworkAnalysis(wifiInfo.rssi, MOCK_DEVICES.length, wifiInfo.securityType, wifiInfo.frequency);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      {/* Header Info */}
      <div style={styles.glassCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{wifiInfo.ssid}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2, fontFamily: "monospace" }}>{wifiInfo.bssid}</div>
          </div>
          <SecurityBadge type={wifiInfo.securityType}/>
        </div>

        {/* Gauge Central */}
        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
          <SignalGauge rssi={wifiInfo.rssi}/>
        </div>

        {/* Frequência e Canal */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
          {[
            { label: "FREQUÊNCIA", value: freqToLabel(wifiInfo.frequency), color: "#60efff" },
            { label: "CANAL", value: `Ch ${wifiInfo.channel}`, color: "#a78bfa" },
            { label: "VELOCIDADE", value: `${wifiInfo.linkSpeed} Mbps`, color: "#00ff87" },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 12,
              padding: "10px 8px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "1px", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de Estabilidade */}
      <div style={styles.glassCard}>
        <div style={styles.cardTitle}>Estabilidade do Sinal</div>
        <div style={{ marginTop: 10, overflow: "hidden" }}>
          <SignalChart data={signalHistory}/>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>-100 dBm</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Últimos 30s</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>0 dBm</span>
        </div>
      </div>

      {/* Métricas de Rede */}
      <div style={styles.glassCard}>
        <div style={styles.cardTitle}>Métricas de Rede</div>
        <div style={{ marginTop: 14 }}>
          <GlassBar value={quality} label="INTENSIDADE DO SINAL" sublabel={`${quality}% (${wifiInfo.rssi} dBm)`} color={rssiToColor(wifiInfo.rssi)}/>
          <GlassBar value={speedData.download} max={1000} label="DOWNLOAD" sublabel={`${speedData.download.toFixed(1)} Mbps`} color="#00ff87"/>
          <GlassBar value={speedData.upload} max={500} label="UPLOAD" sublabel={`${speedData.upload.toFixed(1)} Mbps`} color="#60efff"/>
          <GlassBar value={Math.max(0, 100 - speedData.ping)} label="LATÊNCIA" sublabel={`${speedData.ping} ms`} color="#a78bfa"/>
        </div>
      </div>

      {/* Recomendações da IA */}
      <div style={styles.glassCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          {icons.bot(16, "#a78bfa")}
          <div style={styles.cardTitle}>Análise de IA</div>
        </div>
        {recommendations.map((rec, i) => {
          const colors = { critical: "#ff4d6d", danger: "#ff4d6d", warning: "#f7c948", info: "#60efff", ok: "#00ff87" };
          const c = colors[rec.severity];
          return (
            <div key={i} style={{ padding: "10px 12px", background: `${c}11`, border: `1px solid ${c}33`,
              borderRadius: 10, marginBottom: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16 }}>{rec.icon}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{rec.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// ABA: SCANNER DE DISPOSITIVOS
// ============================================================
const DevicesTab = ({ scanning, onScan }) => {
  const [selectedDevice, setSelectedDevice] = useState(null);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={styles.glassCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={styles.cardTitle}>Dispositivos na Rede</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{MOCK_DEVICES.length} dispositivos encontrados</div>
          </div>
          <button onClick={onScan} style={{ ...styles.actionBtn, background: scanning ? "rgba(96,239,255,0.15)" : "rgba(96,239,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {icons.radar(14, "#60efff")}
              <span style={{ fontSize: 12, color: "#60efff", fontWeight: 700 }}>{scanning ? "ESCANEANDO..." : "ESCANEAR"}</span>
            </div>
          </button>
        </div>
        {scanning && (
          <div style={{ marginTop: 12, height: 3, background: "rgba(96,239,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "60%", background: "#60efff", borderRadius: 2,
              animation: "scan 1.5s ease-in-out infinite", boxShadow: "0 0 8px #60efff" }}/>
          </div>
        )}
      </div>

      {MOCK_DEVICES.map((device) => (
        <div key={device.ip} onClick={() => setSelectedDevice(selectedDevice?.ip === device.ip ? null : device)}
          style={{ ...styles.glassCard, cursor: "pointer", border: device.isCurrentDevice
            ? "1px solid rgba(0,255,135,0.3)" : device.vendor === "Unknown"
            ? "1px solid rgba(255,77,109,0.3)" : "1px solid rgba(255,255,255,0.06)",
            marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              background: device.isCurrentDevice ? "rgba(0,255,135,0.12)" : device.vendor === "Unknown"
              ? "rgba(255,77,109,0.12)" : "rgba(255,255,255,0.06)", fontSize: 22,
              border: device.isCurrentDevice ? "1px solid rgba(0,255,135,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
              {deviceIcons[device.type]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: device.isCurrentDevice ? "#00ff87" : "#fff" }}>{device.hostname}</span>
                {device.isCurrentDevice && <span style={{ fontSize: 9, color: "#00ff87", background: "rgba(0,255,135,0.15)", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>VOCÊ</span>}
                {device.vendor === "Unknown" && <span style={{ fontSize: 9, color: "#ff4d6d", background: "rgba(255,77,109,0.15)", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>⚠ SUSPEITO</span>}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{device.vendor} · {device.ip}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: rssiToColor(device.rssi) }}>{device.rssi} dBm</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", display: "inline-block",
                  background: "#00ff87", marginRight: 4, boxShadow: "0 0 4px #00ff87" }}/>
                {device.lastSeen}
              </div>
            </div>
          </div>

          {/* Detalhes expandidos */}
          {selectedDevice?.ip === device.ip && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                ["Endereço MAC", device.mac],
                ["Fabricante", device.vendor],
                ["IP", device.ip],
                ["RSSI", `${device.rssi} dBm (${rssiToQuality(device.rssi)}%)`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{k}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================
// ABA: DIAGNÓSTICO WI-FI + ANÁLISE DE CANAIS
// ============================================================
const DiagnosticsTab = ({ wifiInfo }) => {
  // Algoritmo de análise de canais
  const channelInterference = {};
  MOCK_NEARBY_NETWORKS.forEach((n) => {
    const ch = n.channel;
    if (!channelInterference[ch]) channelInterference[ch] = { count: 0, totalRssi: 0 };
    channelInterference[ch].count++;
    channelInterference[ch].totalRssi += n.rssi;
  });
  const bestChannel = [1, 6, 11].reduce((best, ch) => {
    const load = channelInterference[ch]?.count || 0;
    const bestLoad = channelInterference[best]?.count || 99;
    return load < bestLoad ? ch : best;
  }, 1);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      {/* Informações Técnicas */}
      <div style={styles.glassCard}>
        <div style={styles.cardTitle}>Informações da Rede</div>
        <div style={{ marginTop: 14 }}>
          {[
            ["SSID", wifiInfo.ssid, "#60efff"],
            ["BSSID", wifiInfo.bssid, "rgba(255,255,255,0.6)"],
            ["IP Address", wifiInfo.ipAddress, "#00ff87"],
            ["Gateway", wifiInfo.gateway, "rgba(255,255,255,0.6)"],
            ["DNS Primário", wifiInfo.dns1, "rgba(255,255,255,0.6)"],
            ["DNS Secundário", wifiInfo.dns2, "rgba(255,255,255,0.6)"],
            ["Máscara de Sub-rede", wifiInfo.subnetMask, "rgba(255,255,255,0.6)"],
            ["Frequência", freqToLabel(wifiInfo.frequency), "#a78bfa"],
            ["Canal", `${wifiInfo.channel}`, "#a78bfa"],
            ["Velocidade TX", `${wifiInfo.txLinkSpeed} Mbps`, "#00ff87"],
            ["Velocidade RX", `${wifiInfo.rxLinkSpeed} Mbps`, "#00ff87"],
            ["Segurança", wifiInfo.securityType, "#00ff87"],
          ].map(([k, v, c]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: c, fontFamily: "monospace" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Redes próximas + Análise de Canais */}
      <div style={styles.glassCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={styles.cardTitle}>Redes Detectadas</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "1px" }}>CANAL RECOMENDADO</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#00ff87" }}>Ch {bestChannel}</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          {MOCK_NEARBY_NETWORKS.map((net, i) => {
            const q = rssiToQuality(net.rssi);
            const c = rssiToColor(net.rssi);
            return (
              <div key={i} style={{ marginBottom: 12, padding: "10px 12px",
                background: net.isCurrentNetwork ? "rgba(0,255,135,0.06)" : "rgba(255,255,255,0.02)",
                borderRadius: 10, border: net.isCurrentNetwork ? "1px solid rgba(0,255,135,0.2)" : "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: net.isCurrentNetwork ? "#00ff87" : "#fff" }}>{net.ssid}</span>
                    {net.isCurrentNetwork && <span style={{ fontSize: 9, color: "#00ff87", background: "rgba(0,255,135,0.15)", padding: "1px 6px", borderRadius: 8 }}>CONECTADO</span>}
                    {net.security === "OPEN" && <span style={{ fontSize: 9, color: "#ff4d6d", background: "rgba(255,77,109,0.15)", padding: "1px 6px", borderRadius: 8 }}>ABERTA</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{net.rssi} dBm</span>
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Ch {net.channel} · {freqToLabel(net.frequency)} · {net.security}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${q}%`, background: c, borderRadius: 2, transition: "width 0.5s" }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ABA: TESTE DE VELOCIDADE
// ============================================================
const SpeedTab = ({ speedData, onTest, testing }) => {
  const [phase, setPhase] = useState("idle");

  const handleTest = () => {
    setPhase("ping");
    onTest();
    setTimeout(() => setPhase("download"), 1500);
    setTimeout(() => setPhase("upload"), 4000);
    setTimeout(() => setPhase("done"), 6500);
  };

  const SpeedMeter = ({ value, max, label, color, unit = "Mbps" }) => {
    const pct = Math.min((value / max) * 100, 100);
    const r = 50, c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    return (
      <div style={{ textAlign: "center", flex: 1 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 0.8s ease", filter: `drop-shadow(0 0 6px ${color})` }}/>
          <text x="60" y="54" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="900" fontFamily="monospace">{value.toFixed(0)}</text>
          <text x="60" y="70" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">{unit}</text>
        </svg>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "2px", marginTop: -4 }}>{label}</div>
      </div>
    );
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={styles.glassCard}>
        <div style={styles.cardTitle}>Teste de Velocidade</div>

        <div style={{ display: "flex", justifyContent: "space-around", margin: "20px 0" }}>
          <SpeedMeter value={speedData.download} max={500} label="DOWNLOAD" color="#00ff87"/>
          <SpeedMeter value={speedData.upload} max={200} label="UPLOAD" color="#60efff"/>
          <SpeedMeter value={speedData.ping} max={200} label="PING" color="#a78bfa" unit="ms"/>
        </div>

        {/* Fases do teste */}
        {(testing || phase === "done") && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            {["ping", "download", "upload"].map((p) => {
              const order = ["ping", "download", "upload"];
              const idx = order.indexOf(p);
              const currIdx = order.indexOf(phase);
              const done = phase === "done" || currIdx > idx;
              const active = phase === p;
              const c = done ? "#00ff87" : active ? "#60efff" : "rgba(255,255,255,0.2)";
              return (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c,
                    boxShadow: active ? `0 0 8px ${c}` : "none", animation: active ? "pulse 1s infinite" : "none" }}/>
                  <span style={{ fontSize: 10, color: c, textTransform: "uppercase", letterSpacing: "1px" }}>{p}</span>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={handleTest} disabled={testing}
          style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: testing ? "not-allowed" : "pointer",
            background: testing ? "rgba(96,239,255,0.05)" : "linear-gradient(135deg, rgba(96,239,255,0.2), rgba(0,255,135,0.1))",
            borderTop: "1px solid rgba(96,239,255,0.2)", color: testing ? "rgba(96,239,255,0.5)" : "#60efff",
            fontSize: 14, fontWeight: 700, letterSpacing: "2px" }}>
          {testing ? "⟳ TESTANDO..." : "▶ INICIAR TESTE"}
        </button>
      </div>

      {/* Detalhes adicionais */}
      <div style={styles.glassCard}>
        <div style={styles.cardTitle}>Detalhes da Conexão</div>
        <div style={{ marginTop: 12 }}>
          {[
            ["Jitter", `${speedData.jitter || 3} ms`, "#f7c948"],
            ["Packet Loss", `${speedData.packetLoss || 0}%`, "#00ff87"],
            ["Servidor de Teste", "São Paulo, BR", "rgba(255,255,255,0.5)"],
            ["Protocolo", "IPv4 + IPv6", "rgba(255,255,255,0.5)"],
          ].map(([k, v, c]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ABA: SEGURANÇA
// ============================================================
const SecurityTab = ({ wifiInfo }) => {
  const isInsecure = wifiInfo.securityType === "OPEN" || wifiInfo.securityType === "WEP";
  const accentColor = isInsecure ? "#ff4d6d" : "#00ff87";
  const threats = [
    { name: "Criptografia da Rede", status: wifiInfo.securityType === "WPA3" ? "ok" : wifiInfo.securityType === "WPA2" ? "warning" : "danger",
      detail: wifiInfo.securityType === "WPA3" ? "WPA3 - Protocolo mais seguro" : `${wifiInfo.securityType} - Considere atualizar`, icon: "🔐" },
    { name: "Dispositivos Suspeitos", status: MOCK_DEVICES.some(d => d.vendor === "Unknown") ? "danger" : "ok",
      detail: "1 MAC desconhecido detectado: E8:65:D4:B2:A1:F3", icon: "👁️" },
    { name: "Redes Abertas Próximas", status: "warning", detail: "1 rede sem criptografia detectada: REDE_ABERTA", icon: "📡" },
    { name: "DNS Seguro", status: "ok", detail: "8.8.8.8 (Google DNS) - Sem vazamentos detectados", icon: "🌐" },
    { name: "Firewall do Roteador", status: "ok", detail: "Verificado via TTL analysis", icon: "🛡️" },
  ];

  const statusColors = { ok: "#00ff87", warning: "#f7c948", danger: "#ff4d6d" };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      {/* Banner de segurança */}
      <div style={{ ...styles.glassCard, border: `1px solid ${accentColor}33`,
        background: `linear-gradient(135deg, ${accentColor}08, rgba(15,20,40,0.8))` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 40 }}>{isInsecure ? "🔴" : "🟢"}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: accentColor }}>
              {isInsecure ? "REDE VULNERÁVEL" : "REDE PROTEGIDA"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              {isInsecure ? "Sua conexão está exposta. Tome medidas imediatas." : "Sua conexão está protegida por criptografia avançada."}
            </div>
          </div>
        </div>
        {isInsecure && (
          <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(255,77,109,0.1)",
            borderRadius: 10, border: "1px solid rgba(255,77,109,0.2)", fontSize: 12, color: "#ff4d6d" }}>
            ⚠ Redes abertas permitem que qualquer pessoa intercepte seu tráfego. Não acesse informações sensíveis.
          </div>
        )}
      </div>

      {/* Checklist de segurança */}
      <div style={styles.glassCard}>
        <div style={styles.cardTitle}>Análise de Segurança</div>
        <div style={{ marginTop: 14 }}>
          {threats.map((t, i) => {
            const c = statusColors[t.status];
            return (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0",
                borderBottom: i < threats.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ fontSize: 20 }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.name}</span>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c,
                      boxShadow: `0 0 6px ${c}`, flexShrink: 0 }}/>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{t.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAC Whitelist */}
      <div style={styles.glassCard}>
        <div style={styles.cardTitle}>Dispositivos Confiáveis</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4, marginBottom: 14 }}>
          MACs salvos no banco local (SQLite). Novos MACs disparam notificação.
        </div>
        {MOCK_DEVICES.filter(d => !d.isCurrentDevice).slice(0, 4).map((d) => (
          <div key={d.mac} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div>
              <div style={{ fontSize: 12, color: d.vendor === "Unknown" ? "#ff4d6d" : "#fff", fontWeight: 600 }}>{d.hostname}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{d.mac}</div>
            </div>
            <div style={{ fontSize: 9, padding: "3px 8px", borderRadius: 8, fontWeight: 700,
              background: d.vendor === "Unknown" ? "rgba(255,77,109,0.15)" : "rgba(0,255,135,0.1)",
              color: d.vendor === "Unknown" ? "#ff4d6d" : "#00ff87" }}>
              {d.vendor === "Unknown" ? "SUSPEITO" : "CONFIÁVEL"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL: NetVision App
// ============================================================
export default function NetVisionApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [signalHistory, setSignalHistory] = useState(Array(30).fill(-58));
  const [wifiInfo, setWifiInfo] = useState(MOCK_WIFI_INFO);
  const [scanning, setScanning] = useState(false);
  const [speedTesting, setSpeedTesting] = useState(false);
  const [speedData, setSpeedData] = useState({ download: 0, upload: 0, ping: 0 });
  const timerRef = useRef(null);

  // Simula variação do sinal em tempo real (polling nativo usaria WifiManager)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setWifiInfo((prev) => {
        const newRssi = Math.max(-90, Math.min(-40, prev.rssi + (Math.random() - 0.5) * 4));
        return { ...prev, rssi: Math.round(newRssi) };
      });
      setSignalHistory((prev) => {
        const last = prev[prev.length - 1];
        const next = Math.max(-90, Math.min(-40, last + (Math.random() - 0.5) * 5));
        return [...prev.slice(1), Math.round(next)];
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Simula escaneamento de rede (substitui ARP scan + ping sweep da sub-rede)
  const handleScan = useCallback(() => {
    setScanning(true);
    setTimeout(() => setScanning(false), 3000);
  }, []);

  // Simula teste de velocidade (integraria com biblioteca de Speedtest nativa)
  const handleSpeedTest = useCallback(() => {
    setSpeedTesting(true);
    setSpeedData({ download: 0, upload: 0, ping: 0 });
    let t = 0;
    const interval = setInterval(() => {
      t += 0.1;
      setSpeedData({
        ping: t < 1.5 ? Math.round(15 + Math.random() * 5) : 18,
        download: t >= 1.5 && t < 4 ? Math.min(245, (t - 1.5) * 100 + Math.random() * 20) : t >= 4 ? 245 : 0,
        upload: t >= 4 ? Math.min(92, (t - 4) * 40 + Math.random() * 10) : 0,
      });
      if (t >= 6.5) { clearInterval(interval); setSpeedTesting(false); }
    }, 100);
  }, []);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: icons.activity },
    { id: "devices", label: "Dispositivos", icon: icons.cpu },
    { id: "diagnostics", label: "Wi-Fi", icon: icons.wifi },
    { id: "speed", label: "Velocidade", icon: icons.zap },
    { id: "security", label: "Segurança", icon: icons.shield },
  ];

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.9); } }
        @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 10px rgba(96,239,255,0.2); } 50% { box-shadow: 0 0 20px rgba(96,239,255,0.5); } }
      `}</style>

      {/* Fundo de atmosfera */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 350, height: 350,
          background: "radial-gradient(circle, rgba(96,239,255,0.08) 0%, transparent 70%)", borderRadius: "50%" }}/>
        <div style={{ position: "absolute", bottom: 100, right: -80, width: 300, height: 300,
          background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)", borderRadius: "50%" }}/>
        {/* Grade sutil */}
        <div style={{ position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(96,239,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(96,239,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px" }}/>
      </div>

      {/* Status Bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, padding: "14px 20px 10px",
        background: "rgba(10,14,30,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Syne', sans-serif", letterSpacing: "-1px" }}>
              Net<span style={{ color: "#60efff" }}>Vision</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "3px", marginTop: 1 }}>NETWORK DIAGNOSTICS</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
              background: "rgba(0,255,135,0.08)", borderRadius: 20, border: "1px solid rgba(0,255,135,0.2)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff87",
                boxShadow: "0 0 6px #00ff87", animation: "pulse 2s infinite" }}/>
              <span style={{ fontSize: 11, color: "#00ff87", fontWeight: 700 }}>ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div style={{ flex: 1, overflowY: "auto", zIndex: 1, position: "relative", animation: "fadeIn 0.3s ease" }}>
        {activeTab === "dashboard" && <DashboardTab wifiInfo={wifiInfo} signalHistory={signalHistory} speedData={speedData}/>}
        {activeTab === "devices" && <DevicesTab scanning={scanning} onScan={handleScan}/>}
        {activeTab === "diagnostics" && <DiagnosticsTab wifiInfo={wifiInfo}/>}
        {activeTab === "speed" && <SpeedTab speedData={speedData} onTest={handleSpeedTest} testing={speedTesting}/>}
        {activeTab === "security" && <SecurityTab wifiInfo={wifiInfo}/>}
      </div>

      {/* Bottom Navigation */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(10,14,30,0.95)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 0 16px",
        display: "flex", justifyContent: "space-around" }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const c = isActive ? "#60efff" : "rgba(255,255,255,0.3)";
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}>
              {isActive && (
                <div style={{ position: "absolute", width: 40, height: 2, background: "#60efff",
                  borderRadius: 2, top: 0, boxShadow: "0 0 8px #60efff", marginTop: -8 }}/>
              )}
              {tab.icon(20, c)}
              <span style={{ fontSize: 9, color: c, letterSpacing: "0.5px", fontWeight: isActive ? 700 : 400, transition: "color 0.2s" }}>
                {tab.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ESTILOS GLOBAIS (Glassmorfismo + Dark Mode Premium)
// ============================================================
const styles = {
  app: {
    minHeight: "100vh",
    maxWidth: 430,
    margin: "0 auto",
    background: "linear-gradient(160deg, #0a0e1e 0%, #0d1428 40%, #0a0f20 100%)",
    fontFamily: "'Space Mono', 'Syne', monospace",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflowX: "hidden",
  },
  glassCard: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: "18px 16px",
    marginTop: 14,
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  cardTitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "2px",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  actionBtn: {
    padding: "8px 14px",
    borderRadius: 12,
    border: "1px solid rgba(96,239,255,0.2)",
    cursor: "pointer",
    background: "rgba(96,239,255,0.08)",
  },
};
