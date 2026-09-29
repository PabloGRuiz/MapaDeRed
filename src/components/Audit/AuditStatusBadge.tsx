'use client';

import React from 'react';
import { SiteAuditStatus } from '@/types/network';
import { CheckCircle2, Clock, AlertTriangle, FileWarning } from 'lucide-react';

interface AuditStatusBadgeProps {
  status: SiteAuditStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AUDIT_STATUS_CONFIG: Record<SiteAuditStatus, {
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  description: string;
}> = {
  pending_submission: {
    label: 'Pendiente de Entrega',
    shortLabel: 'Sin Enviar',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.15)',
    border: 'rgba(244, 63, 94, 0.4)',
    icon: <FileWarning size={14} />,
    description: 'El puesto aún no remitió el esquema de Visio ni la planilla de Excel de materiales.'
  },
  under_review: {
    label: 'En Revisión Central',
    shortLabel: 'En Revisión',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    icon: <Clock size={14} />,
    description: 'Documentación remitida por el puesto. En proceso de homologación por el Servidor Central.'
  },
  action_required: {
    label: 'Requiere Adecuación',
    shortLabel: 'Con Observaciones',
    color: '#fb923c',
    bg: 'rgba(251, 146, 60, 0.15)',
    border: 'rgba(251, 146, 60, 0.4)',
    icon: <AlertTriangle size={14} />,
    description: 'La auditoría detectó cuellos de botella, riesgos o falta de redundancia a subsanar.'
  },
  approved: {
    label: 'Auditado y Homologado',
    shortLabel: 'Homologado',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
    icon: <CheckCircle2 size={14} />,
    description: 'Esquema de flujo e inventario validados y vigentes bajo estándares del NOC central.'
  }
};

export const AuditStatusBadge: React.FC<AuditStatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md'
}) => {
  const cfg = AUDIT_STATUS_CONFIG[status] || AUDIT_STATUS_CONFIG.pending_submission;

  const fontSizes = { sm: '10px', md: '11px', lg: '12px' };
  const paddings = { sm: '2px 6px', md: '3px 8px', lg: '5px 10px' };

  return (
    <span
      title={cfg.description}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: fontSizes[size],
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '6px',
        padding: paddings[size],
        lineHeight: 1,
        whiteSpace: 'nowrap'
      }}
    >
      {showIcon && cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
};
