'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  NetworkNode, 
  NetworkLink,
  SiteAuditStatus, 
  InventoryItem, 
  NetworkDiagram, 
  NetworkImprovement, 
  UserProfile, 
  UserRole 
} from '@/types/network';
import { NETWORK_NODES, DEMO_NETWORK_NODES, DEMO_NETWORK_LINKS } from '@/data/mockNodes';
import { DEFAULT_USERS, SAMPLE_VISIO_SVG_TOPOLOGY } from '@/data/mockAudits';
import { detectDiagramFileType } from '@/utils/diagramFileHelpers';

interface NetworkCentralContextType {
  currentUser: UserProfile;
  switchUser: (role: UserRole) => void;
  nodes: NetworkNode[];
  selectedNode: NetworkNode | null;
  setSelectedNode: (node: NetworkNode | null) => void;
  isDashboardOpen: boolean;
  setIsDashboardOpen: (open: boolean) => void;
  
  // Asistente de Alta y Selección de Coordenadas en Mapa
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  isPickingLocation: boolean;
  setIsPickingLocation: (picking: boolean) => void;
  pickedCoords: [number, number] | null;
  setPickedCoords: (coords: [number, number] | null) => void;

  // Asistente de Enlaces entre Puestos
  links: NetworkLink[];
  isLinkModalOpen: boolean;
  setIsLinkModalOpen: (open: boolean) => void;
  linkDefaultSourceId: string | null;
  setLinkDefaultSourceId: (id: string | null) => void;
  createLink: (linkData: {
    sourceId: string;
    targetId: string;
    type: NetworkLink['type'];
    capacity: string;
    latency: number;
    status?: 'active' | 'standby';
  }) => NetworkLink | null;
  deleteLink: (linkId: string) => void;

  // Acciones de Gestión de Puestos
  createNode: (nodeData: Omit<NetworkNode, 'id'>) => NetworkNode;
  deleteNode: (nodeId: string) => void;
  clearAllNodes: () => void;
  restoreDemoNodes: () => void;
  updateAuditStatus: (nodeId: string, status: SiteAuditStatus, notes?: string) => void;
  uploadDiagram: (nodeId: string, fileData: {
    title: string;
    fileName?: string;
    fileSize?: string;
    fileType?: import('@/types/network').DiagramFileType;
    fileData?: string;
    fileUrl?: string;
    mimeType?: string;
    vsdxFileName?: string;
    vsdxFileSize?: string;
    svgContent?: string;
    imageUrl?: string;
    xmlContent?: string;
    notes?: string;
  }) => void;
  addInventoryItem: (nodeId: string, item: Omit<InventoryItem, 'id'>) => void;
  deleteInventoryItem: (nodeId: string, itemId: string) => void;
  setNodeInventory: (nodeId: string, items: (InventoryItem | Omit<InventoryItem, 'id'>)[], mode?: 'replace' | 'append') => void;
  addImprovement: (nodeId: string, improvement: Omit<NetworkImprovement, 'id' | 'proposedAt' | 'proposedBy'>) => void;
  updateImprovementStatus: (nodeId: string, improvementId: string, status: NetworkImprovement['status']) => void;
  
  // Métricas Consolidadas
  stats: {
    totalSites: number;
    approvedSites: number;
    underReviewSites: number;
    actionRequiredSites: number;
    pendingSubmissionSites: number;
    totalImprovements: number;
    criticalImprovements: number;
  };
}

const NetworkCentralContext = createContext<NetworkCentralContextType | undefined>(undefined);

const STORAGE_KEY = 'red_nacional_nodes_real_v2';
const LINKS_STORAGE_KEY = 'red_nacional_links_real_v2';
const USER_KEY = 'red_nacional_user_profile_v2';

