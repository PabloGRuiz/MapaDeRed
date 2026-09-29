'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Server, 
  Anchor, 
  Radio, 
  Cpu, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  ArrowUpRight, 
  SlidersHorizontal,
  Plus,
  RotateCcw,
  Database,
  Trash2
} from 'lucide-react';
import { NetworkNode, NodeType, NodeStatus, FilterState, SiteAuditStatus } from '@/types/network';
import { AuditStatusBadge } from '@/components/Audit/AuditStatusBadge';
import { useNetworkCentral } from '@/context/NetworkCentralContext';

interface SidebarProps {
  nodes: NetworkNode[];
  selectedNode: NetworkNode | null;
  onSelectNode: (node: NetworkNode | null) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  topOffset?: number;
}

const TYPE_CONFIG: Record<NodeType, { label: string; icon: React.ReactNode; color: string }> = {
  submarine_cable: {
    label: 'Cables Submarinos',
    icon: <Anchor size={14} />,
    color: '#00f2fe'
  },
  datacenter: {
    label: 'Data Centers',
    icon: <Server size={14} />,
    color: '#a855f7'
  },
  core_backbone: {
    label: 'Troncal Fibra DWDM',
    icon: <Cpu size={14} />,
    color: '#3b82f6'
  },
  '5g_tower': {
    label: 'Nodos 5G / Edge',
    icon: <Radio size={14} />,
    color: '#f59e0b'
  },
  energy_hub: {
    label: 'Telemetría Renovable',
    icon: <Zap size={14} />,
    color: '#10b981'
  }
};

