'use client';

import React from 'react';
import { useNetworkCentral } from '@/context/NetworkCentralContext';
import { Shield, UserCheck, ShieldAlert, ChevronDown } from 'lucide-react';
import { UserRole } from '@/types/network';

export const RoleSelector: React.FC = () => {
  const { currentUser, switchUser } = useNetworkCentral();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(0, 0, 0, 0.4)',
      padding: '4px 8px 4px 10px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {currentUser.role === 'admin' ? (
          <Shield size={15} color="#00f2fe" />
        ) : (
          <UserCheck size={15} color="#a855f7" />
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: currentUser.role === 'admin' ? '#00f2fe' : '#c084fc',
            lineHeight: 1.1
          }}>
            {currentUser.role === 'admin' ? 'Servidor Central (NOC)' : 'Técnico de Puesto'}
          </span>
          <span style={{ fontSize: '9px', color: '#94a3b8' }}>
            {currentUser.name}
          </span>
        </div>
      </div>

      <div style={{
        width: '1px',
        height: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        margin: '0 4px'
      }} />

      <select
        value={currentUser.role}
        onChange={(e) => switchUser(e.target.value as UserRole)}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '6px',
          color: '#f8fafc',
          fontSize: '11px',
          fontWeight: 600,
          padding: '4px 6px',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        <option value="admin" style={{ background: '#0b101c', color: '#00f2fe' }}>
          🛡️ Administrador Central (NOC)
        </option>
        <option value="operator" style={{ background: '#0b101c', color: '#c084fc' }}>
          👁️ Operador Regional (Consulta)
        </option>
      </select>
    </div>
  );
};
