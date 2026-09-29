'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Shield, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileWarning, 
  Search, 
  ExternalLink, 
  Download,
  Filter,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useNetworkCentral } from '@/context/NetworkCentralContext';
import { NetworkNode, SiteAuditStatus } from '@/types/network';
import { AuditStatusBadge } from './AuditStatusBadge';

interface CentralAuditDashboardModalProps {
  onClose: () => void;
  onFlyToNode: (node: NetworkNode) => void;
}

export const CentralAuditDashboardModal: React.FC<CentralAuditDashboardModalProps> = ({
  onClose,
  onFlyToNode
}) => {
  const { nodes, stats, currentUser } = useNetworkCentral();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SiteAuditStatus | 'all'>('all');

  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchesSearch = 
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.province.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || n.auditStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [nodes, searchTerm, statusFilter]);

  const handleExportNationalReport = () => {
    const headers = [
      'ID Puesto',
      'Puesto / Nodo',
      'Ciudad',
      'Provincia',
      'Estado Auditoría',
      'Tiene Esquema Visio',
      'Archivo Visio',
      'Versión Visio',
      'Total Materiales Registrados',
      'Mejoras Propuestas',
      'Última Auditoría',
      'Auditado Por'
    ];

    const rows = nodes.map(n => [
      n.id,
      `"${n.name.replace(/"/g, '""')}"`,
      `"${n.city.replace(/"/g, '""')}"`,
      `"${n.province.replace(/"/g, '""')}"`,
      n.auditStatus,
      n.diagram ? 'SÍ' : 'NO',
      `"${(n.diagram?.vsdxFileName || 'N/A').replace(/"/g, '""')}"`,
      `"${(n.diagram?.version || 'N/A').replace(/"/g, '""')}"`,
      n.inventory ? n.inventory.length : 0,
      n.improvements ? n.improvements.length : 0,
      n.lastAuditedAt || 'Pendiente',
      `"${(n.auditedBy || 'Sin asignar').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_auditoria_redes_nacional_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 90,
      backgroundColor: 'rgba(6, 9, 17, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '1000px',
        maxWidth: '100%',
        maxHeight: '90vh',
        background: 'rgba(13, 19, 33, 0.95)',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        borderRadius: '20px',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 242, 254, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#060911'
            }}>
              <Shield size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                Servidor Central • Tablero de Auditoría y Control de Puestos
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                Monitoreo de recepción de esquemas de Visio, planillas de materiales y mejoras técnicas
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportNationalReport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10b981',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Exportar Informe Nacional (.csv)</span>
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
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Puestos Totales</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
              {stats.totalSites}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>En todo el país</div>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#10b981', textTransform: 'uppercase' }}>Homologados</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
              {stats.approvedSites}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              {Math.round((stats.approvedSites / stats.totalSites) * 100)}% de cumplimiento
            </div>
          </div>

          <div style={{
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase' }}>En Revisión</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
              {stats.underReviewSites}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Pendientes de dictamen</div>
          </div>

          <div style={{
            background: 'rgba(251, 146, 60, 0.06)',
            border: '1px solid rgba(251, 146, 60, 0.25)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#fb923c', textTransform: 'uppercase' }}>Con Observaciones</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#fb923c', marginTop: '2px' }}>
              {stats.actionRequiredSites}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Requieren adecuación</div>
          </div>

          <div style={{
            background: 'rgba(244, 63, 94, 0.06)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#f43f5e', textTransform: 'uppercase' }}>Sin Documentación</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#f43f5e', marginTop: '2px' }}>
              {stats.pendingSubmissionSites}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Falta Visio / Excel</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input
              type="text"
              placeholder="Buscar por puesto, ciudad o provincia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'approved', 'under_review', 'action_required', 'pending_submission'] as (SiteAuditStatus | 'all')[]).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: statusFilter === st ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: statusFilter === st ? '#00f2fe' : '#94a3b8',
                  border: statusFilter === st ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {st === 'all' ? 'Todos los Puestos' : st === 'approved' ? 'Homologados' : st === 'under_review' ? 'En Revisión' : st === 'action_required' ? 'Observados' : 'Pendientes'}
              </button>
            ))}
          </div>
        </div>

        {/* National Site Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                position: 'sticky',
                top: 0,
                zIndex: 2
              }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Puesto / Ubicación</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Estado Auditoría</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Esquema Visio</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Materiales (Excel)</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Mejoras</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Último Dictamen</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map((node, idx) => (
                <tr
                  key={node.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                  }}
                >
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{node.city}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{node.name} • {node.province}</div>
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    <AuditStatusBadge status={node.auditStatus} size="sm" />
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    {node.diagram ? (
                      <div>
                        <div style={{ color: '#00f2fe', fontSize: '11px', fontWeight: 500 }}>
                          {node.diagram.vsdxFileName}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          {node.diagram.version} • {node.diagram.vsdxFileSize}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#f43f5e', fontSize: '11px' }}>No remitido</span>
                    )}
                  </td>

                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {node.inventory && node.inventory.length > 0 ? (
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {node.inventory.length} ítems
                      </span>
                    ) : (
                      <span style={{ color: '#f43f5e', fontSize: '11px' }}>0 ítems</span>
                    )}
                  </td>

                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {node.improvements && node.improvements.length > 0 ? (
                      <span style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {node.improvements.length} mejoras
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '11px' }}>0</span>
                    )}
                  </td>

                  <td style={{ padding: '10px 12px', fontSize: '11px', color: '#94a3b8' }}>
                    {node.lastAuditedAt ? (
                      <div>
                        <div style={{ color: '#cbd5e1' }}>{node.lastAuditedAt}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{node.auditedBy}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#64748b' }}>Sin auditar</span>
                    )}
                  </td>

                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      onClick={() => onFlyToNode(node)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(0, 242, 254, 0.15)',
                        border: '1px solid rgba(0, 242, 254, 0.35)',
                        color: '#00f2fe',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <span>Inspeccionar</span>
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
