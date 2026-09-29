'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  Server, 
  MapPin, 
  FileSpreadsheet, 
  Layers, 
  ShieldCheck, 
  Wifi, 
  Sparkles,
  Info
} from 'lucide-react';
import { NetworkNode } from '@/types/network';

interface NodeQRCodeModalProps {
  node: NetworkNode;
  onClose: () => void;
  defaultTab?: 'visio' | 'inventory' | 'info';
}

export const NodeQRCodeModal: React.FC<NodeQRCodeModalProps> = ({
  node,
  onClose,
  defaultTab = 'visio'
}) => {
  const [selectedDestination, setSelectedDestination] = useState<'visio' | 'inventory' | 'info'>(defaultTab);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [detectedLanIp, setDetectedLanIp] = useState<string>('10.116.8.116');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Inicializar la URL base detectada en el navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // Si está en localhost, podemos ofrecer o sugerir la IP de red local
      setBaseUrl(origin);
    }
  }, []);

  // Construir la URL completa de destino
  const fullTargetUrl = `${baseUrl}/?node=${node.id}${selectedDestination !== 'info' ? `&tab=${selectedDestination}` : ''}`;

  // Regenerar QR cuando cambie la URL o destino
  useEffect(() => {
    if (!fullTargetUrl) return;

    // Generar Data URL PNG de alta resolución
    QRCode.toDataURL(fullTargetUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#060911',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error al generar QR PNG:', err));

    // Generar SVG vectorial
    QRCode.toString(fullTargetUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#060911',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then(svg => setQrSvgString(svg))
      .catch(err => console.error('Error al generar QR SVG:', err));

    // Dibujar en canvas para descarga directa si hace falta
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, fullTargetUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#060911',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      }).catch(err => console.error('Error al dibujar canvas QR:', err));
    }
  }, [fullTargetUrl]);

  // Copiar link al portapapeles
  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullTargetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Descargar archivo PNG
  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    const safeName = (node.city || node.name).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `QR_Rack_${safeName}_${selectedDestination}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Descargar archivo SVG
  const handleDownloadSVG = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (node.city || node.name).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `QR_Rack_${safeName}_${selectedDestination}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Disparar diálogo de impresión
  const handlePrint = () => {
    window.print();
  };

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <>
      {/* MODAL EN PANTALLA */}
      <div 
        className="no-print"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div style={{
          background: 'linear-gradient(145deg, #0d1322 0%, #070a12 100%)',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '720px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 242, 254, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(0, 242, 254, 0.15)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f2fe'
              }}>
                <QrCode size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Código QR de Acceso Rápido al Rack
                </h3>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Puesto: <span style={{ color: '#00f2fe', fontWeight: 600 }}>{node.name || node.city}</span> ({node.province})
                </div>
              </div>
            </div>

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

          {/* Modal Content */}
          <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Aviso inteligente de IP si se está ejecutando en localhost */}
            {isLocalhost && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#fbbf24' }}>
                  <Wifi size={15} />
                  <span>
                    Estás navegando en <b>localhost</b>. Para escanear el QR desde celulares u otras PCs en la oficina:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBaseUrl(`http://${detectedLanIp}:3000`)}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    color: '#000',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Usar IP de Oficina ({detectedLanIp})
                </button>
              </div>
            )}

            {/* Configuración de URL y Destino */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '22px', alignItems: 'center' }}>
              {/* QR Display Card */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                border: '2px solid rgba(0, 242, 254, 0.4)'
              }}>
                <canvas 
                  ref={canvasRef} 
                  style={{ width: '220px', height: '220px', borderRadius: '8px' }} 
                />
                
                <div style={{
                  marginTop: '10px',
                  textAlign: 'center',
                  color: '#0f172a',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {node.city} • {selectedDestination === 'visio' ? 'ESQUEMA L2/L3' : selectedDestination === 'inventory' ? 'INVENTARIO' : 'FICHA'}
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center', marginTop: '2px' }}>
                  Escanee con la cámara de su móvil
                </div>
              </div>

              {/* Controles de Personalización */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. Selector de Pestaña de Destino */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    1. ¿Qué debe abrir el código QR al ser escaneado?
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: selectedDestination === 'visio' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${selectedDestination === 'visio' ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="qrDest"
                        checked={selectedDestination === 'visio'}
                        onChange={() => setSelectedDestination('visio')}
                        style={{ accentColor: '#00f2fe' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Esquema de Red L2/L3</span>
                          <span style={{ fontSize: '9px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', padding: '1px 5px', borderRadius: '4px' }}>
                            Recomendado para Rack
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          Abre directamente el plano Draw.io o Visio para el técnico frente al gabinete.
                        </div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: selectedDestination === 'inventory' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${selectedDestination === 'inventory' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="qrDest"
                        checked={selectedDestination === 'inventory'}
                        onChange={() => setSelectedDestination('inventory')}
                        style={{ accentColor: '#10b981' }}
                      />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                          Planilla de Materiales e Inventario
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          Despliega la lista de switches, routers, S/N y estado de las UPS.
                        </div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: selectedDestination === 'info' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${selectedDestination === 'info' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="qrDest"
                        checked={selectedDestination === 'info'}
                        onChange={() => setSelectedDestination('info')}
                        style={{ accentColor: '#cbd5e1' }}
                      />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                          Ficha General y Mapa
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          Muestra la ubicación geográfica, observaciones y opciones generales.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 2. Dirección IP o Dominio del Servidor */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1' }}>
                      2. Dirección del Servidor / Red:
                    </label>
                    {baseUrl !== window.location.origin && (
                      <button
                        type="button"
                        onClick={() => setBaseUrl(window.location.origin)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#00f2fe',
                          fontSize: '10px',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Restablecer original
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://10.116.8.116:3000"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#00f2fe',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* URL final construida con botón de copiar */}
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {fullTargetUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
                      color: copied ? '#10b981' : '#cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer con Botones de Exportación / Impresión */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '14px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleDownloadPNG}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  color: '#00f2fe',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Download size={13} />
                <span>Bajar PNG (512x512)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSVG}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <Download size={13} />
                <span>Bajar SVG Vectorial</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handlePrint}
                style={{
                  background: 'linear-gradient(135deg, #00f2fe 0%, #0099ff 100%)',
                  border: 'none',
                  color: '#060911',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)'
                }}
              >
                <Printer size={14} />
                <span>Imprimir Ficha de Rack A4</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PLANILLA A4 IMPRIMIBLE (SOLO VISIBLE AL IMPRIMIR) */}
      <div 
        id="printable-rack-sheet"
        className="print-only"
        style={{
          display: 'none', // Oculto en pantalla; el CSS @media print lo hace visible y aísla la página
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
          padding: '25mm 20mm',
          width: '100%',
          maxWidth: '210mm',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Cabecera Oficial */}
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Red Nacional de Comunicaciones • Control Central
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 0 0', color: '#0f172a' }}>
              FICHA TÉCNICA DE SALA DE RACK Y ACCESO RÁPIDO
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#64748b' }}>CÓDIGO DE IDENTIFICACIÓN:</div>
            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>{node.id.toUpperCase()}</div>
          </div>
        </div>

        {/* Datos Principales del Puesto */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Puesto / Emplazamiento Físico:</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {node.name || node.city}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>CIUDAD:</span>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{node.city}</div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>PROVINCIA:</span>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{node.province}</div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>COORDENADAS GPS:</span>
                <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>[{node.coordinates[1].toFixed(4)}°, {node.coordinates[0].toFixed(4)}°]</div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>ESTADO DE AUDITORÍA:</span>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>
                  {node.auditStatus === 'approved' ? 'APROBADO Y VIGENTE' : node.auditStatus === 'under_review' ? 'EN REVISIÓN' : 'PENDIENTE'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '16px' }}>
            <span style={{ fontSize: '10px', color: '#64748b' }}>ESQUEMA L2/L3 VIGENTE:</span>
            <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px', wordBreak: 'break-all' }}>
              {node.diagram?.fileName || 'Esquema Inicial'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
              Versión: {node.diagram?.version || 'v1.0'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
              Última actualización: {node.diagram?.uploadedAt || node.lastAuditedAt || 'Reciente'}
            </div>
          </div>
        </div>

        {/* SECCIÓN DEL CÓDIGO QR DESTACADO */}
        <div style={{
          textAlign: 'center',
          padding: '24px 20px',
          border: '2px dashed #000',
          borderRadius: '12px',
          background: '#ffffff',
          marginBottom: '25px'
        }}>
          {qrDataUrl && (
            <img 
              src={qrDataUrl} 
              alt="Código QR de Rack" 
              style={{ width: '220px', height: '220px', margin: '0 auto', display: 'block' }} 
            />
          )}

          <div style={{ fontSize: '14px', fontWeight: 800, color: '#000', marginTop: '12px', textTransform: 'uppercase' }}>
            ESCANEE ESTE CÓDIGO QR CON CUALQUIER DISPOSITIVO MÓVIL
          </div>
          <div style={{ fontSize: '11px', color: '#334155', maxWidth: '480px', margin: '4px auto 8px', lineHeight: 1.4 }}>
            Acceso instantáneo al <b>plano de red L2/L3</b>, detalles de puertos, direccionamiento IP e inventario completo de hardware en tiempo real sin requerir credenciales locales.
          </div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b' }}>
            Enlace directo: {fullTargetUrl}
          </div>
        </div>

        {/* Resumen de Materiales en Rack */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: '6px', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
            Resumen de Equipamiento e Insumos en Sala de Rack:
          </div>

          {node.inventory && node.inventory.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '4px 6px' }}>Categoría</th>
                  <th style={{ padding: '4px 6px' }}>Equipo / Material</th>
                  <th style={{ padding: '4px 6px' }}>Marca / Modelo</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center' }}>Cant.</th>
                  <th style={{ padding: '4px 6px' }}>Ubicación en Rack</th>
                </tr>
              </thead>
              <tbody>
                {node.inventory.slice(0, 8).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px 6px', textTransform: 'capitalize' }}>{it.category}</td>
                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>{it.name}</td>
                    <td style={{ padding: '4px 6px' }}>{it.model}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{it.quantity}</td>
                    <td style={{ padding: '4px 6px' }}>{it.rackLocation || 'Sala de Rack'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '6px 0' }}>
              No se han registrado materiales físicos en la base de datos central.
            </div>
          )}
        </div>

        {/* Observaciones Técnicas y Registro de Intervención */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Observaciones de Infraestructura:
            </div>
            <div style={{ fontSize: '11px', color: '#1e293b', marginTop: '4px', lineHeight: 1.4 }}>
              {node.observations || 'Sin observaciones específicas registradas para este emplazamiento.'}
            </div>
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Constancia de Inspección / Mantenimiento:
            </div>
            <div style={{ height: '35px', borderBottom: '1px dashed #94a3b8', marginTop: '8px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
              <span>Firma y Aclaración del Técnico</span>
              <span>Fecha: ____/____/2026</span>
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <div style={{ marginTop: '25px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '9px', color: '#94a3b8', textAlign: 'center' }}>
          Documento generado automáticamente por el Sistema de Control Central de Red • Plastificar y fijar en la puerta frontal del gabinete o rack.
        </div>
      </div>
    </>
  );
};
