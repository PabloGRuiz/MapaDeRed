'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload,
  Plus, 
  Search, 
  Trash2, 
  Server, 
  Cpu, 
  Zap, 
  Layers, 
  Radio, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileWarning,
  FileText,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { NetworkNode, InventoryItem } from '@/types/network';
import { useNetworkCentral } from '@/context/NetworkCentralContext';
import { 
  exportInventoryToExcel, 
  downloadInventoryTemplate, 
  parseExcelInventoryFile, 
  ParsedInventoryResult 
} from '@/utils/excelInventoryHelpers';

interface InventoryExcelTableProps {
  node: NetworkNode;
}

const CATEGORY_LABELS: Record<InventoryItem['category'], { label: string; icon: React.ReactNode; color: string }> = {
  networking: { label: 'Networking', icon: <Cpu size={12} />, color: '#00f2fe' },
  servers: { label: 'Servidores', icon: <Server size={12} />, color: '#10b981' },
  power: { label: 'Energía / UPS', icon: <Zap size={12} />, color: '#f59e0b' },
  cabling: { label: 'Cableado y Fibra', icon: <Layers size={12} />, color: '#a855f7' },
  racks: { label: 'Racks y Gabinetes', icon: <Radio size={12} />, color: '#60a5fa' },
  peripherals: { label: 'Periféricos', icon: <ShieldCheck size={12} />, color: '#94a3b8' }
};

