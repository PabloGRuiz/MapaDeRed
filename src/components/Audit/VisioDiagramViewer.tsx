'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Upload, 
  FileCode, 
  Maximize2, 
  Minimize2,
  CheckCircle2, 
  AlertCircle,
  FileWarning,
  Image as ImageIcon,
  FileText,
  Layers,
  Copy,
  Check,
  Eye,
  FileSpreadsheet,
  Camera,
  ChevronDown,
  ChevronUp,
  QrCode
} from 'lucide-react';
import { NetworkNode, DiagramFileType } from '@/types/network';
import { useNetworkCentral } from '@/context/NetworkCentralContext';
import { SAMPLE_VISIO_SVG_TOPOLOGY } from '@/data/mockAudits';
import { downloadDiagramFile, detectDiagramFileType, processUploadedDiagramFile } from '@/utils/diagramFileHelpers';
import { NodeQRCodeModal } from '@/components/Audit/NodeQRCodeModal';

interface VisioDiagramViewerProps {
  node: NetworkNode;
  onOpenUploadModal: () => void;
}

export const VisioDiagramViewer: React.FC<VisioDiagramViewerProps> = ({
  node,
  onOpenUploadModal
}) => {
  const { currentUser, updateAuditStatus, uploadDiagram } = useNetworkCentral();
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Height expansion in panel
  const [isExpandedHeight, setIsExpandedHeight] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Fullscreen Lightbox Modal State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isLightboxDragging, setIsLightboxDragging] = useState(false);
  const [lightboxDragStart, setLightboxDragStart] = useState({ x: 0, y: 0 });

  // XML Tab State
  const [xmlActiveTab, setXmlActiveTab] = useState<'preview' | 'code'>('preview');
  const [hasCopiedXml, setHasCopiedXml] = useState(false);

  // Image attach state
  const [isAttachingImage, setIsAttachingImage] = useState(false);
  const attachImageInputRef = useRef<HTMLInputElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const diagram = node.diagram;

  // Detect file type
  const effectiveFileType: DiagramFileType = diagram?.fileType || 
    (diagram?.fileName ? detectDiagramFileType(diagram.fileName) : 
     diagram?.vsdxFileName ? detectDiagramFileType(diagram.vsdxFileName) : 'visio');

  // Solo se considera que hay imagen real si hay imageUrl cargada o svgContent genuino (distinto al mock)
  const hasRealImage = Boolean(
    diagram?.imageUrl || 
    (diagram?.svgContent && diagram.svgContent.trim() !== '' && diagram.svgContent !== SAMPLE_VISIO_SVG_TOPOLOGY)
  );

  const isImage = effectiveFileType === 'image' || !!diagram?.imageUrl;
  const isSvg = effectiveFileType === 'svg' || (!!diagram?.svgContent && !diagram?.imageUrl);
  const isXmlOrDrawio = effectiveFileType === 'xml' || effectiveFileType === 'drawio' || !!diagram?.xmlContent;
  const isVisio = effectiveFileType === 'visio';

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(prev => Math.max(0.4, Math.min(4, prev + delta)));
  };

  // Lightbox handlers
  const handleLightboxMouseDown = (e: React.MouseEvent) => {
    setIsLightboxDragging(true);
    setLightboxDragStart({ x: e.clientX - lightboxPan.x, y: e.clientY - lightboxPan.y });
  };

  const handleLightboxMouseMove = (e: React.MouseEvent) => {
    if (!isLightboxDragging) return;
    setLightboxPan({
      x: e.clientX - lightboxDragStart.x,
      y: e.clientY - lightboxDragStart.y
    });
  };

  const handleLightboxMouseUp = () => setIsLightboxDragging(false);

  const handleLightboxWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setLightboxZoom(prev => Math.max(0.2, Math.min(5, prev + delta)));
  };

  const handleOpenLightbox = () => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsLightboxOpen(true);
  };

  const handleDownload = () => {
    if (!diagram) return;
    downloadDiagramFile(diagram);
  };

  const handleCopyXml = () => {
    if (!diagram?.xmlContent) return;
    navigator.clipboard.writeText(diagram.xmlContent);
    setHasCopiedXml(true);
    setTimeout(() => setHasCopiedXml(false), 2000);
  };

  // Direct diagram or image attachment handler (for Visio, Draw.io, SVG or Images)
  const handleAttachImage = async (file: File) => {
    try {
      setIsAttachingImage(true);
      const processed = await processUploadedDiagramFile(file);
      uploadDiagram(node.id, {
        title: diagram?.title || `Esquema de Red - ${file.name.replace(/\.[^/.]+$/, '')}`,
        fileName: file.name,
        fileSize: processed.fileSize,
        fileType: processed.fileType,
        fileData: processed.fileData,
        fileUrl: processed.fileUrl,
        imageUrl: processed.imageUrl || (processed.fileType === 'image' ? processed.fileData : undefined),
        svgContent: processed.svgContent || diagram?.svgContent,
        notes: diagram 
          ? `${diagram.notes || ''} [Archivo vinculado: ${file.name}]`.trim() 
          : `Esquema de red cargado directamente (${file.name})`
      });
    } catch (err) {
      console.error('Error attaching file:', err);
    } finally {
      setIsAttachingImage(false);
    }
  };

  // Close lightbox on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  if (!diagram) {
    return (
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleAttachImage(e.dataTransfer.files[0]);
          }
        }}
        style={{
          padding: '30px 20px',
          textAlign: 'center',
          background: 'rgba(244, 63, 94, 0.05)',
          border: '1px dashed rgba(244, 63, 94, 0.3)',
          borderRadius: '14px',
          margin: '10px 0'
        }}
      >
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          color: '#f43f5e'
        }}>
          <FileWarning size={24} />
        </div>
        <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: 600 }}>
          Esquema de Red Pendiente de Entrega
        </h4>
        <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '380px', margin: '6px auto 16px', lineHeight: 1.4 }}>
          Este puesto aún no cuenta con un esquema de red homologado. Puedes cargar archivos reales de <b>Microsoft Visio (.vsdx)</b>, <b>Draw.io (.xml / .drawio)</b>, <b>Imágenes (PNG, JPG, SVG)</b> o <b>PDF</b>.
        </p>

        {currentUser.role === 'admin' ? (
          <button
            onClick={onOpenUploadModal}
            style={{
              background: 'linear-gradient(135deg, #00f2fe 0%, #0099ff 100%)',
              color: '#060911',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)'
            }}
          >
            <Upload size={14} />
            <span>Cargar Esquema Real Ahora</span>
          </button>
        ) : (
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Requiere que un Administrador del Servidor Central o el Técnico local cargue el archivo.
          </span>
        )}
      </div>
    );
  }

  // Format badge configuration
  const formatBadgeConfig = {
    image: { label: 'IMAGEN', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)', icon: <ImageIcon size={12} /> },
    svg: { label: 'SVG VECTORIAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', icon: <Layers size={12} /> },
    drawio: { label: 'DRAW.IO', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', icon: <FileSpreadsheet size={12} /> },
    xml: { label: 'XML SCHEMA', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)', icon: <FileCode size={12} /> },
    visio: { label: 'VISIO (.VSDX)', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', icon: <FileCode size={12} /> },
    pdf: { label: 'PDF BLUEPRINT', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', icon: <FileText size={12} /> },
    other: { label: 'ARCHIVO DE RED', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', icon: <FileText size={12} /> }
  }[effectiveFileType] || { label: 'DIAGRAMA', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.15)', border: 'rgba(0, 242, 254, 0.3)', icon: <FileCode size={12} /> };

  const displayFileName = diagram.fileName || diagram.vsdxFileName || 'esquema_red';
  const displayFileSize = diagram.fileSize || diagram.vsdxFileSize || '1.0 MB';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
      {/* Hidden input to attach a real preview image or file to Visio/Draw.io */}
      <input
        ref={attachImageInputRef}
        type="file"
        accept=".vsdx,.vsd,.drawio,.xml,.svg,.png,.jpg,.jpeg,.webp,.pdf"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleAttachImage(e.target.files[0]);
          }
        }}
        style={{ display: 'none' }}
      />

      {/* Metadata Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '8px 12px',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: formatBadgeConfig.color,
            background: formatBadgeConfig.bg,
            border: `1px solid ${formatBadgeConfig.border}`,
            padding: '2px 7px',
            borderRadius: '5px',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.04em'
          }}>
            {formatBadgeConfig.icon}
            {formatBadgeConfig.label}
          </span>

          <span style={{ color: '#fff', fontWeight: 600, wordBreak: 'break-all' }}>
            {displayFileName}
          </span>
          <span style={{ color: '#00f2fe', background: 'rgba(0, 242, 254, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
            {diagram.version}
          </span>
          <span style={{ color: '#64748b' }}>• {displayFileSize}</span>

          {hasRealImage && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '5px',
              padding: '1px 7px',
              fontSize: '10px',
              fontWeight: 700
            }}>
              <Check size={11} />
              Display Activo
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Download Original File Button */}
          <button
            onClick={handleDownload}
            title="Descargar archivo original con su contenido real"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              color: '#00f2fe',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 242, 254, 0.15)'
            }}
          >
            <Download size={13} color="#00f2fe" />
            <span>Descargar Archivo</span>
          </button>

          {/* Botón Generar QR de Rack */}
          <button
            onClick={() => setShowQR(true)}
            title="Generar código QR de este esquema para la puerta del rack"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(0, 242, 254, 0.12)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              color: '#00f2fe',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <QrCode size={13} />
            <span>QR Rack</span>
          </button>

          {/* Expand / Fullscreen Lightbox Button (Solo si hay imagen real cargada) */}
          {hasRealImage && (
            <button
              onClick={handleOpenLightbox}
              title="Expandir esquema a pantalla completa con zoom libre"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.18) 0%, rgba(168, 85, 247, 0.18) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                color: '#f472b6',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.2)'
              }}
            >
              <Maximize2 size={13} />
              <span>Pantalla Completa</span>
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenUploadModal}
              title="Cargar nuevo archivo de esquema (Visio, Draw.io, Imagen o PDF)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                borderRadius: '6px',
                padding: '5px 9px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <Upload size={12} />
              <span>Subir Nueva Versión</span>
            </button>
          )}
        </div>
      </div>

      {/* Draw.io / XML Sub-nav Tabs */}
      {isXmlOrDrawio && diagram.xmlContent && (
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '6px'
        }}>
          <button
            onClick={() => setXmlActiveTab('preview')}
            style={{
              background: xmlActiveTab === 'preview' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              border: xmlActiveTab === 'preview' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
              color: xmlActiveTab === 'preview' ? '#f59e0b' : '#94a3b8',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Eye size={12} />
            <span>Vista de Arquitectura</span>
          </button>

          <button
            onClick={() => setXmlActiveTab('code')}
            style={{
              background: xmlActiveTab === 'code' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              border: xmlActiveTab === 'code' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
              color: xmlActiveTab === 'code' ? '#06b6d4' : '#94a3b8',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FileCode size={12} />
            <span>Estructura XML</span>
          </button>

          <button
            onClick={handleCopyXml}
            style={{
              marginLeft: 'auto',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: hasCopiedXml ? '#10b981' : '#94a3b8',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {hasCopiedXml ? <Check size={12} /> : <Copy size={12} />}
            <span>{hasCopiedXml ? '¡Copiado!' : 'Copiar XML'}</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isXmlOrDrawio && xmlActiveTab === 'code' && diagram.xmlContent ? (
        /* XML Code View */
        <div style={{
          position: 'relative',
          height: isExpandedHeight ? '450px' : '290px',
          borderRadius: '12px',
          background: '#070a14',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          overflow: 'auto',
          padding: '12px 14px',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#38bdf8',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
          transition: 'height 0.2s ease'
        }}>
          {diagram.xmlContent.slice(0, 10000)}
          {diagram.xmlContent.length > 10000 && '\n\n... [Contenido extenso truncado para previsualización. Descarga el archivo para ver completo]'}
        </div>
      ) : hasRealImage ? (
        /* Visual Interactive Canvas (Images, SVG, Vector previews) - Solo si hay imagen real cargada */
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleOpenLightbox}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0];
              if (file.type.startsWith('image/') || file.name.endsWith('.svg')) {
                handleAttachImage(file);
              }
            }
          }}
          style={{
            position: 'relative',
            height: isExpandedHeight ? '450px' : '290px',
            borderRadius: '12px',
            background: '#070a12',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)',
            transition: 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Floating Controls Overlay */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            gap: '4px',
            zIndex: 10,
            background: 'rgba(11, 16, 28, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '3px'
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              title="Acercar (+)"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '5px',
                border: 'none',
                background: 'transparent',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              title="Alejar (-)"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '5px',
                border: 'none',
                background: 'transparent',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
              title="Restablecer vista inicial"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '5px',
                border: 'none',
                background: 'transparent',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RotateCcw size={13} />
            </button>

            {/* Toggle canvas height button */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpandedHeight(!isExpandedHeight); }}
              title={isExpandedHeight ? "Reducir altura del visor" : "Aumentar altura del visor en panel"}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '5px',
                border: 'none',
                background: isExpandedHeight ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: isExpandedHeight ? '#00f2fe' : '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isExpandedHeight ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {/* Fullscreen Lightbox Button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenLightbox(); }}
              title="Abrir en pantalla completa (Fullscreen Lightbox)"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '5px',
                border: 'none',
                background: 'rgba(236, 72, 153, 0.2)',
                color: '#f472b6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Maximize2 size={13} />
            </button>
          </div>

          {/* Zoom percentage tag */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '10px',
            fontSize: '10px',
            color: '#94a3b8',
            zIndex: 10,
            background: 'rgba(0,0,0,0.7)',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            Zoom: {Math.round(zoom * 100)}% • Rueda para zoom • Arrastra para mover • <b>Doble clic para Pantalla Completa</b>
          </div>

          {/* Transformable Canvas Content */}
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out',
              userSelect: 'none'
            }}
          >
            {/* Render 1: Image (PNG, JPG, WEBP) */}
            {diagram.imageUrl && (
              <img
                src={diagram.imageUrl}
                alt={diagram.title}
                draggable={false}
                style={{
                  maxWidth: '92%',
                  maxHeight: '92%',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Render 2: SVG Vectorial real */}
            {diagram.svgContent && !diagram.imageUrl && diagram.svgContent !== SAMPLE_VISIO_SVG_TOPOLOGY && (
              <div
                className="diagram-svg-host"
                dangerouslySetInnerHTML={{ __html: diagram.svgContent }}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>
        </div>
      ) : (
        /* No real image uploaded state: Clean, high-tech info box */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0];
              if (file.type.startsWith('image/') || file.name.endsWith('.svg')) {
                handleAttachImage(file);
              }
            }
          }}
          style={{
            background: 'rgba(11, 16, 28, 0.65)',
            border: '1px dashed rgba(0, 242, 254, 0.25)',
            borderRadius: '12px',
            padding: '28px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00f2fe'
          }}>
            <ImageIcon size={24} />
          </div>

          <div>
            <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>
              {effectiveFileType === 'visio' 
                ? 'Archivo Visio (.vsdx) registrado sin imagen'
                : effectiveFileType === 'drawio' || effectiveFileType === 'xml'
                ? 'Archivo de Topología Draw.io / XML registrado'
                : 'Archivo de Esquema registrado sin imagen'}
            </h5>
            <p style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '440px', margin: '6px auto 0', lineHeight: 1.45 }}>
              El archivo <b>{displayFileName}</b> ({displayFileSize}) está adjunto y disponible para descargar. Para habilitar el display interactivo con zoom y pantalla completa, carga una captura o imagen real del esquema.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => attachImageInputRef.current?.click()}
              disabled={isAttachingImage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
                color: '#060911',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(0, 242, 254, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <Camera size={13} />
              <span>{isAttachingImage ? 'Procesando imagen...' : 'Cargar Imagen Real (PNG, JPG, SVG)'}</span>
            </button>

            <button
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
              <span>Descargar Archivo Original</span>
            </button>
          </div>

          <span style={{ fontSize: '10px', color: '#64748b' }}>
            También puedes arrastrar y soltar aquí una captura de pantalla (PNG, JPG o SVG) para visualizarla.
          </span>
        </div>
      )}

      {/* Notes / Audit observations */}
      {diagram.notes && (
        <div style={{
          fontSize: '11px',
          color: '#cbd5e1',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          gap: '6px'
        }}>
          <span style={{ color: '#00f2fe', fontWeight: 600 }}>Nota de Auditoría:</span>
          <span>{diagram.notes}</span>
        </div>
      )}

      {/* Admin Quick Audit Actions */}
      {currentUser.role === 'admin' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderRadius: '10px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Resolución Central del Esquema:
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {node.auditStatus !== 'approved' && (
              <button
                onClick={() => updateAuditStatus(node.id, 'approved', 'Esquema validado y aprobado en conformidad con la norma central.')}
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#10b981',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCircle2 size={12} />
                <span>Homologar Esquema</span>
              </button>
            )}

            {node.auditStatus !== 'action_required' && (
              <button
                onClick={() => updateAuditStatus(node.id, 'action_required', 'Esquema observado: se requiere subsanar puntos críticos.')}
                style={{
                  background: 'rgba(251, 146, 60, 0.2)',
                  border: '1px solid rgba(251, 146, 60, 0.4)',
                  color: '#fb923c',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <AlertCircle size={12} />
                <span>Observar / Solicitar Corrección</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX EXPANDED IMAGE MODAL - Solo si hay imagen real cargada */}
      {isLightboxOpen && hasRealImage && (
        <div
          ref={lightboxRef}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(6, 9, 17, 0.95)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Lightbox Top Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(11, 16, 28, 0.85)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: formatBadgeConfig.bg,
                border: `1px solid ${formatBadgeConfig.border}`,
                color: formatBadgeConfig.color,
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700
              }}>
                {formatBadgeConfig.label}
              </span>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {diagram.title}
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                ({displayFileName} • {displayFileSize})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleDownload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
                  color: '#060911',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 242, 254, 0.3)'
                }}
              >
                <Download size={14} />
                <span>Descargar Archivo Original</span>
              </button>

              <button
                onClick={() => setIsLightboxOpen(false)}
                title="Cerrar (Esc)"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Lightbox Canvas Area with Pan & Zoom */}
          <div
            onMouseDown={handleLightboxMouseDown}
            onMouseMove={handleLightboxMouseMove}
            onMouseUp={handleLightboxMouseUp}
            onMouseLeave={handleLightboxMouseUp}
            onWheel={handleLightboxWheel}
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              cursor: isLightboxDragging ? 'grabbing' : 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Expanded Element */}
            <div
              style={{
                transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
                transformOrigin: 'center center',
                transition: isLightboxDragging ? 'none' : 'transform 0.1s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '96%',
                maxHeight: '96%',
                userSelect: 'none'
              }}
            >
              {diagram.imageUrl ? (
                <img
                  src={diagram.imageUrl}
                  alt={diagram.title}
                  draggable={false}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '85vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.95), 0 0 40px rgba(0, 242, 254, 0.15)',
                    pointerEvents: 'none'
                  }}
                />
              ) : diagram.svgContent ? (
                <div
                  className="diagram-svg-host"
                  dangerouslySetInnerHTML={{ __html: diagram.svgContent }}
                  style={{
                    width: '92vw',
                    height: '82vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}
                />
              ) : null}
            </div>

            {/* Bottom Floating Control Bar */}
            <div style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(11, 16, 28, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              borderRadius: '30px',
              padding: '6px 16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(0, 242, 254, 0.15)',
              zIndex: 10
            }}>
              <button
                onClick={() => setLightboxZoom(prev => Math.max(0.2, prev - 0.25))}
                title="Alejar (-)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <ZoomOut size={16} />
              </button>

              <span style={{ fontSize: '12px', color: '#00f2fe', fontWeight: 700, minWidth: '45px', textAlign: 'center' }}>
                {Math.round(lightboxZoom * 100)}%
              </span>

              <button
                onClick={() => setLightboxZoom(prev => Math.min(5, prev + 0.25))}
                title="Acercar (+)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <ZoomIn size={16} />
              </button>

              <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.15)' }} />

              <button
                onClick={() => { setLightboxZoom(1); setLightboxPan({ x: 0, y: 0 }); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px'
                }}
              >
                100%
              </button>

              <button
                onClick={() => { setLightboxZoom(1.5); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px'
                }}
              >
                150%
              </button>

              <button
                onClick={() => { setLightboxZoom(2); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px'
                }}
              >
                200%
              </button>

              <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.15)' }} />

              <button
                onClick={() => { setLightboxZoom(1); setLightboxPan({ x: 0, y: 0 }); }}
                title="Restablecer posición"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Código QR de Rack */}
      {showQR && (
        <NodeQRCodeModal
          node={node}
          onClose={() => setShowQR(false)}
          defaultTab="visio"
        />
      )}
    </div>
  );
};
