import { InventoryItem, NetworkDiagram, NetworkImprovement, UserProfile } from '../types/network';

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user-admin',
    name: 'Ing. Rodrigo Morales',
    role: 'admin',
    email: 'noc.central@redes-argentina.com.ar',
    department: 'Servidor Central - NOC Infraestructura y Auditoría',
  },
  {
    id: 'user-operator',
    name: 'Téc. Valeria Gómez',
    role: 'operator',
    email: 'puestos.patagonia@redes-argentina.com.ar',
    department: 'Mantenimiento & Soporte Regional',
    assignedSiteId: 'node-bariloche'
  }
];

// Vector SVG template simulating a detailed Visio network topology export
export const SAMPLE_VISIO_SVG_TOPOLOGY = `
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="background:#090d16; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">
  <!-- Grid Background -->
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="100%" stop-color="#0072ff"/>
    </linearGradient>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  
  <rect width="100%" height="100%" fill="#070a12"/>
  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Diagram Header Tag -->
  <rect x="25" y="20" width="340" height="34" rx="6" fill="rgba(0, 242, 254, 0.1)" stroke="rgba(0, 242, 254, 0.3)" stroke-width="1"/>
  <text x="38" y="42" fill="#00f2fe" font-size="12" font-weight="bold">MICROSOFT VISIO 2024 • EXPORT V.3.2</text>
  <text x="700" y="42" fill="#64748b" font-size="11">Topología L2/L3 Puesto Fijo</text>

  <!-- External ISP Cloud -->
  <g transform="translate(60, 160)">
    <path d="M 30 70 A 30 30 0 0 1 70 30 A 40 40 0 0 1 140 30 A 35 35 0 0 1 180 70 A 30 30 0 0 1 150 110 L 40 110 A 30 30 0 0 1 30 70 Z" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="2"/>
    <text x="105" y="70" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">BACKBONE WAN</text>
    <text x="105" y="88" fill="#38bdf8" font-size="10" text-anchor="middle">Fibra Óptica STM-64</text>
    <text x="105" y="130" fill="#94a3b8" font-size="9" text-anchor="middle">IP Gateway: 181.88.204.1/29</text>
  </g>

  <!-- Connection: WAN -> Router Borde -->
  <path d="M 230 220 L 290 220" stroke="#00f2fe" stroke-width="2.5" stroke-dasharray="4,4"/>
  <text x="260" y="212" fill="#00f2fe" font-size="9" text-anchor="middle">SFP+ 10G</text>

  <!-- Router Borde (FortiGate / Cisco ASR) -->
  <g transform="translate(290, 175)">
    <rect width="130" height="90" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#00f2fe" stroke-width="1.8"/>
    <circle cx="20" cy="20" r="5" fill="#10b981"/>
    <text x="32" y="23" fill="#f8fafc" font-size="11" font-weight="bold">RT-BORDE-01</text>
    <text x="15" y="45" fill="#94a3b8" font-size="9">Cisco ASR-1001-X</text>
    <text x="15" y="60" fill="#64748b" font-size="9">BGP AS26461</text>
    <text x="15" y="75" fill="#00f2fe" font-size="8">NAT / IPsec Crypto</text>
  </g>

  <!-- Connection: Router Borde -> Firewall Core -->
  <path d="M 420 220 L 480 220" stroke="#38bdf8" stroke-width="2.5"/>
  <text x="450" y="212" fill="#38bdf8" font-size="9" text-anchor="middle">Trunk LACP</text>

  <!-- Firewall & Core Switch -->
  <g transform="translate(480, 160)">
    <rect width="160" height="120" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#a855f7" stroke-width="2"/>
    <circle cx="22" cy="22" r="5" fill="#10b981"/>
    <text x="35" y="25" fill="#f8fafc" font-size="11" font-weight="bold">SW-CORE-DISTRIB</text>
    <text x="15" y="50" fill="#c084fc" font-size="9">Cisco Catalyst 9300 48P</text>
    <line x1="15" y1="60" x2="145" y2="60" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="15" y="75" fill="#94a3b8" font-size="9">• VLAN 10 (Servidores): 10.10.0.0/24</text>
    <text x="15" y="90" fill="#94a3b8" font-size="9">• VLAN 20 (Operación): 10.20.0.0/24</text>
    <text x="15" y="105" fill="#94a3b8" font-size="9">• VLAN 30 (Cámaras/IoT): 10.30.0.0/24</text>
  </g>

  <!-- Branch lines from Core Switch to Workstations & AP -->
  <!-- Line up to Servers -->
  <path d="M 560 160 L 560 110 L 720 110" stroke="#10b981" stroke-width="2"/>
  <text x="630" y="102" fill="#10b981" font-size="9">VLAN 10 • 10G DAC</text>

  <!-- Line middle to Workstations -->
  <path d="M 640 220 L 720 220" stroke="#f59e0b" stroke-width="2"/>
  <text x="680" y="212" fill="#f59e0b" font-size="9">Cat 6A</text>

  <!-- Line down to WiFi & IoT -->
  <path d="M 560 280 L 560 350 L 720 350" stroke="#00f2fe" stroke-width="2"/>
  <text x="630" y="342" fill="#00f2fe" font-size="9">PoE+ 802.3at</text>

  <!-- Rack de Servidores Locales -->
  <g transform="translate(720, 70)">
    <rect width="145" height="75" rx="8" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" stroke-width="1.5"/>
    <text x="12" y="22" fill="#10b981" font-size="11" font-weight="bold">RACK SERVIDORES</text>
    <text x="12" y="40" fill="#f8fafc" font-size="9">Dell PowerEdge R650</text>
    <text x="12" y="54" fill="#94a3b8" font-size="8">Virtualizador Proxmox VE</text>
    <text x="12" y="68" fill="#64748b" font-size="8">IP: 10.10.0.10 (NTP/DNS/SNMP)</text>
  </g>

  <!-- Puestos de Operación -->
  <g transform="translate(720, 185)">
    <rect width="145" height="75" rx="8" fill="rgba(245, 158, 11, 0.08)" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="12" y="22" fill="#f59e0b" font-size="11" font-weight="bold">PUESTOS DE CONTROL</text>
    <text x="12" y="40" fill="#f8fafc" font-size="9">6x Terminales Operativas</text>
    <text x="12" y="54" fill="#94a3b8" font-size="8">DHCP Pool 10.20.0.50-100</text>
    <text x="12" y="68" fill="#64748b" font-size="8">802.1X Port Security Activo</text>
  </g>

  <!-- WiFi & Telemetría IoT -->
  <g transform="translate(720, 315)">
    <rect width="145" height="75" rx="8" fill="rgba(0, 242, 254, 0.08)" stroke="#00f2fe" stroke-width="1.5"/>
    <text x="12" y="22" fill="#00f2fe" font-size="11" font-weight="bold">WIFI 6 & TELEMETRÍA</text>
    <text x="12" y="40" fill="#f8fafc" font-size="9">2x UniFi U6-Pro APs</text>
    <text x="12" y="54" fill="#94a3b8" font-size="8">WPA3 Enterprise</text>
    <text x="12" y="68" fill="#64748b" font-size="8">Sensores Temp/Humedad IP</text>
  </g>

  <!-- Sub-block: UPS y Energía Respaldo -->
  <g transform="translate(290, 380)">
    <rect width="250" height="90" rx="8" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1"/>
    <text x="15" y="25" fill="#f59e0b" font-size="11" font-weight="bold">⚡ INFRAESTRUCTURA DE ENERGÍA</text>
    <text x="15" y="45" fill="#cbd5e1" font-size="9">UPS Schneider APC Smart-UPS RT 3000VA On-Line</text>
    <text x="15" y="60" fill="#94a3b8" font-size="9">Autonomía estimada: 1h 45m al 60% de carga</text>
    <text x="15" y="75" fill="#10b981" font-size="9">PDU APC Switched AP7921B (8x C13 monitoreables)</text>
  </g>

  <!-- Diagram Legend / Metadata Footer -->
  <g transform="translate(60, 485)">
    <circle cx="5" cy="5" r="4" fill="#00f2fe"/>
    <text x="16" y="9" fill="#94a3b8" font-size="9">Fibra Troncal 10G</text>

    <circle cx="150" cy="5" r="4" fill="#a855f7"/>
    <text x="161" y="9" fill="#94a3b8" font-size="9">Switching L2/L3</text>

    <circle cx="280" cy="5" r="4" fill="#10b981"/>
    <text x="291" y="9" fill="#94a3b8" font-size="9">Servidores Locales</text>

    <circle cx="430" cy="5" r="4" fill="#f59e0b"/>
    <text x="441" y="9" fill="#94a3b8" font-size="9">Cobre UTP Cat 6A</text>
  </g>
</svg>
`;

