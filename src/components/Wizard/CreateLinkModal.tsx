'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Share2, 
  ArrowRight, 
  Zap, 
  Activity, 
  Layers, 
  Anchor, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  Cpu
} from 'lucide-react';
import { useNetworkCentral } from '@/context/NetworkCentralContext';
import { NetworkLink, NetworkNode } from '@/types/network';

interface CreateLinkModalProps {
  onClose: () => void;
  onSuccess?: (link: NetworkLink) => void;
}

export const CreateLinkModal: React.FC<CreateLinkModalProps> = ({
  onClose,
  onSuccess
}) => {
  const { 
    nodes, 
    links, 
    createLink, 
    linkDefaultSourceId, 
    setLinkDefaultSourceId 
  } = useNetworkCentral();

  // Initial source and target selection
  const defaultSource = useMemo(() => {
    if (linkDefaultSourceId && nodes.some(n => n.id === linkDefaultSourceId)) {
      return linkDefaultSourceId;
    }
    return nodes[0]?.id || '';
  }, [linkDefaultSourceId, nodes]);

  const defaultTarget = useMemo(() => {
    const other = nodes.find(n => n.id !== defaultSource);
    return other?.id || '';
  }, [nodes, defaultSource]);

  const [sourceId, setSourceId] = useState<string>(defaultSource);
  const [targetId, setTargetId] = useState<string>(defaultTarget);
  const [type, setType] = useState<NetworkLink['type']>('primary_fiber');
  const [capacity, setCapacity] = useState<string>('40 Gbps');
  const [status, setStatus] = useState<'active' | 'standby'>('active');
  const [customLatency, setCustomLatency] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync default source if changed
  useEffect(() => {
    if (defaultSource) setSourceId(defaultSource);
  }, [defaultSource]);

  // If source changes to match target, find next available target
  const handleSourceChange = (newSourceId: string) => {
    setSourceId(newSourceId);
    if (newSourceId === targetId) {
      const alt = nodes.find(n => n.id !== newSourceId);
      if (alt) setTargetId(alt.id);
    }
    setErrorMsg(null);
  };

  const sourceNode = nodes.find(n => n.id === sourceId);
  const targetNode = nodes.find(n => n.id === targetId);

  // Calculate distance in km
  const distanceKm = useMemo(() => {
    if (!sourceNode || !targetNode) return 0;
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
    return Math.round(6371 * c);
  }, [sourceNode, targetNode]);

  // Estimated latency (approximating 5us / km optical transmission + route factor + router overhead)
  const estimatedLatency = useMemo(() => {
    if (distanceKm === 0) return 2.0;
    const raw = (distanceKm * 0.007) + 1.2;
    return parseFloat(raw.toFixed(1));
  }, [distanceKm]);

  // Check if link already exists
  const isDuplicate = useMemo(() => {
    if (!sourceId || !targetId || sourceId === targetId) return false;
    return links.some(
      l => (l.sourceId === sourceId && l.targetId === targetId) ||
           (l.sourceId === targetId && l.targetId === sourceId)
    );
  }, [links, sourceId, targetId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!sourceNode || !targetNode) {
      setErrorMsg('Debe seleccionar dos puestos válidos.');
      return;
    }

    if (sourceId === targetId) {
      setErrorMsg('El puesto de origen y de destino no pueden ser el mismo.');
      return;
    }

    if (isDuplicate) {
      setErrorMsg('Ya existe un enlace activo o de reserva entre estos dos puestos.');
      return;
    }

    const finalLatency = customLatency ? parseFloat(customLatency) : estimatedLatency;

    const created = createLink({
      sourceId,
      targetId,
      type,
      capacity,
      latency: isNaN(finalLatency) ? estimatedLatency : finalLatency,
      status
    });

    if (created) {
      if (onSuccess) onSuccess(created);
      setLinkDefaultSourceId(null);
      onClose();
    }
  };

  const CAPACITY_PRESETS = ['1 Gbps', '10 Gbps', '40 Gbps', '100 Gbps', '200 Gbps', '400 Gbps'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      backgroundColor: 'rgba(6, 9, 17, 0.82)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        borderRadius: '20px',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 242, 254, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(0, 242, 254, 0.08) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#060911',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)'
            }}>
              <Share2 size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                Conectar Puestos de Red
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                Trazado de troncales de fibra óptica y enlaces interurbanos
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setLinkDefaultSourceId(null);
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
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

        {/* Content Body */}
        {nodes.length < 2 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertCircle size={24} />
            </div>
            <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
              Se requieren al menos 2 puestos registrados
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '12px', maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              Para interconectar la red nacional es necesario que existan al menos dos puestos fijos en el mapa.
            </p>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Visual Route Preview Card */}
            {sourceNode && targetNode && (
              <div style={{
                background: 'rgba(0, 242, 254, 0.04)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Puesto A
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    {sourceNode.city}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {sourceNode.province}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: type === 'submarine' ? '#00f2fe' : type === 'primary_fiber' ? '#38bdf8' : '#c084fc',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    <span>{distanceKm} km</span>
                    <ArrowRight size={14} />
                  </div>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                    ~{customLatency || estimatedLatency} ms
                  </span>
                </div>

                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Puesto B
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    {targetNode.city}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {targetNode.province}
                  </div>
                </div>
              </div>
            )}

            {/* Error banner */}
            {errorMsg && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f43f5e',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Dropdown Selectors: Source and Target */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Puesto Origen
                </label>
                <select
                  value={sourceId}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id} style={{ background: '#0f172a', color: '#fff' }}>
                      {n.city} ({n.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Puesto Destino
                </label>
                <select
                  value={targetId}
                  onChange={(e) => {
                    setTargetId(e.target.value);
                    setErrorMsg(null);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                >
                  {nodes
                    .filter(n => n.id !== sourceId)
                    .map(n => (
                      <option key={n.id} value={n.id} style={{ background: '#0f172a', color: '#fff' }}>
                        {n.city} ({n.name})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Type selector */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Tipo de Enlace
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'primary_fiber', label: 'Troncal DWDM', color: '#38bdf8', icon: <Zap size={14} /> },
                  { id: 'secondary_fiber', label: 'Fibra Secundaria', color: '#c084fc', icon: <Layers size={14} /> },
                  { id: 'submarine', label: 'Cable Submarino', color: '#00f2fe', icon: <Anchor size={14} /> }
                ].map(t => {
                  const isSel = type === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setType(t.id as NetworkLink['type'])}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 8px',
                        borderRadius: '10px',
                        background: isSel ? `${t.color}20` : 'rgba(255, 255, 255, 0.03)',
                        border: isSel ? `1px solid ${t.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSel ? '#fff' : '#94a3b8',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ color: t.color }}>{t.icon}</div>
                      <span style={{ fontSize: '11px', fontWeight: isSel ? 700 : 500 }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Capacity Presets */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Capacidad de Transporte
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CAPACITY_PRESETS.map(cap => {
                  const isSel = capacity === cap;
                  return (
                    <button
                      type="button"
                      key={cap}
                      onClick={() => setCapacity(cap)}
                      style={{
                        background: isSel ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSel ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isSel ? '#00f2fe' : '#cbd5e1',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {cap}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Operational Status & Latency Override */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Estado Operativo
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    style={{
                      flex: 1,
                      padding: '7px',
                      borderRadius: '8px',
                      background: status === 'active' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      border: status === 'active' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: status === 'active' ? '#10b981' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Activo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('standby')}
                    style={{
                      flex: 1,
                      padding: '7px',
                      borderRadius: '8px',
                      background: status === 'standby' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      border: status === 'standby' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: status === 'standby' ? '#f59e0b' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Standby
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Latencia RTT Estimada (ms)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={String(estimatedLatency)}
                  value={customLatency}
                  onChange={(e) => setCustomLatency(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Actions footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '8px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                type="button"
                onClick={() => {
                  setLinkDefaultSourceId(null);
                  onClose();
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isDuplicate}
                style={{
                  background: isDuplicate 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
                  border: 'none',
                  color: isDuplicate ? '#64748b' : '#060911',
                  padding: '8px 20px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: isDuplicate ? 'not-allowed' : 'pointer',
                  boxShadow: isDuplicate ? 'none' : '0 0 20px rgba(0, 242, 254, 0.4)'
                }}
              >
                {isDuplicate ? 'Enlace ya Existente' : 'Trazar Enlace en Mapa'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
