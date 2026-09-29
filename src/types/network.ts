export type NodeType = 
  | 'submarine_cable' 
  | 'datacenter' 
  | 'core_backbone' 
  | '5g_tower' 
  | 'energy_hub';

export type NodeStatus = 'operational' | 'degraded' | 'maintenance';

export type SiteAuditStatus = 
  | 'pending_submission'   // Puesto pendiente de enviar Visio/Excel
  | 'under_review'          // Enviado, en revisión por el servidor central
  | 'action_required'       // Auditado pero requiere mejoras o correcciones
  | 'approved';             // Esquema y materiales aprobados y vigentes

export interface InventoryItem {
  id: string;
  category: 'networking' | 'servers' | 'cabling' | 'power' | 'racks' | 'peripherals';
  name: string;
  model: string;
  quantity: number;
  serialNumber?: string;
  condition: 'active' | 'spare' | 'faulty';
  rackLocation?: string;
  notes?: string;
}

export type DiagramFileType = 
  | 'image'    // PNG, JPG, JPEG, WEBP, GIF, etc.
  | 'svg'      // SVG vectorial
  | 'drawio'   // Diagramas de Draw.io (.drawio, .drawio.xml, .dio)
  | 'xml'      // Esquema o especificación XML
  | 'visio'    // Microsoft Visio (.vsdx, .vsd)
  | 'pdf'      // Plano o esquema en PDF
  | 'other';

export interface NetworkDiagram {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: DiagramFileType;
  fileData?: string; // Data URL Base64 para compatibilidad previa
  fileUrl?: string;  // Ruta permanente física en el servidor local (ej: /uploads/diagrams/...)
  mimeType?: string;
  vsdxFileName: string; // Compatibilidad previa con Visio
  vsdxFileSize: string;
  svgContent?: string;
  imageUrl?: string;
  xmlContent?: string;
  version: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}

export interface NetworkImprovement {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'security' | 'redundancy' | 'expansion' | 'hardware';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'proposed' | 'in_progress' | 'implemented';
  proposedBy: string;
  proposedAt: string;
  estimatedBudget?: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  city: string;
  province: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: NodeType;
  status: NodeStatus;
  observations?: string; // Observaciones generales y notas de infraestructura del puesto
  connectedTo: string[];
  description: string;
  
  // Campos de telemetría (opcionales / no requeridos en el registro de puestos de red)
  capacity?: string;
  latency?: number; // in ms
  uptime?: string;
  asn?: string;
  hardware?: string;
  cooling?: string;
  powerBackup?: string;
  trafficUsage?: number; // percentage 0-100
  
  // Módulo de Auditoría y Control Central (Materiales y Esquemas)
  auditStatus: SiteAuditStatus;
  lastAuditedAt?: string;
  auditedBy?: string;
  diagram?: NetworkDiagram;
  inventory: InventoryItem[];
  improvements: NetworkImprovement[];
}

export interface NetworkLink {
  id: string;
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
  type: 'submarine' | 'primary_fiber' | 'secondary_fiber';
  capacity: string;
  status: 'active' | 'standby';
  latency: number;
  coordinates: [[number, number], [number, number]];
  distanceKm?: number;
}

export type MapStyleMode = 'dark' | 'light' | 'voyager';

export type UserRole = 'admin' | 'operator';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  assignedSiteId?: string;
}

export interface FilterState {
  searchQuery: string;
  types: NodeType[];
  status: NodeStatus | 'all';
  auditStatus: SiteAuditStatus | 'all';
  maxLatency: number;
}
