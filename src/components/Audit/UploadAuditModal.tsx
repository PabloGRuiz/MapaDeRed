'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileCode, 
  CheckCircle2, 
  Sparkles, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  FileText,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { NetworkNode, DiagramFileType } from '@/types/network';
import { useNetworkCentral } from '@/context/NetworkCentralContext';
import { processUploadedDiagramFile, formatFileSize } from '@/utils/diagramFileHelpers';

interface UploadAuditModalProps {
  node: NetworkNode;
  onClose: () => void;
}

export const UploadAuditModal: React.FC<UploadAuditModalProps> = ({ node, onClose }) => {
  const { uploadDiagram } = useNetworkCentral();
  const [title, setTitle] = useState(`Esquema de Red - ${node.city}`);
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File state
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    fileSize: string;
    fileType: DiagramFileType;
    mimeType: string;
    fileData: string;
    fileUrl?: string;
    svgContent?: string;
    imageUrl?: string;
    xmlContent?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const processed = await processUploadedDiagramFile(file);
      setUploadedFile(processed);
      if (!title || title.startsWith('Esquema de Red -')) {
        setTitle(`Esquema ${file.name.replace(/\.[^/.]+$/, '')} - ${node.city}`);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al procesar el archivo seleccionado');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadedFile) {
      uploadDiagram(node.id, {
        title,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        fileType: uploadedFile.fileType,
        fileData: uploadedFile.fileData,
        fileUrl: uploadedFile.fileUrl,
        mimeType: uploadedFile.mimeType,
        vsdxFileName: uploadedFile.fileName,
        vsdxFileSize: uploadedFile.fileSize,
        svgContent: uploadedFile.svgContent,
        imageUrl: uploadedFile.imageUrl,
        xmlContent: uploadedFile.xmlContent,
        notes: notes || `Esquema técnico (${uploadedFile.fileType.toUpperCase()}) subido para auditoría del Servidor Central.`
      });
    } else {
      // Si no cargó archivo real, utiliza preset demo
      uploadDiagram(node.id, {
        title,
        fileName: `topologia_${node.id}.vsdx`,
        fileSize: '2.6 MB',
        fileType: 'visio',
        vsdxFileName: `topologia_${node.id}.vsdx`,
        vsdxFileSize: '2.6 MB',
        notes: notes || 'Esquema de flujo de red L2/L3 cargado para auditoría del Servidor Central.'
      });
    }

    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleUsePreset = () => {
    setTitle(`Topología Homologada 2026 - ${node.city}`);
    setUploadedFile({
      fileName: `esquema_red_central_${node.id}_v3.vsdx`,
      fileSize: '3.4 MB',
      fileType: 'visio',
      mimeType: 'application/vnd.ms-visio.drawing',
      fileData: ''
    });
    setNotes('Esquema completo con VLANs segmentadas (Servidores, Puestos, Cámaras) y enlaces 10G redundantes.');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '500px',
        maxWidth: '100%',
        background: 'rgba(15, 23, 42, 0.96)',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 242, 254, 0.15)',
        overflow: 'hidden',
        animation: 'slideUp 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={18} color="#00f2fe" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Cargar Esquema Real de Red
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '16px', color: '#fff', fontWeight: 600 }}>
              ¡Esquema de Red Vinculado con Éxito!
            </h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
              El archivo real ha sido almacenado y el puesto pasó al estado de revisión técnica central.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Puesto: <b>{node.name}</b> ({node.city})</span>
              <button
                type="button"
                onClick={handleUsePreset}
                style={{
                  background: 'rgba(0, 242, 254, 0.2)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  color: '#00f2fe',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={11} /> Usar Esquema Demo
              </button>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                Archivo de Esquema (XML / Draw.io, Imágenes, Visio, PDF)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,.drawio,.drawio.xml,.dio,.vsdx,.vsd,.png,.jpg,.jpeg,.webp,.svg,.gif,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                style={{ display: 'none' }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDraggingFile ? '#00f2fe' : uploadedFile ? '#10b981' : 'rgba(0, 242, 254, 0.3)'}`,
                  background: isDraggingFile ? 'rgba(0, 242, 254, 0.12)' : uploadedFile ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  padding: '18px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {uploadedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981'
                    }}>
                      <FileCheck size={22} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', wordBreak: 'break-all' }}>
                        {uploadedFile.fileName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                        {uploadedFile.fileType.toUpperCase()} • {uploadedFile.fileSize} • ¡Listo para subir!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(0, 242, 254, 0.1)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00f2fe',
                      margin: '0 auto 8px'
                    }}>
                      <Upload size={18} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>
                      Arrastra tu archivo aquí o <span style={{ color: '#00f2fe', textDecoration: 'underline' }}>examina tu equipo</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                      Soporta <b>.xml (Draw.io)</b>, <b>.png / .jpg / .svg</b>, <b>.vsdx (Visio)</b> o <b>.pdf</b>
                    </div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '11px', marginTop: '6px' }}>
                  <AlertCircle size={13} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Título o Identificador del Diagrama
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                Observaciones Técnicas / Aclaraciones
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indica cambios de topología, VLANs, equipamiento nuevo..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '11px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                style={{
                  background: 'linear-gradient(135deg, #00f2fe 0%, #0099ff 100%)',
                  color: '#060911',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isProcessing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)'
                }}
              >
                <Upload size={14} />
                <span>{uploadedFile ? 'Subir Esquema Real' : 'Guardar Esquema'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
