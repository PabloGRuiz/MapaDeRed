'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Tag, 
  DollarSign, 
  User, 
  Calendar 
} from 'lucide-react';
import { NetworkNode, NetworkImprovement } from '@/types/network';
import { useNetworkCentral } from '@/context/NetworkCentralContext';

interface ImprovementsListProps {
  node: NetworkNode;
}

const PRIORITY_CONFIG: Record<NetworkImprovement['priority'], { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Crítica', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)' },
  high: { label: 'Alta', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' },
  medium: { label: 'Media', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
  low: { label: 'Baja', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' }
};

const CATEGORY_NAMES: Record<NetworkImprovement['category'], string> = {
  performance: 'Rendimiento WAN',
  security: 'Seguridad / VLANs',
  redundancy: 'Redundancia & Alta Disp.',
  expansion: 'Ampliación Puestos',
  hardware: 'Renovación Hardware'
};

export const ImprovementsList: React.FC<ImprovementsListProps> = ({ node }) => {
  const { currentUser, addImprovement, updateImprovementStatus } = useNetworkCentral();
  const [showAddForm, setShowAddForm] = useState(false);

  const [newImp, setNewImp] = useState({
    title: '',
    description: '',
    category: 'redundancy' as NetworkImprovement['category'],
    priority: 'medium' as NetworkImprovement['priority'],
    status: 'proposed' as NetworkImprovement['status'],
    estimatedBudget: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImp.title.trim() || !newImp.description.trim()) return;

    addImprovement(node.id, newImp);
    setNewImp({
      title: '',
      description: '',
      category: 'redundancy',
      priority: 'medium',
      status: 'proposed',
      estimatedBudget: ''
    });
    setShowAddForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
      {/* Header bar with Add Improvement button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 0'
      }}>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Planes de optimización y adecuaciones técnicas detectadas durante la auditoría:
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: showAddForm ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 242, 254, 0.15)',
            border: showAddForm ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 242, 254, 0.4)',
            color: showAddForm ? '#fff' : '#00f2fe',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={13} />
          <span>{showAddForm ? 'Cancelar' : 'Proponer Mejora'}</span>
        </button>
      </div>

      {/* Formulario de nueva mejora */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(0, 242, 254, 0.05)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#00f2fe', textTransform: 'uppercase' }}>
            Registrar Propuesta de Mejora Técnica
          </div>

          <input
            type="text"
            placeholder="Título (ej: Instalar segundo enlace WAN de fibra / Starlink)"
            required
            value={newImp.title}
            onChange={(e) => setNewImp({ ...newImp, title: e.target.value })}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontSize: '12px',
              outline: 'none'
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <select
              value={newImp.category}
              onChange={(e) => setNewImp({ ...newImp, category: e.target.value as NetworkImprovement['category'] })}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                background: '#0b101c',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                fontSize: '11px',
                outline: 'none'
              }}
            >
              {Object.keys(CATEGORY_NAMES).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_NAMES[cat as NetworkImprovement['category']]}
                </option>
              ))}
            </select>

            <select
              value={newImp.priority}
              onChange={(e) => setNewImp({ ...newImp, priority: e.target.value as NetworkImprovement['priority'] })}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                background: '#0b101c',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                fontSize: '11px',
                outline: 'none'
              }}
            >
              <option value="critical">Prioridad Crítica</option>
              <option value="high">Prioridad Alta</option>
              <option value="medium">Prioridad Media</option>
              <option value="low">Prioridad Baja</option>
            </select>

            <input
              type="text"
              placeholder="Presupuesto Estimado"
              value={newImp.estimatedBudget}
              onChange={(e) => setNewImp({ ...newImp, estimatedBudget: e.target.value })}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '11px',
                outline: 'none'
              }}
            />
          </div>

          <textarea
            placeholder="Descripción técnica del problema detectado y justificación de la solución propuesta..."
            required
            rows={3}
            value={newImp.description}
            onChange={(e) => setNewImp({ ...newImp, description: e.target.value })}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontSize: '11px',
              outline: 'none',
              resize: 'vertical'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="submit"
              style={{
                background: '#00f2fe',
                color: '#060911',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 16px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Guardar Propuesta
            </button>
          </div>
        </form>
      )}

      {/* Improvements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
        {(!node.improvements || node.improvements.length === 0) ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: '#64748b',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '12px'
          }}>
            <Lightbulb size={20} color="#64748b" style={{ margin: '0 auto 6px' }} />
            No hay mejoras pendientes registradas para este puesto.
          </div>
        ) : (
          node.improvements.map((imp) => {
            const prioCfg = PRIORITY_CONFIG[imp.priority] || PRIORITY_CONFIG.medium;
            return (
              <div
                key={imp.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: `1px solid ${imp.priority === 'critical' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: prioCfg.color,
                        background: prioCfg.bg,
                        border: `1px solid ${prioCfg.border}`,
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {prioCfg.label}
                      </span>

                      <span style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {CATEGORY_NAMES[imp.category] || imp.category}
                      </span>

                      {imp.estimatedBudget && (
                        <span style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <DollarSign size={10} /> {imp.estimatedBudget}
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>
                      {imp.title}
                    </h4>
                  </div>

                  {/* Status selector (Admin can change, Operator sees badge) */}
                  {currentUser.role === 'admin' ? (
                    <select
                      value={imp.status}
                      onChange={(e) => updateImprovementStatus(node.id, imp.id, e.target.value as NetworkImprovement['status'])}
                      style={{
                        padding: '3px 6px',
                        borderRadius: '6px',
                        background: imp.status === 'implemented' ? 'rgba(16, 185, 129, 0.2)' : imp.status === 'in_progress' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${imp.status === 'implemented' ? 'rgba(16, 185, 129, 0.4)' : imp.status === 'in_progress' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
                        color: imp.status === 'implemented' ? '#10b981' : imp.status === 'in_progress' ? '#38bdf8' : '#cbd5e1',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="proposed" style={{ background: '#0b101c', color: '#cbd5e1' }}>Propuesta</option>
                      <option value="in_progress" style={{ background: '#0b101c', color: '#38bdf8' }}>En Progreso</option>
                      <option value="implemented" style={{ background: '#0b101c', color: '#10b981' }}>Implementada</option>
                    </select>
                  ) : (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: imp.status === 'implemented' ? '#10b981' : imp.status === 'in_progress' ? '#38bdf8' : '#cbd5e1',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {imp.status === 'implemented' ? 'Implementada' : imp.status === 'in_progress' ? 'En Progreso' : 'Propuesta'}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  {imp.description}
                </p>

                {/* Footer metadata */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '10px',
                  color: '#64748b',
                  marginTop: '2px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <User size={10} /> {imp.proposedBy}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Calendar size={10} /> {imp.proposedAt}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