export const NetworkCentralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USERS[0]);
  const [nodes, setNodes] = useState<NetworkNode[]>(NETWORK_NODES);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isPickingLocation, setIsPickingLocation] = useState<boolean>(false);
  const [pickedCoords, setPickedCoords] = useState<[number, number] | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [linkDefaultSourceId, setLinkDefaultSourceId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carga inicial y persistencia en localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedUser) {
        const found = DEFAULT_USERS.find(u => u.role === JSON.parse(savedUser));
        if (found) setCurrentUser(found);
      }

      // 1. Carga inicial sincronizada con el servidor local persistente (data/network_nodes.json)
      fetch('/api/nodes')
        .then(res => res.ok ? res.json() : null)
        .then((serverNodes: NetworkNode[] | null) => {
          if (serverNodes && Array.isArray(serverNodes) && serverNodes.length > 0) {
            setNodes(serverNodes);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverNodes));
          } else {
            // Si el servidor local aún no tiene archivo, migrar desde localStorage si existe
            const savedNodes = localStorage.getItem(STORAGE_KEY);
            if (savedNodes) {
              const parsed: NetworkNode[] = JSON.parse(savedNodes);
              const sanitized = parsed.map(n => {
                if (n.diagram && n.diagram.svgContent === SAMPLE_VISIO_SVG_TOPOLOGY && !n.diagram.imageUrl) {
                  const { svgContent, ...restDiagram } = n.diagram;
                  return { ...n, diagram: restDiagram as NetworkDiagram };
                }
                return n;
              });
              setNodes(sanitized);
              // Escribir físicamente en el servidor local
              fetch('/api/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitized)
              }).catch(() => {});
            } else {
              setNodes([]);
            }
          }
        })
        .catch(() => {
          const savedNodes = localStorage.getItem(STORAGE_KEY);
          if (savedNodes) setNodes(JSON.parse(savedNodes));
        });

      // 2. Carga inicial sincronizada de enlaces desde el servidor local (data/network_links.json)
      fetch('/api/links')
        .then(res => res.ok ? res.json() : null)
        .then((serverLinks: NetworkLink[] | null) => {
          if (serverLinks && Array.isArray(serverLinks) && serverLinks.length > 0) {
            setLinks(serverLinks);
            localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(serverLinks));
          } else {
            const savedLinks = localStorage.getItem(LINKS_STORAGE_KEY);
            if (savedLinks) {
              const parsed: NetworkLink[] = JSON.parse(savedLinks);
              setLinks(parsed);
              fetch('/api/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed)
              }).catch(() => {});
            } else {
              setLinks([]);
            }
          }
        })
        .catch(() => {
          const savedLinks = localStorage.getItem(LINKS_STORAGE_KEY);
          if (savedLinks) setLinks(JSON.parse(savedLinks));
        });
    } catch {
      // Ignorar errores en entornos restrictivos
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sincronización en tiempo real entre ventanas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updatedNodes = JSON.parse(e.newValue);
          setNodes(updatedNodes);
          if (selectedNode) {
            const fresh = updatedNodes.find((n: NetworkNode) => n.id === selectedNode.id);
            if (fresh) setSelectedNode(fresh);
          }
        } catch {}
      }

      if (e.key === LINKS_STORAGE_KEY && e.newValue) {
        try {
          const updatedLinks = JSON.parse(e.newValue);
          setLinks(updatedLinks);
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedNode]);

  // Persistir cambios de enlaces físicamente en servidor y localStorage
  const saveLinks = useCallback((newLinks: NetworkLink[]) => {
    setLinks(newLinks);
    try {
      localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(newLinks));
    } catch {}

    // Persistir físicamente en el servidor local (data/network_links.json)
    fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLinks)
    }).catch(err => console.warn('Error al sincronizar enlaces con el servidor:', err));
  }, []);

  // Persistir cambios de puestos físicamente en servidor y localStorage
  const saveNodes = useCallback((newNodes: NetworkNode[]) => {
    setNodes(newNodes);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newNodes));
    } catch {}

    // Persistir físicamente en el servidor local (data/network_nodes.json)
    fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNodes)
    }).catch(err => console.warn('Error al sincronizar puestos con el servidor:', err));

    if (selectedNode) {
      const fresh = newNodes.find(n => n.id === selectedNode.id);
      if (fresh) setSelectedNode(fresh);
      else setSelectedNode(null);
    }
  }, [selectedNode]);

  const switchUser = (role: UserRole) => {
    const user = DEFAULT_USERS.find(u => u.role === role) || DEFAULT_USERS[0];
    setCurrentUser(user);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(role));
    } catch {}
  };

  // Crear nuevo puesto de red
  const createNode = (nodeData: Omit<NetworkNode, 'id'>): NetworkNode => {
    const newNodeId = `node-puesto-${Date.now()}`;
    const newNode: NetworkNode = {
      ...nodeData,
      id: newNodeId
    };

    const updated = [newNode, ...nodes];
    saveNodes(updated);
    setSelectedNode(newNode);
    return newNode;
  };

  // Eliminar un puesto y sus enlaces asociados
  const deleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    saveNodes(updatedNodes);

    // Eliminar también cualquier enlace conectado a este nodo
    const updatedLinks = links.filter(l => l.sourceId !== nodeId && l.targetId !== nodeId);
    saveLinks(updatedLinks);
  };

  // Limpiar toda la base de datos (iniciar completamente en blanco)
  const clearAllNodes = () => {
    saveNodes([]);
    saveLinks([]);
    setSelectedNode(null);
  };

  // Restaurar datos de ejemplo (nodos y enlaces)
  const restoreDemoNodes = () => {
    saveNodes(DEMO_NETWORK_NODES);
    saveLinks(DEMO_NETWORK_LINKS);
    if (DEMO_NETWORK_NODES.length > 0) {
      setSelectedNode(DEMO_NETWORK_NODES[0]);
    }
  };

  // Crear nuevo enlace entre dos puestos
  const createLink = (linkData: {
    sourceId: string;
    targetId: string;
    type: NetworkLink['type'];
    capacity: string;
    latency: number;
    status?: 'active' | 'standby';
  }): NetworkLink | null => {
    const sourceNode = nodes.find(n => n.id === linkData.sourceId);
    const targetNode = nodes.find(n => n.id === linkData.targetId);

    if (!sourceNode || !targetNode) return null;

    // Verificar si ya existe un enlace entre estos dos nodos
    const existing = links.find(
      l => (l.sourceId === linkData.sourceId && l.targetId === linkData.targetId) ||
           (l.sourceId === linkData.targetId && l.targetId === linkData.sourceId)
    );
    if (existing) {
      return existing;
    }

    // Calcular distancia geodésica en km (Fórmula de Haversine)
    const lat1 = sourceNode.coordinates[1];
    const lon1 = sourceNode.coordinates[0];
    const lat2 = targetNode.coordinates[1];
    const lon2 = targetNode.coordinates[0];
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(6371 * c);

    const newLinkId = `link-${sourceNode.id.replace('node-', '')}-${targetNode.id.replace('node-', '')}-${Date.now()}`;
    const newLink: NetworkLink = {
      id: newLinkId,
      sourceId: sourceNode.id,
      targetId: targetNode.id,
      sourceName: sourceNode.city || sourceNode.name,
      targetName: targetNode.city || targetNode.name,
      type: linkData.type,
      capacity: linkData.capacity,
      status: linkData.status || 'active',
      latency: linkData.latency,
      coordinates: [sourceNode.coordinates, targetNode.coordinates],
      distanceKm
    };

    const updatedLinks = [newLink, ...links];
    saveLinks(updatedLinks);

    // Actualizar connectedTo en ambos nodos
    const updatedNodes = nodes.map(node => {
      if (node.id === sourceNode.id && !node.connectedTo.includes(targetNode.id)) {
        return { ...node, connectedTo: [...node.connectedTo, targetNode.id] };
      }
      if (node.id === targetNode.id && !node.connectedTo.includes(sourceNode.id)) {
        return { ...node, connectedTo: [...node.connectedTo, sourceNode.id] };
      }
      return node;
    });
    saveNodes(updatedNodes);

    return newLink;
  };

  // Eliminar un enlace existente
  const deleteLink = (linkId: string) => {
    const linkToDelete = links.find(l => l.id === linkId);
    const updatedLinks = links.filter(l => l.id !== linkId);
    saveLinks(updatedLinks);

    if (linkToDelete) {
      const updatedNodes = nodes.map(node => {
        if (node.id === linkToDelete.sourceId) {
          return { ...node, connectedTo: node.connectedTo.filter(id => id !== linkToDelete.targetId) };
        }
        if (node.id === linkToDelete.targetId) {
          return { ...node, connectedTo: node.connectedTo.filter(id => id !== linkToDelete.sourceId) };
        }
        return node;
      });
      saveNodes(updatedNodes);
    }
  };

  // Actualizar estado de auditoría
  const updateAuditStatus = (nodeId: string, status: SiteAuditStatus, notes?: string) => {
    const updated = nodes.map(node => {
      if (node.id !== nodeId) return node;

      const now = new Date().toISOString().split('T')[0];
      return {
        ...node,
        auditStatus: status,
        lastAuditedAt: now,
        auditedBy: `${currentUser.name} (${currentUser.role === 'admin' ? 'Servidor Central' : 'Puesto Regional'})`,
        diagram: node.diagram ? {
          ...node.diagram,
          notes: notes || node.diagram.notes
        } : node.diagram
      };
    });

    saveNodes(updated);
  };

  // Subir o actualizar diagrama de red (múltiples formatos soportados)
  const uploadDiagram = (
    nodeId: string,
    fileData: {
      title: string;
      fileName?: string;
      fileSize?: string;
      fileType?: import('@/types/network').DiagramFileType;
      fileData?: string;
      fileUrl?: string;
      mimeType?: string;
      vsdxFileName?: string;
      vsdxFileSize?: string;
      svgContent?: string;
      imageUrl?: string;
      xmlContent?: string;
      notes?: string;
    }
  ) => {
    const now = new Date().toISOString().split('T')[0];
    const resolvedFileName = fileData.fileName || fileData.vsdxFileName || `esquema_${nodeId}`;
    const resolvedFileSize = fileData.fileSize || fileData.vsdxFileSize || '1.2 MB';
    const resolvedFileType = fileData.fileType || detectDiagramFileType(resolvedFileName, fileData.mimeType);

    const updated = nodes.map(node => {
      if (node.id !== nodeId) return node;

      const newDiagram: NetworkDiagram = {
        id: `diag-${Date.now()}`,
        title: fileData.title,
        fileName: resolvedFileName,
        fileSize: resolvedFileSize,
        fileType: resolvedFileType,
        fileData: fileData.fileData,
        fileUrl: fileData.fileUrl || (fileData.imageUrl?.startsWith('/uploads/') ? fileData.imageUrl : undefined),
        mimeType: fileData.mimeType,
        vsdxFileName: resolvedFileName,
        vsdxFileSize: resolvedFileSize,
        svgContent: fileData.svgContent,
        imageUrl: fileData.imageUrl,
        xmlContent: fileData.xmlContent,
        version: node.diagram ? `v${(parseFloat(node.diagram.version.replace(/[^0-9.]/g, '')) + 0.1).toFixed(1)}` : 'v1.0',
        uploadedAt: now,
        uploadedBy: currentUser.name,
        notes: fileData.notes
      };

      const newAuditStatus = node.auditStatus === 'pending_submission' ? 'under_review' : node.auditStatus;

      const updatedNode = {
        ...node,
        auditStatus: newAuditStatus,
        diagram: newDiagram
      };

      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(updatedNode);
      }

      return updatedNode;
    });

    saveNodes(updated);
  };

  // Agregar ítem de inventario
  const addInventoryItem = (nodeId: string, itemData: Omit<InventoryItem, 'id'>) => {
    const updated = nodes.map(node => {
      if (node.id !== nodeId) return node;

      const newItem: InventoryItem = {
        ...itemData,
        id: `inv-${Date.now()}`
      };

      return {
        ...node,
        inventory: [newItem, ...node.inventory]
      };
    });

    saveNodes(updated);
  };

  // Eliminar ítem de inventario
  const deleteInventoryItem = (nodeId: string, itemId: string) => {
    const updated = nodes.map(node => {
      if (node.id !== nodeId) return node;
      return {
        ...node,
        inventory: node.inventory.filter(i => i.id !== itemId)
      };
    });

    saveNodes(updated);
  };

  // Reemplazar o anexar inventario en lote (importación de Excel)
  const setNodeInventory = (
    nodeId: string,
    items: (InventoryItem | Omit<InventoryItem, 'id'>)[],
    mode: 'replace' | 'append' = 'replace'
  ) => {
    const updated = nodes.map(node => {
      if (node.id !== nodeId) return node;

      const preparedItems: InventoryItem[] = items.map((it, idx) => ({
        ...it,
        id: ('id' in it && it.id) ? it.id : `inv-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`
      }));

      const finalInventory = mode === 'replace'
        ? preparedItems
        : [...preparedItems, ...(node.inventory || [])];

      const updatedNode = {
        ...node,
        inventory: finalInventory
      };

      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(updatedNode);
      }

      return updatedNode;
    });

    saveNodes(updated);
  };

  // Proponer mejora
  const addImprovement = (
    nodeId: string,
    improvementData: Omit<NetworkImprovement, 'id' | 'proposedAt' | 'proposedBy'>
  ) => {
    const now = new Date().toISOString().split('T')[0];
    const updated = nodes.map(node => {
      if (node.id !== nodeId) return node;

      const newImp: NetworkImprovement = {
        ...improvementData,
        id: `imp-${Date.now()}`,
        proposedAt: now,
        proposedBy: `${currentUser.name} (${currentUser.department})`
      };

      return {
        ...node,
        improvements: [newImp, ...node.improvements]
      };
    });

    saveNodes(updated);
  };

  // Actualizar estado de una mejora
  const updateImprovementStatus = (nodeId: string, improvementId: string, status: NetworkImprovement['status']) => {
    const updated = nodes.map(node => {
      if (node.id !== nodeId) return node;

      return {
        ...node,
        improvements: node.improvements.map(imp => {
          if (imp.id !== improvementId) return imp;
          return { ...imp, status };
        })
      };
    });

    saveNodes(updated);
  };

  // Métricas Consolidadas
  const stats = {
    totalSites: nodes.length,
    approvedSites: nodes.filter(n => n.auditStatus === 'approved').length,
    underReviewSites: nodes.filter(n => n.auditStatus === 'under_review').length,
    actionRequiredSites: nodes.filter(n => n.auditStatus === 'action_required').length,
    pendingSubmissionSites: nodes.filter(n => n.auditStatus === 'pending_submission').length,
    totalImprovements: nodes.reduce((acc, n) => acc + (n.improvements?.length || 0), 0),
    criticalImprovements: nodes.reduce(
      (acc, n) => acc + (n.improvements?.filter(i => i.priority === 'critical').length || 0), 
      0
    )
  };

  return (
    <NetworkCentralContext.Provider
      value={{
        currentUser,
        switchUser,
        nodes,
        selectedNode,
        setSelectedNode,
        isDashboardOpen,
        setIsDashboardOpen,
        isWizardOpen,
        setIsWizardOpen,
        isPickingLocation,
        setIsPickingLocation,
        pickedCoords,
        setPickedCoords,
        links,
        isLinkModalOpen,
        setIsLinkModalOpen,
        linkDefaultSourceId,
        setLinkDefaultSourceId,
        createLink,
        deleteLink,
        createNode,
        deleteNode,
        clearAllNodes,
        restoreDemoNodes,
        updateAuditStatus,
        uploadDiagram,
        addInventoryItem,
        deleteInventoryItem,
        setNodeInventory,
        addImprovement,
        updateImprovementStatus,
        stats
      }}
    >
      {children}
    </NetworkCentralContext.Provider>
  );
};

export const useNetworkCentral = () => {
  const context = useContext(NetworkCentralContext);
  if (!context) {
    throw new Error('useNetworkCentral debe ser usado dentro de un NetworkCentralProvider');
  }
  return context;
};