export const InventoryExcelTable: React.FC<InventoryExcelTableProps> = ({ node }) => {
  const { currentUser, addInventoryItem, deleteInventoryItem, setNodeInventory } = useNetworkCentral();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Estados del Modal de Importación Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedInventoryResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importError, setFieldError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneInputRef = useRef<HTMLInputElement>(null);

  // Formulario de nuevo ítem manual
  const [newItem, setNewItem] = useState({
    name: '',
    model: '',
    category: 'networking' as InventoryItem['category'],
    quantity: 1,
    condition: 'active' as InventoryItem['condition'],
    rackLocation: '',
    notes: ''
  });

  const filteredItems = useMemo(() => {
    return (node.inventory || []).filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [node.inventory, searchTerm, selectedCategory]);

  // Exportar a Excel .xlsx nativo
  const handleExportXLSX = () => {
    if (!node.inventory || node.inventory.length === 0) return;
    exportInventoryToExcel(node.inventory, node.name || node.city, node.province);
  };

  // Descargar plantilla oficial
  const handleDownloadTemplate = () => {
    downloadInventoryTemplate();
  };

  // Procesar archivo seleccionado
  const handleProcessFile = async (file: File) => {
    setIsParsing(true);
    setFieldError(null);
    setImportFile(file);

    try {
      const result = await parseExcelInventoryFile(file);
      setParsedData(result);
    } catch (err: unknown) {
      setFieldError(err instanceof Error ? err.message : 'Error al procesar el archivo Excel');
      setParsedData(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Reset input so re-selecting same file works
    e.target.value = '';
  };

  // Confirmar importación y guardar
  const handleConfirmImport = () => {
    if (!parsedData || parsedData.items.length === 0) return;

    setNodeInventory(node.id, parsedData.items, importMode);

    // Limpiar estado y cerrar modal
    setIsImportModalOpen(false);
    setImportFile(null);
    setParsedData(null);
    setFieldError(null);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.model.trim()) return;

    addInventoryItem(node.id, newItem);
    setNewItem({
      name: '',
      model: '',
      category: 'networking',
      quantity: 1,
      condition: 'active',
      rackLocation: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  const hasItems = node.inventory && node.inventory.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
      {/* Top action toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Left: Search & Filter (if items exist) */}
        {hasItems ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '9px' }} />
              <input
                type="text"
                placeholder="Filtrar por equipo, modelo o marca..."
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

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '11px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todas las categorías</option>
              {Object.keys(CATEGORY_LABELS).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat as InventoryItem['category']].label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
            Gestión y relevamiento de materiales de infraestructura
          </div>
        )}

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Hidden input for direct import picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />

          {/* Botón Importar Excel */}
          <button
            onClick={() => {
              setParsedData(null);
              setImportFile(null);
              setFieldError(null);
              setIsImportModalOpen(true);
            }}
            title="Importar planilla de cálculo (.xlsx, .xls, .csv)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#34d399',
              borderRadius: '6px',
              padding: '6px 11px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Upload size={13} />
            <span>Importar Excel</span>
          </button>

          {/* Botón Exportar Excel .xlsx */}
          {hasItems && (
            <button
              onClick={handleExportXLSX}
              title="Descargar planilla de cálculo oficial en formato Excel (.xlsx)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(0, 242, 254, 0.12)',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                color: '#00f2fe',
                borderRadius: '6px',
                padding: '6px 11px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FileSpreadsheet size={13} />
              <span>Exportar (.xlsx)</span>
            </button>
          )}

          {/* Botón Descargar Plantilla Oficial */}
          <button
            onClick={handleDownloadTemplate}
            title="Descargar modelo en blanco con ejemplos reales para relevamiento de campo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>Plantilla</span>
          </button>

          {/* Botón Cargar Manual (Solo Administrador) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: showAddForm ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.08)',
                border: showAddForm ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.15)',
                color: showAddForm ? '#fff' : '#e2e8f0',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={13} />
              <span>{showAddForm ? 'Cancelar' : 'Manual'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Formulario Manual de Nuevo Ítem (Admin only) */}
      {showAddForm && (
        <form
          onSubmit={handleCreateItem}
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
            Incorporar Nuevo Dispositivo o Insumo al Puesto
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px' }}>
            <input
              type="text"
              placeholder="Nombre (ej: Switch PoE+ 24P)"
              required
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
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
            <input
              type="text"
              placeholder="Marca / Modelo"
              required
              value={newItem.model}
              onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
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
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value as InventoryItem['category'] })}
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
              {Object.keys(CATEGORY_LABELS).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat as InventoryItem['category']].label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              min="1"
              placeholder="Cant."
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
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
            <select
              value={newItem.condition}
              onChange={(e) => setNewItem({ ...newItem, condition: e.target.value as InventoryItem['condition'] })}
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
              <option value="active">Operativo</option>
              <option value="spare">Repuesto / Backup</option>
              <option value="faulty">Con Falla / Dañado</option>
            </select>
            <input
              type="text"
              placeholder="Ubicación Rack (ej: Rack 01 - U24)"
              value={newItem.rackLocation}
              onChange={(e) => setNewItem({ ...newItem, rackLocation: e.target.value })}
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
            <button
              type="submit"
              style={{
                padding: '6px 14px',
                background: '#00f2fe',
                border: 'none',
                color: '#060911',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Guardar Ítem
            </button>
          </div>
        </form>
      )}

      {/* ESTADO VACÍO (Si no hay materiales registrados) */}
      {!hasItems ? (
        <div style={{
          padding: '24px 20px',
          textAlign: 'center',
          background: 'rgba(244, 63, 94, 0.04)',
          border: '1px dashed rgba(244, 63, 94, 0.3)',
          borderRadius: '14px',
          margin: '4px 0'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: '#f43f5e'
          }}>
            <FileWarning size={22} />
          </div>
          <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: 600, marginBottom: '6px' }}>
            Planilla de Materiales Pendiente
          </h4>
          <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '420px', margin: '0 auto 16px', lineHeight: 1.5 }}>
            El puesto aún no tiene equipamiento registrado. Puedes importar directamente una planilla <b>Excel (.xlsx)</b> o <b>CSV</b> con el relevamiento, o descargar nuestra plantilla oficial.
          </p>

          {/* Action box in empty state */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setParsedData(null);
                setImportFile(null);
                setFieldError(null);
                setIsImportModalOpen(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Upload size={14} />
              <span>Importar Planilla Excel</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                borderRadius: '8px',
                padding: '9px 15px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              <span>Descargar Plantilla Oficial</span>
            </button>
          </div>
        </div>
      ) : (
        /* TABLA DE MATERIALES REGISTRADOS */
        <div style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          overflow: 'hidden',
          background: 'rgba(11, 16, 28, 0.6)'
        }}>
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '8px 10px', width: '140px' }}>Categoría</th>
                  <th style={{ padding: '8px 10px' }}>Equipo / Material</th>
                  <th style={{ padding: '8px 10px' }}>Marca / Modelo</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>Cant</th>
                  <th style={{ padding: '8px 10px', width: '90px' }}>Estado</th>
                  <th style={{ padding: '8px 10px', width: '130px' }}>Ubicación</th>
                  {currentUser.role === 'admin' && (
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px' }}>Acción</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role === 'admin' ? 7 : 6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                      No se encontraron materiales que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const catCfg = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.networking;
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                        }}
                      >
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: catCfg.color,
                            background: `${catCfg.color}15`,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}>
                            {catCfg.icon}
                            <span>{catCfg.label}</span>
                          </span>
                        </td>

                        <td style={{ padding: '8px 10px', color: '#fff', fontWeight: 500 }}>
                          <div>{item.name}</div>
                          {item.notes && (
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                              {item.notes}
                            </div>
                          )}
                          {item.serialNumber && (
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                              S/N: {item.serialNumber}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>
                          {item.model}
                        </td>

                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#00f2fe', fontWeight: 700 }}>
                          {item.quantity}
                        </td>

                        <td style={{ padding: '8px 10px' }}>
                          {item.condition === 'active' && (
                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={11} /> Operativo
                            </span>
                          )}
                          {item.condition === 'spare' && (
                            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <AlertTriangle size={11} /> Repuesto
                            </span>
                          )}
                          {item.condition === 'faulty' && (
                            <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <XCircle size={11} /> Con Falla
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>
                          {item.rackLocation || '—'}
                        </td>

                        {currentUser.role === 'admin' && (
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              onClick={() => deleteInventoryItem(node.id, item.id)}
                              title="Eliminar ítem"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '4px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#f43f5e'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '11px',
            color: '#94a3b8'
          }}>
            <span>
              Mostrando <b>{filteredItems.length}</b> de <b>{node.inventory.length}</b> materiales registrados
            </span>
            <span style={{ color: '#00f2fe' }}>
              Total de Unidades Físicas: <b>{node.inventory.reduce((acc, i) => acc + (i.quantity || 1), 0)}</b>
            </span>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTACIÓN EXCEL */}
      {isImportModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0d1322 0%, #080c16 100%)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981'
                }}>
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Importar Planilla de Materiales (Excel / CSV)
                  </h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Puesto: <span style={{ color: '#00f2fe' }}>{node.name || node.city}</span> ({node.province})
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsImportModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleProcessFile(file);
                }}
                onClick={() => dropzoneInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? '#00f2fe' : parsedData ? '#10b981' : 'rgba(255, 255, 255, 0.18)'}`,
                  background: isDragging 
                    ? 'rgba(0, 242, 254, 0.08)' 
                    : parsedData 
                    ? 'rgba(16, 185, 129, 0.05)' 
                    : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  ref={dropzoneInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                />

                {isParsing ? (
                  <div>
                    <div style={{ fontSize: '13px', color: '#00f2fe', fontWeight: 600 }}>
                      Leyendo y procesando celdas del archivo Excel...
                    </div>
                  </div>
                ) : parsedData ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981'
                    }}>
                      <Check size={20} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                        {importFile?.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                        Hoja: "{parsedData.sheetName}" • {parsedData.totalRows} materiales detectados correctamente
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                        Clic para cambiar de archivo
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981',
                      margin: '0 auto 10px'
                    }}>
                      <Upload size={20} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                      Arrastra tu planilla aquí o <span style={{ color: '#10b981', textDecoration: 'underline' }}>haz clic para examinar</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Formatos compatibles: <b>.xlsx</b>, <b>.xls</b> o <b>.csv</b>
                    </div>
                  </div>
                )}
              </div>

              {/* Mensaje de error si hubo fallo */}
              {importError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} />
                  <span>{importError}</span>
                </div>
              )}

              {/* Opciones de Importación y Vista Previa (si se parseó data) */}
              {parsedData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Modo de importación: Reemplazar vs Sumar */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                      Método de Actualización en el Puesto:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: importMode === 'replace' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${importMode === 'replace' ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                        cursor: 'pointer'
                      }}>
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          style={{ accentColor: '#00f2fe', marginTop: '2px' }}
                        />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                            Reemplazar todo el inventario
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                            Sustituye por completo los ítems existentes por los {parsedData.totalRows} de la planilla.
                          </div>
                        </div>
                      </label>

                      <label style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: importMode === 'append' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${importMode === 'append' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                        cursor: 'pointer'
                      }}>
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          style={{ accentColor: '#10b981', marginTop: '2px' }}
                        />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                            Sumar / Anexar ítems
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                            Conserva los {node.inventory?.length || 0} actuales y añade estos {parsedData.totalRows} nuevos.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Vista Previa de Filas Parseadas */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: '#94a3b8',
                      marginBottom: '6px'
                    }}>
                      <span>Vista previa de materiales detectados ({parsedData.totalRows} en total):</span>
                      <span style={{ color: '#00f2fe' }}>
                        Auto-clasificación inteligente activa
                      </span>
                    </div>

                    <div style={{
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      maxHeight: '180px',
                      overflowY: 'auto'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0, 0, 0, 0.5)', color: '#94a3b8' }}>
                            <th style={{ padding: '6px 8px' }}>Categoría</th>
                            <th style={{ padding: '6px 8px' }}>Material</th>
                            <th style={{ padding: '6px 8px' }}>Modelo</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Cant</th>
                            <th style={{ padding: '6px 8px' }}>Estado</th>
                            <th style={{ padding: '6px 8px' }}>Rack</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.items.slice(0, 8).map((it, idx) => {
                            const catCfg = CATEGORY_LABELS[it.category] || CATEGORY_LABELS.networking;
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                <td style={{ padding: '6px 8px' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    color: catCfg.color,
                                    fontSize: '9px'
                                  }}>
                                    {catCfg.label}
                                  </span>
                                </td>
                                <td style={{ padding: '6px 8px', color: '#fff', fontWeight: 500 }}>
                                  {it.name}
                                </td>
                                <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>
                                  {it.model}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', color: '#00f2fe', fontWeight: 700 }}>
                                  {it.quantity}
                                </td>
                                <td style={{ padding: '6px 8px', color: it.condition === 'active' ? '#10b981' : '#f59e0b' }}>
                                  {it.condition === 'active' ? 'Operativo' : it.condition === 'spare' ? 'Repuesto' : 'Con Falla'}
                                </td>
                                <td style={{ padding: '6px 8px', color: '#94a3b8' }}>
                                  {it.rackLocation || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {parsedData.totalRows > 8 && (
                      <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
                        ... y {parsedData.totalRows - 8} materiales adicionales que serán incorporados.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.3)'
            }}>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                <Download size={13} />
                <span>Descargar formato oficial de ejemplo</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
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
                  type="button"
                  disabled={!parsedData || parsedData.items.length === 0}
                  onClick={handleConfirmImport}
                  style={{
                    background: !parsedData || parsedData.items.length === 0
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: !parsedData || parsedData.items.length === 0 ? '#64748b' : '#fff',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: !parsedData || parsedData.items.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: parsedData ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
                  }}
                >
                  <Check size={14} />
                  <span>
                    Confirmar e Importar {parsedData ? `${parsedData.totalRows} Materiales` : ''}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
