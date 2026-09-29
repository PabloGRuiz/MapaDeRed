'use client';

import React, { useState } from 'react';
import { Activity, ShieldCheck, Layers, Radio, Globe2, ClipboardList, Shield, Plus, Database, RotateCcw, Trash2, Share2 } from 'lucide-react';
import { MapStyleMode } from '@/types/network';
import { MAP_STYLES } from '@/data/mockNodes';
import { RoleSelector } from './RoleSelector';
import { useNetworkCentral } from '@/context/NetworkCentralContext';

interface HeaderProps {
  currentStyle: MapStyleMode;
  onStyleChange: (style: MapStyleMode) => void;
  totalNodes: number;
  activeLinksCount: number;
  onResetView: () => void;
  onOpenDashboard: () => void;
  onHeightChange?: (height: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStyle,
  onStyleChange,
  totalNodes,
  activeLinksCount,
  onResetView,
  onOpenDashboard,
  onHeightChange,
}) => {
  const {
    stats,
    currentUser,
    setIsWizardOpen,
    clearAllNodes,
    restoreDemoNodes,
    nodes,
    links,
    setIsLinkModalOpen
  } = useNetworkCentral();
  const [showDbMenu, setShowDbMenu] = useState(false);
  const headerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!headerRef.current) return;
    const notify = () => {
      if (headerRef.current && onHeightChange) {
        onHeightChange(headerRef.current.offsetHeight);
      }
    };
    notify();
    const observer = new ResizeObserver(notify);
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const pendingAttention = stats.pendingSubmissionSites + stats.underReviewSites + stats.actionRequiredSites;

  return (
    <header
      ref={headerRef}
      style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      right: '16px',
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 18px',
      borderRadius: '16px',
      background: 'rgba(11, 16, 28, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      {/* Brand & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#060911',
          boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)'
        }}>
          <Radio size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              Red Nacional • Servidor Central
            </h1>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'rgba(0, 242, 254, 0.15)',
              color: '#00f2fe',
              padding: '2px 8px',
              borderRadius: '9999px',
              border: '1px solid rgba(0, 242, 254, 0.3)'
            }}>
              Auditoría NOC
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8' }}>
            Monitoreo de Puestos Fijos • Esquemas Visio & Planillas Excel
          </p>
        </div>
      </div>

      {/* Center Actions: Central Dashboard Button & Stats */}
      {/* Center Actions: Nuevo Puesto, Central Dashboard, DB tools & Role Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Nuevo Puesto Button */}
        <button
          onClick={() => setIsWizardOpen(true)}
          title="Registrar un nuevo puesto fijo con asistente guiado"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
            border: 'none',
            color: '#060911',
            padding: '7px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 242, 254, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 242, 254, 0.4)';
          }}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Nuevo Puesto</span>
        </button>

        {/* Conectar Puestos Button */}
        <button
          onClick={() => setIsLinkModalOpen(true)}
          title={nodes.length < 2 ? 'Se requieren al menos 2 puestos para trazar enlaces' : 'Trazar troncal de fibra o enlace entre dos puestos'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(192, 132, 252, 0.12) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            padding: '7px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.08)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.22)';
            e.currentTarget.style.borderColor = '#38bdf8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
          }}
        >
          <Share2 size={15} />
          <span>Conectar Puestos</span>
          {links.length > 0 && (
            <span style={{
              background: 'rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontSize: '10px',
              padding: '1px 5px',
              borderRadius: '6px',
              fontWeight: 800
            }}>
              {links.length}
            </span>
          )}
        </button>

        {/* National Audit Dashboard Button */}
        <button
          onClick={onOpenDashboard}
          title="Abrir Tablero Central de Auditoría Nacional"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            color: '#00f2fe',
            padding: '7px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 15px rgba(0, 242, 254, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 242, 254, 0.25)';
            e.currentTarget.style.borderColor = '#00f2fe';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 242, 254, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
          }}
        >
          <ClipboardList size={16} />
          <span>Tablero de Auditoría Central</span>
          {pendingAttention > 0 && (
            <span style={{
              background: '#f43f5e',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '9999px',
              lineHeight: 1.2
            }}>
              {pendingAttention}
            </span>
          )}
        </button>

        {/* Database Management Tools */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDbMenu(!showDbMenu)}
            title="Administración de Base de Datos de Puestos"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              padding: '7px 10px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <Database size={14} color="#38bdf8" />
            <span>Base de Datos ({nodes.length})</span>
          </button>

          {showDbMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              zIndex: 30,
              width: '210px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ fontSize: '10px', color: '#64748b', padding: '4px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                Gestión de Datos
              </div>
              <button
                onClick={() => {
                  setShowDbMenu(false);
                  restoreDemoNodes();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <RotateCcw size={14} />
                <span>Cargar Nodos Demo</span>
              </button>

              <button
                onClick={() => {
                  setShowDbMenu(false);
                  if (confirm('¿Está seguro de que desea vaciar la base de datos de puestos?')) {
                    clearAllNodes();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#f43f5e',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Trash2 size={14} />
                <span>Vaciar Base de Datos</span>
              </button>
            </div>
          )}
        </div>

        {/* Role Selector */}
        <RoleSelector />
      </div>

      {/* Right Controls: Map Style Switcher & 3D reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onResetView}
          title="Centrar vista en toda Argentina"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            padding: '6px 10px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Globe2 size={14} color="#00f2fe" />
          <span>Argentina 3D</span>
        </button>

        {/* Style Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '2px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {(Object.keys(MAP_STYLES) as MapStyleMode[]).map((styleKey) => {
            const isSelected = currentStyle === styleKey;
            return (
              <button
                key={styleKey}
                onClick={() => onStyleChange(styleKey)}
                style={{
                  background: isSelected ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                  color: isSelected ? '#00f2fe' : '#94a3b8',
                  border: isSelected ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid transparent',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Layers size={11} />
                <span>{MAP_STYLES[styleKey].badge}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