export const MOCK_INVENTORY_TEMPLATES: Record<string, InventoryItem[]> = {
  standard: [
    {
      id: 'inv-1',
      category: 'networking',
      name: 'Router de Borde WAN',
      model: 'Cisco ASR-1001-X',
      quantity: 1,
      serialNumber: 'FOC2419082X',
      condition: 'active',
      rackLocation: 'Rack 01 - U40-U41',
      notes: 'Licencia IPBase + Security K9 activa. Interfaz SFP+ conectada a proveedor.'
    },
    {
      id: 'inv-2',
      category: 'networking',
      name: 'Switch de Distribución Core PoE+',
      model: 'Cisco Catalyst 9300 48P',
      quantity: 1,
      serialNumber: 'FCW2340B98A',
      condition: 'active',
      rackLocation: 'Rack 01 - U38',
      notes: '48 puertos Gigabit + 4 uplinks SFP28 25G. VLANs 10, 20 y 30 configuradas.'
    },
    {
      id: 'inv-3',
      category: 'networking',
      name: 'Switch de Borde de Respaldo',
      model: 'MikroTik Cloud Router Switch CRS328',
      quantity: 1,
      serialNumber: 'HE3890214-MK',
      condition: 'spare',
      rackLocation: 'Armario de repuestos',
      notes: 'Configurado con imagen idéntica de respaldo en frío ante falla de switch principal.'
    },
    {
      id: 'inv-4',
      category: 'power',
      name: 'UPS On-Line Doble Conversión',
      model: 'APC Smart-UPS RT 3000VA 230V',
      quantity: 1,
      serialNumber: 'AS084112009',
      condition: 'active',
      rackLocation: 'Rack 01 - U01-U04',
      notes: 'Baterías reemplazadas en Marzo 2025. Tarjeta de red SNMP AP9630 activa.'
    },
    {
      id: 'inv-5',
      category: 'power',
      name: 'Unidad de Distribución de Energía (PDU)',
      model: 'APC Switched Rack PDU AP7921B',
      quantity: 2,
      serialNumber: 'ZA19038812',
      condition: 'active',
      rackLocation: 'Rack 01 - Vertical Zero-U',
      notes: 'Monitoreo de corriente por boca habilitado.'
    },
    {
      id: 'inv-6',
      category: 'cabling',
      name: 'Patch Panel Cat 6A Modular',
      model: 'Panduit Mini-Com 48 Puertos',
      quantity: 2,
      condition: 'active',
      rackLocation: 'Rack 01 - U35-U36',
      notes: 'Certificación Fluke Networks aprobada con margen > 4.5 dB.'
    },
    {
      id: 'inv-7',
      category: 'cabling',
      name: 'Módulos Transceiver Ópticos SFP+ 10G-LR',
      model: 'Cisco S-Class SFP-10G-LR-S',
      quantity: 4,
      condition: 'active',
      rackLocation: 'Boca 49-50 SW-01',
      notes: 'Longitud de onda 1310nm monomodo hasta 10km.'
    },
    {
      id: 'inv-8',
      category: 'cabling',
      name: 'Bobina de Cable UTP Cat 6A LSZH',
      model: 'Furukawa GigaLan Cat6A 305m',
      quantity: 2,
      condition: 'spare',
      rackLocation: 'Depósito de Insumos',
      notes: 'Para cableado de ampliaciones futuras de puestos de trabajo.'
    },
    {
      id: 'inv-9',
      category: 'racks',
      name: 'Gabinete Rack Servidores 42U',
      model: 'Schneider NetShelter SX 42U 800mm x 1070mm',
      quantity: 1,
      condition: 'active',
      rackLocation: 'Sala técnica central',
      notes: 'Puerta microperforada, cerradura biométrica y puesta a tierra unificada.'
    },
    {
      id: 'inv-10',
      category: 'networking',
      name: 'Access Point WiFi 6 Empresarial',
      model: 'Ubiquiti UniFi U6-Pro',
      quantity: 3,
      serialNumber: '245A4C-U6PRO',
      condition: 'active',
      rackLocation: 'Montado en cielorraso sala operativa',
      notes: 'Alimentado vía PoE 802.3at desde el switch principal.'
    }
  ]
};