export const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  filters,
  onFilterChange,
  topOffset,
}) => {
  const { nodes: allDbNodes, setIsWizardOpen, restoreDemoNodes, deleteNode } = useNetworkCentral();
  const [isOpen, setIsOpen] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const toggleType = (type: NodeType) => {
    const isPresent = filters.types.includes(type);
    let newTypes: NodeType[];
    if (isPresent) {
      // Don't allow empty if it's the last one, or allow it
      newTypes = filters.types.filter(t => t !== type);
    } else {
      newTypes = [...filters.types, type];
    }
    onFilterChange({ ...filters, types: newTypes });
  };

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'operational': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'maintenance': return '#f43f5e';
      default: return '#94a3b8';
    }
  };

  const getStatusLabel = (status: NodeStatus) => {
    switch (status) {
      case 'operational': return 'Operativo';
      case 'degraded': return 'Degradado';
      case 'maintenance': return 'Mantenimiento';
      default: return status;
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: topOffset ? `${topOffset}px` : '96px',
      left: '16px',
      bottom: '24px',
      width: isOpen ? '360px' : '48px',
      zIndex: 20,
      transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), top 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      pointerEvents: 'auto'
    }}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Contraer panel' : 'Expandir panel'}
        style={{
          position: 'absolute',
          right: isOpen ? '-14px' : '-14px',
          top: '20px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(0, 242, 254, 0.4)',
          color: '#00f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 30,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          transition: 'all 0.2s ease'
        }}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Main glass container */}
      <div style={{
        flex: 1,
        borderRadius: '16px',
        background: 'rgba(11, 16, 28, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        opacity: isOpen ? 1 : 0.4,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity 0.2s ease'
      }}>
        {isOpen && (
          <>
            {/* Search and Filters Toggle */}
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  placeholder="Buscar ciudad, nodo o provincia..."
                  value={filters.searchQuery}
                  onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(0, 242, 254, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filtros avanzados"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    background: showFilters ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                    color: showFilters ? '#00f2fe' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <SlidersHorizontal size={14} />
                </button>
              </div>

              {/* Advanced Filter Collapsible */}
              {showFilters && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {/* Status Pills */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Estado del nodo
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(['all', 'operational', 'degraded', 'maintenance'] as (NodeStatus | 'all')[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => onFilterChange({ ...filters, status: st })}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            background: filters.status === st ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            color: filters.status === st ? '#00f2fe' : '#94a3b8',
                            border: filters.status === st ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'
                          }}
                        >
                          {st === 'all' ? 'Todos' : getStatusLabel(st as NodeStatus)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audit Status Pills */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Auditoría Visio / Excel
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {([
                        { id: 'all', label: 'Todos' },
                        { id: 'approved', label: 'Homologados' },
                        { id: 'under_review', label: 'En Revisión' },
                        { id: 'action_required', label: 'Observados' },
                        { id: 'pending_submission', label: 'Pendientes' }
                      ] as { id: SiteAuditStatus | 'all'; label: string }[]).map((ast) => (
                        <button
                          key={ast.id}
                          onClick={() => onFilterChange({ ...filters, auditStatus: ast.id })}
                          style={{
                            padding: '3px 7px',
                            borderRadius: '5px',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: filters.auditStatus === ast.id ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            color: filters.auditStatus === ast.id ? '#00f2fe' : '#94a3b8',
                            border: filters.auditStatus === ast.id ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'
                          }}
                        >
                          {ast.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter Chips */}
            <div style={{
              padding: '10px 16px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              scrollbarWidth: 'none'
            }}>
              {(Object.keys(TYPE_CONFIG) as NodeType[]).map((type) => {
                const isSelected = filters.types.includes(type);
                const cfg = TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    style={{
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 9px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: isSelected ? `${cfg.color}15` : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? cfg.color : '#64748b',
                      border: isSelected ? `1px solid ${cfg.color}50` : '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Node List Header */}
            <div style={{
              padding: '10px 16px 6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <span>Puestos Registrados ({nodes.length})</span>
              <span>Provincia</span>
            </div>

            {/* Scrollable Node Cards */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '6px 12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {nodes.length === 0 ? (
                allDbNodes.length === 0 ? (
                  <div style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: 'rgba(0, 242, 254, 0.03)',
                    border: '1px dashed rgba(0, 242, 254, 0.25)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '12px 4px'
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(0, 242, 254, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00f2fe'
                    }}>
                      <Database size={22} />
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                        Base de Datos Limpia
                      </h4>
                      <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: 1.4 }}>
                        Aún no hay puestos registrados en el sistema central. Comience a cargar la información real de su red.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsWizardOpen(true)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
                        border: 'none',
                        color: '#060911',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        marginTop: '4px'
                      }}
                    >
                      <Plus size={14} strokeWidth={3} />
                      <span>+ Crear Primer Puesto</span>
                    </button>

                    <button
                      onClick={() => restoreDemoNodes()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#cbd5e1',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Cargar Datos de Prueba</span>
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '30px 16px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '13px'
                  }}>
                    No se encontraron puestos con los filtros seleccionados.
                  </div>
                )
              ) : (
                nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const typeCfg = TYPE_CONFIG[node.type];
                  const statusCol = getStatusColor(node.status);

                  return (
                    <div
                      key={node.id}
                      onClick={() => onSelectNode(node)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isSelected 
                          ? 'rgba(0, 242, 254, 0.1)' 
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected 
                          ? '1px solid rgba(0, 242, 254, 0.4)' 
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: statusCol,
                              boxShadow: `0 0 8px ${statusCol}`
                            }} />
                            <h3 style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: isSelected ? '#00f2fe' : '#f8fafc',
                              lineHeight: '1.2'
                            }}>
                              {node.city}
                            </h3>
                          </div>
                          <p style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '200px'
                          }}>
                            {node.name}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#00f2fe',
                            background: 'rgba(0, 242, 254, 0.1)',
                            border: '1px solid rgba(0, 242, 254, 0.25)',
                            padding: '2px 7px',
                            borderRadius: '5px'
                          }}>
                            {node.province}
                          </span>
                        </div>
                      </div>

                      {/* Middle row: Audit Status & Visio/Excel Indicators */}
                      <div style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}>
                        <AuditStatusBadge status={node.auditStatus} size="sm" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                          <span style={{ color: node.diagram ? '#00f2fe' : '#f43f5e', fontWeight: 500 }}>
                            {node.diagram ? '📐 Esquema' : '⚠️ Sin Esquema'}
                          </span>
                          <span style={{ color: '#64748b' }}>•</span>
                          <span style={{ color: '#cbd5e1' }}>
                            {node.inventory?.length || 0} mat.
                          </span>
                        </div>
                      </div>

                      {/* Bottom row: Note indicator and Actions */}
                      <div style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          color: node.observations ? '#38bdf8' : '#64748b'
                        }}>
                          {node.observations ? (
                            <span>📝 Con observaciones</span>
                          ) : (
                            <span>📍 Puesto de Red</span>
                          )}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '10px',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            Ficha
                            <ArrowUpRight size={10} color="#00f2fe" />
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Desea eliminar el puesto "${node.name || 'Sin Nombre'}" (${node.city || 'Sin Ciudad'}) de la red?`)) {
                                deleteNode(node.id);
                                if (selectedNode?.id === node.id) {
                                  onSelectNode(null);
                                }
                              }
                            }}
                            title="Eliminar este puesto"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#f43f5e',
                              cursor: 'pointer',
                              padding: '2px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: 0.65,
                              transition: 'opacity 0.15s, background-color 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0.65';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
