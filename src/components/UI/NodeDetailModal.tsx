'use client';

import React, { useState } from 'react';
import { 
  X, 
  Navigation2, 
  Share2, 
  CheckCircle2, 
  FileCode, 
  FileSpreadsheet, 
  Lightbulb, 
  Info,
  FileText,
  MapPin,
  Trash2,
  QrCode
} from 'lucide-react';
import { NetworkNode, NetworkLink } from '@/types/network';
import { AuditStatusBadge } from '@/components/Audit/AuditStatusBadge';
import { VisioDiagramViewer } from '@/components/Audit/VisioDiagramViewer';
import { InventoryExcelTable } from '@/components/Audit/InventoryExcelTable';
import { ImprovementsList } from '@/components/Audit/ImprovementsList';
import { UploadAuditModal } from '@/components/Audit/UploadAuditModal';
import { NodeQRCodeModal } from '@/components/Audit/NodeQRCodeModal';
import { useNetworkCentral } from '@/context/NetworkCentralContext';

interface NodeDetailModalProps {
  node: NetworkNode;
  allNodes: NetworkNode[];
  links: NetworkLink[];
  initialTab?: TabType;
  onClose: () => void;
  onFlyTo: (coords: [number, number], zoom?: number) => void;
  onSelectNode: (node: NetworkNode) => void;
}

