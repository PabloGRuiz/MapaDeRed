'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Crosshair, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  FileCode, 
  FileSpreadsheet, 
  Server, 
  Shield, 
  Sparkles,
  Zap,
  Layers,
  Cpu,
  Upload,
  FileCheck,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Trash2,
  Download
} from 'lucide-react';
import { useNetworkCentral } from '@/context/NetworkCentralContext';
import { NetworkNode, NodeType, NodeStatus, SiteAuditStatus, InventoryItem, DiagramFileType } from '@/types/network';
import { MOCK_INVENTORY_TEMPLATES } from '@/data/mockAudits';
import { processUploadedDiagramFile } from '@/utils/diagramFileHelpers';
import { parseExcelInventoryFile, downloadInventoryTemplate, ParsedInventoryResult } from '@/utils/excelInventoryHelpers';

const PROVINCIAS_ARGENTINA = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 
  'Tierra del Fuego, Antártida e Islas del Atlántico Sur'
];

interface CreateSiteWizardModalProps {
  onClose: () => void;
  onSuccess: (node: NetworkNode) => void;
}

export const CreateSiteWizardModal: React.FC<CreateSiteWizardModalProps> = ({
  onClose,
  onSuccess
}) => {
  const { 
    createNode, 
    setIsPickingLocation, 
    pickedCoords, 
    setPickedCoords,
    currentUser 
  } = useNetworkCentral();

  const [step, setStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    province: 'Buenos Aires',
    longitude: -58.3816,
    latitude: -34.6037,
    type: 'core_backbone' as NodeType,
    status: 'operational' as NodeStatus,
    observations: '',
    
    // Visio / Esquema
    hasVisio: false,
    visioFileName: 'esquema_red_puesto.vsdx',
    visioTitle: 'Esquema de Red L2/L3',
    visioNotes: 'Diagrama de conexionado local del puesto fijo.',

    // Excel Materiales
    inventoryMode: 'standard' as 'empty' | 'standard' | 'excel'
  });

  // Diagram upload state
  const [uploadedDiagram, setUploadedDiagram] = useState<{
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
  const [isDraggingDiagram, setIsDraggingDiagram] = useState(false);
  const [isProcessingDiagram, setIsProcessingDiagram] = useState(false);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const diagramFileInputRef = useRef<HTMLInputElement>(null);

  // Excel Inventory upload state in wizard
  const [uploadedInventory, setUploadedInventory] = useState<ParsedInventoryResult | null>(null);
  const [uploadedInventoryFileName, setUploadedInventoryFileName] = useState<string>('');
  const [isProcessingInventory, setIsProcessingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [isDraggingInventory, setIsDraggingInventory] = useState(false);
  const inventoryFileInputRef = useRef<HTMLInputElement>(null);

  const handleInventoryFileChange = async (file: File) => {
    try {
      setIsProcessingInventory(true);
      setInventoryError(null);
      const parsed = await parseExcelInventoryFile(file);
      setUploadedInventory(parsed);
      setUploadedInventoryFileName(file.name);
      setFormData(prev => ({ ...prev, inventoryMode: 'excel' }));
    } catch (err: unknown) {
      setInventoryError(err instanceof Error ? err.message : 'Error al procesar la planilla Excel');
    } finally {
      setIsProcessingInventory(false);
    }
  };

  const handleDiagramFileChange = async (file: File) => {
    try {
      setIsProcessingDiagram(true);
      setDiagramError(null);
      const processed = await processUploadedDiagramFile(file);
      setUploadedDiagram(processed);
      setFormData(prev => ({
        ...prev,
        hasVisio: true,
        visioFileName: file.name,
        visioTitle: prev.visioTitle === 'Esquema de Red L2/L3' 
          ? `Esquema ${file.name.replace(/\.[^/.]+$/, '')}` 
          : prev.visioTitle
      }));
    } catch (err: unknown) {
      setDiagramError(err instanceof Error ? err.message : 'Error al procesar archivo de esquema');
    } finally {
      setIsProcessingDiagram(false);
    }
  };

  // Si el usuario seleccionó un punto en el mapa, actualizar automáticamente coordenadas
  useEffect(() => {
    if (pickedCoords) {
      setFormData(prev => ({
        ...prev,
        longitude: parseFloat(pickedCoords[0].toFixed(5)),
        latitude: parseFloat(pickedCoords[1].toFixed(5))
      }));
    }
  }, [pickedCoords]);

  const handleDismiss = () => {
    setPickedCoords(null);
    onClose();
  };

  const handleClearPickedCoords = () => {
    setPickedCoords(null);
    setFormData(prev => ({
      ...prev,
      longitude: -58.3816,
      latitude: -34.6037
    }));
  };

  const handlePickOnMap = () => {
    setIsPickingLocation(true);
    onClose(); // Cierra temporalmente el modal para permitir el clic libre en el mapa
  };

  const handleApplyPreset = () => {
    setFormData(prev => ({
      ...prev,
      name: 'Puesto Fijo San Rafael',
      city: 'San Rafael',
      province: 'Mendoza',
      longitude: -68.3301,
      latitude: -34.6177,
      type: 'core_backbone',
      observations: 'Puesto de operaciones local. Conexión de fibra troncal y equipamiento de distribución en rack principal.',
      visioFileName: 'topologia_san_rafael_v1.vsdx',
      visioTitle: 'Esquema de Red Puesto San Rafael'
    }));
  };

  const handleFinalSubmit = () => {
    const auditStatus: SiteAuditStatus = formData.hasVisio 
      ? 'under_review' 
      : 'pending_submission';

    let initialInventory: InventoryItem[] = [];
    if (formData.inventoryMode === 'standard') {
      initialInventory = MOCK_INVENTORY_TEMPLATES.standard.slice(0, 6);
    } else if (formData.inventoryMode === 'excel' && uploadedInventory) {
      initialInventory = uploadedInventory.items.map((item, idx) => ({
        ...item,
        id: `inv-${Date.now()}-${idx}`
      }));
    }

    const now = new Date().toISOString().split('T')[0];

    const resolvedFileName = uploadedDiagram?.fileName || (formData.visioFileName.endsWith('.vsdx') ? formData.visioFileName : `${formData.visioFileName}.vsdx`);
    const resolvedFileSize = uploadedDiagram?.fileSize || '2.5 MB';
    const resolvedFileType: DiagramFileType = uploadedDiagram?.fileType || 'visio';

    const newNode = createNode({
      name: formData.name || `Puesto Fijo ${formData.city}`,
      city: formData.city,
      province: formData.province,
      coordinates: [formData.longitude, formData.latitude],
      type: 'core_backbone',
      status: formData.status,
      observations: formData.observations,
      connectedTo: [],
      description: formData.observations || `Puesto de red ubicado en ${formData.city}, ${formData.province}.`,
      auditStatus,
      lastAuditedAt: formData.hasVisio ? now : undefined,
      auditedBy: formData.hasVisio ? `${currentUser.name} (Servidor Central)` : undefined,
      diagram: formData.hasVisio ? {
        id: `diag-${Date.now()}`,
        title: formData.visioTitle,
        fileName: resolvedFileName,
        fileSize: resolvedFileSize,
        fileType: resolvedFileType,
        fileData: uploadedDiagram?.fileData,
        fileUrl: uploadedDiagram?.fileUrl,
        mimeType: uploadedDiagram?.mimeType,
        vsdxFileName: resolvedFileName,
        vsdxFileSize: resolvedFileSize,
        svgContent: uploadedDiagram?.svgContent,
        imageUrl: uploadedDiagram?.imageUrl,
        xmlContent: uploadedDiagram?.xmlContent,
        version: 'v1.0 (Inicial)',
        uploadedAt: now,
        uploadedBy: currentUser.name,
        notes: formData.visioNotes
      } : undefined,
      inventory: initialInventory,
      improvements: []
    });

    setPickedCoords(null);
    onSuccess(newNode);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 95,
        backgroundColor: 'rgba(6, 9, 17, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div style={{
        width: '620px',
        maxWidth: '100%',
        maxHeight: '92vh',
        background: 'rgba(13, 19, 33, 0.95)',
        border: '1px solid rgba(0, 242, 254, 0.4)',
        borderRadius: '20px',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 242, 254, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
                color: '#060911',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                PASO {step} DE 3
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                {step === 1 && 'Ubicación & Datos del Puesto'}
                {step === 2 && 'Esquema de Red (Microsoft Visio)'}
                {step === 3 && 'Inventario de Materiales (Excel)'}
              </h3>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Alta centralizada de puestos fijos en el mapa interactivo de Argentina
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {step === 1 && (
              <button
                type="button"
                onClick={handleApplyPreset}
                style={{
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  color: '#00f2fe',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} /> Auto-rellenar
              </button>
            )}

            <button
              onClick={handleDismiss}
              title="Cerrar y descartar punto"
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

        {/* Progress Bar */}
        <div style={{ height: '3px', width: '100%', background: 'rgba(255, 255, 255, 0.06)' }}>
          <div style={{
            height: '100%',
            width: `${(step / 3) * 100}%`,
            background: 'linear-gradient(90deg, #00f2fe, #3b82f6)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Form Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* PASO 1: DATOS Y UBICACIÓN */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Coordenadas & Map Click Box */}
              <div style={{
                background: 'rgba(0, 242, 254, 0.06)',
                border: '1px dashed rgba(0, 242, 254, 0.3)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} color="#00f2fe" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                      Georreferenciación en el Mapa
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Lat: <b style={{ color: '#00f2fe' }}>{formData.latitude}°</b> | Lng: <b style={{ color: '#00f2fe' }}>{formData.longitude}°</b>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pickedCoords && (
                    <button
                      type="button"
                      onClick={handleClearPickedCoords}
                      title="Descartar este punto capturado del mapa"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Descartar Punto</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handlePickOnMap}
                    style={{
                      background: 'linear-gradient(135deg, #00f2fe 0%, #0099ff 100%)',
                      color: '#060911',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)'
                    }}
                  >
                    <Crosshair size={14} />
                    <span>Seleccionar en el Mapa</span>
                  </button>
                </div>
              </div>

              {/* Nombre y Ciudad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Nombre del Puesto / Sitio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Puesto Central Rosario Puerto"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Ciudad o Localidad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Rosario"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Provincia */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Provincia *
                </label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#0b101c',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                >
                  {PROVINCIAS_ARGENTINA.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              {/* Observaciones Generales del Puesto */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FileText size={13} color="#00f2fe" />
                  <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                    Observaciones Generales / Notas del Puesto
                  </label>
                </div>
                <textarea
                  rows={4}
                  placeholder="Detalles del inmueble o sala técnica, particularidades del conexionado de red, accesos, contactos locales, historial de intervenciones o notas para el equipo..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(0, 242, 254, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                  Información complementaria del puesto que quedará registrada de forma permanente junto a los esquemas y materiales.
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: ESQUEMA DE VISIO */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCode size={18} color="#00f2fe" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                        ¿El puesto ya remitió su esquema de red?
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Soporta Draw.io (.xml / .drawio), Imágenes (PNG, JPG, SVG), Visio (.vsdx) o PDF
                      </div>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={formData.hasVisio}
                    onChange={(e) => setFormData({ ...formData, hasVisio: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#00f2fe', cursor: 'pointer' }}
                  />
                </div>

                {formData.hasVisio ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingTop: '10px',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.08)'
                  }}>
                    {/* Real File Upload Drag & Drop Area */}
                    <div>
                      <input
                        ref={diagramFileInputRef}
                        type="file"
                        accept=".xml,.drawio,.drawio.xml,.dio,.vsdx,.vsd,.png,.jpg,.jpeg,.webp,.svg,.gif,.pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleDiagramFileChange(e.target.files[0]);
                          }
                        }}
                        style={{ display: 'none' }}
                      />

                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingDiagram(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingDiagram(false); }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setIsDraggingDiagram(false);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            await handleDiagramFileChange(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => diagramFileInputRef.current?.click()}
                        style={{
                          border: `2px dashed ${isDraggingDiagram ? '#00f2fe' : uploadedDiagram ? '#10b981' : 'rgba(0, 242, 254, 0.35)'}`,
                          background: isDraggingDiagram ? 'rgba(0, 242, 254, 0.12)' : uploadedDiagram ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '12px',
                          padding: '16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {uploadedDiagram ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            {uploadedDiagram.imageUrl ? (
                              <img
                                src={uploadedDiagram.imageUrl}
                                alt="Previsualización"
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #10b981' }}
                              />
                            ) : (
                              <div style={{
                                width: '44px',
                                height: '44px',
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
                            )}

                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', wordBreak: 'break-all' }}>
                                {uploadedDiagram.fileName}
                              </div>
                              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                                {uploadedDiagram.fileType.toUpperCase()} • {uploadedDiagram.fileSize} • Archivo vinculado correctamente
                              </div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                Clic para seleccionar otro archivo
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{
                              width: '40px',
                              height: '40px',
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
                              Cargar esquema real: Arrastra tu archivo o <span style={{ color: '#00f2fe', textDecoration: 'underline' }}>examina tu equipo</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                              Acepta <b>.xml (Draw.io)</b>, <b>.png / .jpg / .svg</b>, <b>.vsdx (Visio)</b> o <b>.pdf</b>
                            </div>
                          </div>
                        )}
                      </div>

                      {diagramError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '11px', marginTop: '6px' }}>
                          <AlertCircle size={13} />
                          <span>{diagramError}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                        Título del Esquema:
                      </label>
                      <input
                        type="text"
                        value={formData.visioTitle}
                        onChange={(e) => setFormData({ ...formData, visioTitle: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          fontSize: '11px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                        Notas técnicas o aclaraciones del diagrama:
                      </label>
                      <textarea
                        rows={2}
                        value={formData.visioNotes}
                        onChange={(e) => setFormData({ ...formData, visioNotes: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          fontSize: '11px',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f43f5e'
                  }}>
                    ⚠️ El puesto se creará en estado <b>"Pendiente de Entrega"</b> con alerta roja hasta que remita su esquema oficial.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 3: INVENTARIO EXCEL */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={18} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                      Carga de Planilla de Materiales (Excel)
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Inventario físico del hardware en sala de rack y puestos de trabajo
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {/* Opción 1: Importar Planilla Excel */}
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: formData.inventoryMode === 'excel' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${formData.inventoryMode === 'excel' ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="radio"
                        name="invMode"
                        checked={formData.inventoryMode === 'excel'}
                        onChange={() => setFormData({ ...formData, inventoryMode: 'excel' })}
                        style={{ accentColor: '#00f2fe' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Importar Planilla Excel (.xlsx, .xls, .csv)</span>
                          <span style={{ fontSize: '10px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                            Recomendado
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Carga directa del archivo de relevamiento confeccionado por los técnicos de campo.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadInventoryTemplate();
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#cbd5e1',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Download size={11} />
                        <span>Bajar Plantilla</span>
                      </button>
                    </div>

                    {/* Dropzone dentro de la opción Excel */}
                    {formData.inventoryMode === 'excel' && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingInventory(true);
                        }}
                        onDragLeave={() => setIsDraggingInventory(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingInventory(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleInventoryFileChange(file);
                        }}
                        onClick={() => inventoryFileInputRef.current?.click()}
                        style={{
                          marginTop: '6px',
                          border: `1px dashed ${isDraggingInventory ? '#00f2fe' : uploadedInventory ? '#10b981' : 'rgba(255, 255, 255, 0.2)'}`,
                          borderRadius: '8px',
                          padding: '12px',
                          background: uploadedInventory ? 'rgba(16, 185, 129, 0.06)' : 'rgba(0, 0, 0, 0.3)',
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          ref={inventoryFileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleInventoryFileChange(file);
                            e.target.value = '';
                          }}
                        />

                        {isProcessingInventory ? (
                          <div style={{ fontSize: '11px', color: '#00f2fe' }}>
                            Procesando y validando celdas del archivo Excel...
                          </div>
                        ) : uploadedInventory ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <FileCheck size={16} color="#10b981" />
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                                {uploadedInventoryFileName}
                              </div>
                              <div style={{ fontSize: '10px', color: '#10b981' }}>
                                {uploadedInventory.totalRows} materiales detectados y listos para ser incorporados al nuevo puesto
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                            Arrastra tu archivo aquí o <span style={{ color: '#00f2fe', textDecoration: 'underline' }}>examina tu equipo</span>
                          </div>
                        )}

                        {inventoryError && (
                          <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '4px' }}>
                            ⚠️ {inventoryError}
                          </div>
                        )}
                      </div>
                    )}
                  </label>

                  {/* Opción 2: Plantilla Estándar */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: formData.inventoryMode === 'standard' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${formData.inventoryMode === 'standard' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.06)'}`,
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="invMode"
                      checked={formData.inventoryMode === 'standard'}
                      onChange={() => setFormData({ ...formData, inventoryMode: 'standard' })}
                      style={{ accentColor: '#10b981' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                        Cargar equipamiento estándar de demostración
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Incluye Router de borde WAN, Switch PoE+, UPS APC On-Line, Patch Panels y Access Points.
                      </div>
                    </div>
                  </label>

                  {/* Opción 3: Vacío / Pendiente */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: formData.inventoryMode === 'empty' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${formData.inventoryMode === 'empty' ? 'rgba(244, 63, 94, 0.35)' : 'rgba(255, 255, 255, 0.06)'}`,
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="invMode"
                      checked={formData.inventoryMode === 'empty'}
                      onChange={() => setFormData({ ...formData, inventoryMode: 'empty' })}
                      style={{ accentColor: '#f43f5e' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                        Dejar inventario vacío (Sin materiales recibidos)
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Para cuando el puesto aún no envió su planilla de cálculo Excel.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Resumen de Confirmación Final */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(0, 242, 254, 0.05)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                fontSize: '11px',
                color: '#cbd5e1',
                lineHeight: 1.5
              }}>
                <div style={{ fontWeight: 700, color: '#00f2fe', marginBottom: '4px' }}>
                  RESUMEN DE ALTA EN SERVIDOR CENTRAL:
                </div>
                <div>• Puesto: <b>{formData.name || formData.city}</b> ({formData.city}, {formData.province})</div>
                <div>• Ubicación: [{formData.latitude}°, {formData.longitude}°]</div>
                <div>• Estado Visio: <b>{formData.hasVisio ? 'Esquema Inicial Remitido' : 'Pendiente de Entrega'}</b></div>
                <div>• Inventario: <b>{
                  formData.inventoryMode === 'excel'
                    ? `${uploadedInventory?.totalRows || 0} materiales importados desde Excel`
                    : formData.inventoryMode === 'standard'
                    ? '6 materiales precargados'
                    : 'Sin materiales (Pendiente)'
                }</b></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} />
              <span>Anterior</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={13} />
              <span>Descartar y Salir</span>
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={!formData.city.trim() || !formData.name.trim()}
              onClick={() => setStep(step + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: (formData.city.trim() && formData.name.trim()) ? 'linear-gradient(135deg, #00f2fe 0%, #0099ff 100%)' : 'rgba(255,255,255,0.05)',
                border: 'none',
                color: (formData.city.trim() && formData.name.trim()) ? '#060911' : '#64748b',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: (formData.city.trim() && formData.name.trim()) ? 'pointer' : 'not-allowed',
                boxShadow: (formData.city.trim() && formData.name.trim()) ? '0 4px 15px rgba(0, 242, 254, 0.3)' : 'none'
              }}
            >
              <span>Continuar</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#fff',
                borderRadius: '8px',
                padding: '9px 20px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Dar de Alta y Posicionar en el Mapa</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