export const MOCK_IMPROVEMENTS_TEMPLATES: Record<string, NetworkImprovement[]> = {
  urgent: [
    {
      id: 'imp-1',
      title: 'Instalación de segundo enlace WAN redundante (Fibra + Starlink)',
      description: 'El puesto actualmente depende de un único hilo de fibra óptica. En caso de corte accidental en ruta, el puesto queda incomunicado. Se sugiere contratar un enlace satelital Starlink Business con failover automático BGP/VRRP.',
      category: 'redundancy',
      priority: 'critical',
      status: 'in_progress',
      proposedBy: 'Ing. Rodrigo Morales (NOC Central)',
      proposedAt: '2026-08-15',
      estimatedBudget: 'USD 1,200'
    },
    {
      id: 'imp-2',
      title: 'Segmentación de Red CCTV en VLAN 30 aislada',
      description: 'El esquema de Visio reportó que las cámaras de seguridad transmiten en la misma subred de las terminales operativas. Se requiere aplicar ACL en el switch para mitigar saturación de broadcast.',
      category: 'security',
      priority: 'high',
      status: 'proposed',
      proposedBy: 'Auditoría Servidor Central',
      proposedAt: '2026-09-02',
      estimatedBudget: 'Sin costo adicional (configuración software)'
    }
  ],
  standard: [
    {
      id: 'imp-3',
      title: 'Migración de módulos SFP+ 10G a 25G en uplink de servidores',
      description: 'El tráfico de telemetría e imágenes sísmicas/satelitales está rozando el 80% del canal. Renovar transceivers a SFP28 25G para evitar encolamiento.',
      category: 'performance',
      priority: 'medium',
      status: 'proposed',
      proposedBy: 'Téc. Valeria Gómez (Puesto Regional)',
      proposedAt: '2026-09-10',
      estimatedBudget: 'USD 850'
    },
    {
      id: 'imp-4',
      title: 'Renovación banco de baterías externo UPS',
      description: 'El pack de baterías cumplirá 3 años en el próximo trimestre. Se recomienda programar la sustitución preventiva antes del periodo estival de altas temperaturas.',
      category: 'hardware',
      priority: 'medium',
      status: 'proposed',
      proposedBy: 'NOC Infraestructura',
      proposedAt: '2026-09-18',
      estimatedBudget: 'USD 600'
    }
  ]
};