type TabType = 'info' | 'visio' | 'excel' | 'improvements';

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  node,
  allNodes,
  links,
  initialTab = 'info',
  onClose,
  onFlyTo,
  onSelectNode,
}) => {
  const { 
    currentUser, 
    deleteNode, 
    setIsLinkModalOpen, 
    setLinkDefaultSourceId, 
    deleteLink 
  } = useNetworkCentral();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Sincronizar initialTab si cambia desde la URL
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Find links connected to this node
  const connectedLinks = links.filter(
    l => l.sourceId === node.id || l.targetId === node.id
  );

  return (
    <>
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        width: '560px',
        maxWidth: 'calc(100vw - 48px)',
        maxHeight: 'calc(100vh - 120px)',
        zIndex: 25,
        borderRadius: '20px',
        background: 'rgba(11, 16, 28, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 242, 254, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Top accent bar */}
        <div style={{
          height: '3px',
          width: '100%',
          background: 'linear-gradient(90deg, #00f2fe, #3b82f6, #a855f7)'
        }} />

        {/* Modal Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#00f2fe',
                  background: 'rgba(0, 242, 254, 0.12)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {node.province}
                </span>

                <AuditStatusBadge status={node.auditStatus} size="sm" />

                <span style={{ fontSize: '11px', color: '#64748b' }}>{node.asn}</span>
              </div>

              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: '4px',
                lineHeight: 1.3
              }}>
                {node.name}
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {node.city}, Argentina • [{node.coordinates[1].toFixed(4)}°, {node.coordinates[0].toFixed(4)}°]
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => {
                  if (confirm(`¿Desea eliminar el puesto "${node.name || 'Sin Nombre'}" (${node.city || 'Sin Ciudad'}) de la base central de la red?`)) {
                    deleteNode(node.id);
                    onClose();
                  }
                }}
                title="Eliminar este puesto de la red"
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  color: '#f43f5e',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.15)';
                }}
              >
                <Trash2 size={15} />
              </button>

              <button
                onClick={() => setShowQRModal(true)}
                title="Generar Código QR de Rack y Ficha Técnica Imprimible"
                style={{
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  color: '#00f2fe',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 242, 254, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 242, 254, 0.15)';
                }}
              >
                <QrCode size={16} />
              </button>

              <button
                onClick={() => onFlyTo(node.coordinates, 8.5)}
                title="Volar cámara 3D hacia este puesto"
                style={{
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  color: '#00f2fe',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Navigation2 size={15} />
              </button>

              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '6px',
            marginTop: '14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '2px'
          }}>
            <button
              onClick={() => setActiveTab('info')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'info' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                borderBottom: activeTab === 'info' ? '2px solid #00f2fe' : '2px solid transparent',
                color: activeTab === 'info' ? '#00f2fe' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Info size={13} />
              <span>Información General</span>
            </button>

            <button
              onClick={() => setActiveTab('visio')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'visio' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                borderBottom: activeTab === 'visio' ? '2px solid #00f2fe' : '2px solid transparent',
                color: activeTab === 'visio' ? '#00f2fe' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FileCode size={13} />
              <span>Esquema de Red</span>
            </button>

            <button
              onClick={() => setActiveTab('excel')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'excel' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                borderBottom: activeTab === 'excel' ? '2px solid #00f2fe' : '2px solid transparent',
                color: activeTab === 'excel' ? '#00f2fe' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FileSpreadsheet size={13} />
              <span>Planilla Materiales ({node.inventory?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('improvements')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === 'improvements' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                borderBottom: activeTab === 'improvements' ? '2px solid #00f2fe' : '2px solid transparent',
                color: activeTab === 'improvements' ? '#00f2fe' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Lightbulb size={13} />
              <span>Mejoras ({node.improvements?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div style={{
          padding: '16px 22px 20px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* TAB 1: INFORMACIÓN Y OBSERVACIONES */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Observaciones del Puesto */}
              <div style={{
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <FileText size={15} color="#00f2fe" />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Observaciones del Puesto
                  </span>
                </div>
                <p style={{
                  fontSize: '12.5px',
                  color: (node.observations || node.description) ? '#e2e8f0' : '#64748b',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}>
                  {node.observations || node.description || 'Sin observaciones registradas para este puesto.'}
                </p>
              </div>

              {/* Ficha Resumen de Estado */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Ubicación Administrativa</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                    {node.city}, {node.province}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    [{node.coordinates[1].toFixed(4)}°, {node.coordinates[0].toFixed(4)}°]
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Auditoría y Validación</div>
                  <div style={{ marginTop: '4px' }}>
                    <AuditStatusBadge status={node.auditStatus} size="sm" />
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                    {node.lastAuditedAt ? `Actualizado: ${node.lastAuditedAt}` : 'Pendiente de homologación'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Esquema de Red</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: node.diagram ? '#00f2fe' : '#f59e0b', marginTop: '2px' }}>
                    {node.diagram ? node.diagram.title : 'Sin esquema adjunto'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {node.diagram ? `${node.diagram.fileName} (${node.diagram.fileSize})` : 'Cargar en pestaña Esquema'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Inventario de Materiales</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', marginTop: '2px' }}>
                    {node.inventory?.length || 0} ítems cargados
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Planilla editable en pestaña Materiales
                  </div>
                </div>
              </div>

              {/* Connected Interconnects */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Enlaces de Red / Puestos Conectados ({connectedLinks.length})
                  </div>
                  <button
                    onClick={() => {
                      setLinkDefaultSourceId(node.id);
                      setIsLinkModalOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.22)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
                    }}
                  >
                    <Share2 size={11} />
                    <span>+ Conectar Puesto</span>
                  </button>
                </div>

                {connectedLinks.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '11px'
                  }}>
                    Este puesto no posee enlaces directos configurados todavía.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {connectedLinks.map((link) => {
                      const otherNodeId = link.sourceId === node.id ? link.targetId : link.sourceId;
                      const otherNode = allNodes.find(n => n.id === otherNodeId);
                      if (!otherNode) return null;

                      return (
                        <div
                          key={link.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 8px',
                            borderRadius: '7px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '11px'
                          }}
                        >
                          <button
                            onClick={() => {
                              onSelectNode(otherNode);
                              onFlyTo(otherNode.coordinates, 8);
                            }}
                            title={`Volar a ${otherNode.city}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                              padding: 0
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#00f2fe';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#cbd5e1';
                            }}
                          >
                            <Share2 size={11} color="#00f2fe" />
                            <span style={{ fontWeight: 600 }}>{otherNode.city}</span>
                            {link.capacity && (
                              <span style={{ color: '#64748b', fontSize: '10px' }}>({link.capacity})</span>
                            )}
                          </button>

                          {currentUser.role === 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`¿Desconectar el enlace entre ${node.city} y ${otherNode.city}?`)) {
                                  deleteLink(link.id);
                                }
                              }}
                              title="Eliminar este enlace"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#f43f5e';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#64748b';
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ESQUEMA VISIO */}
          {activeTab === 'visio' && (
            <VisioDiagramViewer
              node={node}
              onOpenUploadModal={() => setShowUploadModal(true)}
            />
          )}

          {/* TAB 3: PLANILLA DE MATERIALES EXCEL */}
          {activeTab === 'excel' && (
            <InventoryExcelTable node={node} />
          )}

          {/* TAB 4: MEJORAS TÉCNICAS */}
          {activeTab === 'improvements' && (
            <ImprovementsList node={node} />
          )}
        </div>
      </div>

      {/* Upload Diagram Modal */}
      {showUploadModal && (
        <UploadAuditModal
          node={node}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* QR Code and Printable Rack Sheet Modal */}
      {showQRModal && (
        <NodeQRCodeModal
          node={node}
          onClose={() => setShowQRModal(false)}
          defaultTab={activeTab === 'visio' ? 'visio' : activeTab === 'excel' ? 'inventory' : 'visio'}
        />
      )}
    </>
  );
};
