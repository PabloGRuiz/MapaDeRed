import * as XLSX from 'xlsx';
import { InventoryItem } from '@/types/network';

export interface ParsedInventoryResult {
  items: Omit<InventoryItem, 'id'>[];
  totalRows: number;
  warnings: string[];
  sheetName: string;
}

const CATEGORY_MAP: Record<string, InventoryItem['category']> = {
  // Networking
  'networking': 'networking',
  'redes': 'networking',
  'red': 'networking',
  'comunicaciones': 'networking',
  'networking / comunicaciones': 'networking',
  'switches': 'networking',
  'routers': 'networking',

  // Servers
  'servidores': 'servers',
  'servers': 'servers',
  'servidor': 'servers',
  'computo': 'servers',
  'cómputo': 'servers',
  'servidores / cómputo': 'servers',

  // Power
  'energia': 'power',
  'energía': 'power',
  'power': 'power',
  'ups': 'power',
  'energia / ups': 'power',
  'energía / ups': 'power',
  'alimentacion': 'power',
  'alimentación': 'power',

  // Cabling
  'cableado': 'cabling',
  'cabling': 'cabling',
  'cable': 'cabling',
  'fibra': 'cabling',
  'fibra optica': 'cabling',
  'fibra óptica': 'cabling',
  'cableado y fibra': 'cabling',
  'cableado estructurado': 'cabling',
  'cableado estructurado / fibra': 'cabling',

  // Racks
  'racks': 'racks',
  'rack': 'racks',
  'gabinetes': 'racks',
  'gabinete': 'racks',
  'racks y gabinetes': 'racks',
  'infraestructura': 'racks',

  // Peripherals
  'perifericos': 'peripherals',
  'periféricos': 'peripherals',
  'peripherals': 'peripherals',
  'otros': 'peripherals',
  'otro': 'peripherals',
  'accesorios': 'peripherals',
  'herramientas': 'peripherals'
};

const CATEGORY_DISPLAY_NAMES: Record<InventoryItem['category'], string> = {
  networking: 'Networking / Comunicaciones',
  servers: 'Servidores / Cómputo',
  power: 'Energía / UPS',
  cabling: 'Cableado Estructurado / Fibra',
  racks: 'Racks y Gabinetes',
  peripherals: 'Periféricos / Otros'
};

/**
 * Deduce la categoría a partir de palabras clave en el nombre o modelo
 */
function guessCategory(name: string, model: string): InventoryItem['category'] {
  const text = `${name} ${model}`.toLowerCase();

  if (/switch|router|firewall|fortinet|mikrotik|cisco|gateway|access point|ap |ubiquiti|unifi|sfp|transceiver|transceptor|modem|módem|borde wan|lan/i.test(text)) {
    return 'networking';
  }
  if (/servidor|server|blade|poweredge|proliant|supermicro|storage|nas |san |hypervisor|esxi/i.test(text)) {
    return 'servers';
  }
  if (/ups|bateria|batería|apc|eaton|smart-ups|pdu|regulador|estabilizador|transformador|inversor|termica|térmica|disyuntor/i.test(text)) {
    return 'power';
  }
  if (/fibra|patch cord|bobina|patch panel|patchera|utp|cat6|cat6a|cat5|coaxial|roseta|sc\/apc|lc\/upc|conector|monomodo|multimodo/i.test(text)) {
    return 'cabling';
  }
  if (/rack|gabinete|bandeja|organizador|ordenador de cables|pdu rack|chasis/i.test(text)) {
    return 'racks';
  }
  return 'networking'; // Categoría predeterminada más habitual en telecomunicaciones
}

/**
 * Normaliza la condición del equipo (activo, repuesto, con falla)
 */
function normalizeCondition(rawCondition: string): InventoryItem['condition'] {
  const val = (rawCondition || '').toString().toLowerCase().trim();
  if (/repuesto|spare|backup|reserva|guardado|almacen/i.test(val)) {
    return 'spare';
  }
  if (/falla|faulty|roto|defectuoso|averiado|danado|dañado|reparar|baja/i.test(val)) {
    return 'faulty';
  }
  return 'active';
}

/**
 * Normaliza la categoría
 */
function normalizeCategory(rawCategory: string, name: string, model: string): InventoryItem['category'] {
  const clean = (rawCategory || '').toString().toLowerCase().trim();
  if (CATEGORY_MAP[clean]) {
    return CATEGORY_MAP[clean];
  }
  return guessCategory(name, model);
}

/**
 * Exporta el inventario de un puesto a un archivo .xlsx profesional y formateado
 */
export function exportInventoryToExcel(
  items: InventoryItem[],
  siteName: string,
  province?: string
): void {
  // Encabezados en español
  const headers = [
    'Categoría',
    'Equipo / Material',
    'Marca / Modelo',
    'Cantidad',
    'Estado',
    'Ubicación en Rack',
    'Nº de Serie',
    'Observaciones / Notas'
  ];

  const rows = items.map(item => [
    CATEGORY_DISPLAY_NAMES[item.category] || item.category,
    item.name || '',
    item.model || '',
    item.quantity || 1,
    item.condition === 'active' ? 'Operativo' : item.condition === 'spare' ? 'Repuesto' : 'Con Falla',
    item.rackLocation || '',
    item.serialNumber || '',
    item.notes || ''
  ]);

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Definir anchos de columna automáticos para que se lea perfectamente
  worksheet['!cols'] = [
    { wch: 30 }, // Categoría
    { wch: 36 }, // Equipo / Material
    { wch: 28 }, // Marca / Modelo
    { wch: 12 }, // Cantidad
    { wch: 16 }, // Estado
    { wch: 20 }, // Ubicación en Rack
    { wch: 22 }, // Nº de Serie
    { wch: 45 }  // Observaciones / Notas
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario de Materiales');

  // Hoja informativa adicional con metadatos del sitio
  const infoData = [
    ['REPORTE DE INVENTARIO Y MATERIALES DE INFRAESTRUCTURA DE RED'],
    ['Fecha de exportación:', new Date().toLocaleString('es-AR')],
    ['Puesto / Sitio:', siteName],
    ['Provincia / Región:', province || 'No especificada'],
    ['Total de ítems registrados:', items.length],
    ['Total de unidades físicas acumuladas:', items.reduce((acc, i) => acc + (i.quantity || 1), 0)],
    [],
    ['Nota: Esta planilla puede editarse y reimportarse directamente en el sistema de Control Central.']
  ];
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
  infoSheet['!cols'] = [{ wch: 32 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Datos del Sitio');

  // Descarga automática en navegador
  const safeName = siteName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_').toLowerCase();
  XLSX.writeFile(workbook, `Inventario_Materiales_${safeName}.xlsx`);
}

/**
 * Descarga una planilla Excel oficial en blanco con ejemplos reales para los técnicos de campo
 */
export function downloadInventoryTemplate(): void {
  const headers = [
    'Categoría',
    'Equipo / Material',
    'Marca / Modelo',
    'Cantidad',
    'Estado',
    'Ubicación en Rack',
    'Nº de Serie',
    'Observaciones / Notas'
  ];

  const sampleRows = [
    [
      'Networking / Comunicaciones',
      'Router de Borde WAN Principal',
      'Cisco ISR 4331/K9',
      1,
      'Operativo',
      'Rack 01 - U40-U41',
      'FOC2349281A',
      'Enlace primario por fibra óptica troncal'
    ],
    [
      'Networking / Comunicaciones',
      'Switch de Distribución PoE+ 24 Puertos',
      'Cisco Catalyst 2960X-24PD-L',
      2,
      'Operativo',
      'Rack 01 - U36-U37',
      'FCW2210L01Z',
      'Alimentación PoE para cámaras y puntos de acceso'
    ],
    [
      'Networking / Comunicaciones',
      'Transceptor Óptico SFP+ 10G LR',
      'Cisco SFP-10G-LR Original',
      4,
      'Operativo',
      'Instalados en Router WAN',
      'OP19482701',
      'Monomodo 1310nm alcance 10km'
    ],
    [
      'Energía / UPS',
      'UPS Online Doble Conversión 3000VA',
      'APC Smart-UPS RT 3000VA On-Line',
      1,
      'Operativo',
      'Rack 01 - U01-U04 (Base)',
      'JS182049182',
      'Baterías sustituidas en auditoría anterior'
    ],
    [
      'Cableado Estructurado / Fibra',
      'Patch Panel Cat6A 24 Puertos UTP',
      'Furukawa SohoPlus Cat6',
      2,
      'Operativo',
      'Rack 01 - U30-U31',
      'N/A',
      'Tomas certificadas para puestos operativos'
    ],
    [
      'Cableado Estructurado / Fibra',
      'Bandeja Distribuidora de Fibra Óptica (ODF)',
      '3M 24 puertos SC/APC',
      1,
      'Operativo',
      'Rack 01 - U42 (Tope)',
      'N/A',
      '12 pelos empalmados a enlace troncal nacional'
    ],
    [
      'Racks y Gabinetes',
      'Gabinete Rack de Comunicaciones 42U',
      'Commax 19" 42U 800x1000mm',
      1,
      'Operativo',
      'Sala Técnica Central',
      'RK-42U-01',
      'Con puertas microperforadas y puesta a tierra reglamentaria'
    ],
    [
      'Networking / Comunicaciones',
      'Switch de Borde FastEthernet (Respaldo)',
      'HP ProCurve 2510-24',
      1,
      'Repuesto',
      'Bandeja de Repuestos Rack 01',
      'CN1928014B',
      'Equipo funcional de contingencia para emergencias'
    ]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 38 },
    { wch: 30 },
    { wch: 12 },
    { wch: 16 },
    { wch: 24 },
    { wch: 22 },
    { wch: 45 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relevamiento Materiales');

  // Hoja de instrucciones y valores permitidos
  const instructions = [
    ['GUÍA DE RELEVAMIENTO DE MATERIALES Y EQUIPAMIENTO DE RED'],
    [],
    ['1. INSTRUCCIONES DE USO:'],
    ['- Complete los equipos existentes en el puesto utilizando la pestaña "Relevamiento Materiales".'],
    ['- Puede mantener o borrar las filas de ejemplo incluidas en esta plantilla.'],
    ['- Guarde el archivo como .xlsx o .csv y súbalo al sistema mediante el botón "Importar Excel".'],
    [],
    ['2. CATEGORÍAS VÁLIDAS:'],
    ['- Networking / Comunicaciones (Routers, Switches, Firewalls, Transceptores SFP, etc.)'],
    ['- Servidores / Cómputo (Servidores Blade, Rack, Storage, Equipos industriales)'],
    ['- Energía / UPS (Sistemas ininterrumpidos, Bancos de Baterías, PDUs, Estabilizadores)'],
    ['- Cableado Estructurado / Fibra (Patch Panels, ODF, Bobinas, Patch Cords, etc.)'],
    ['- Racks y Gabinetes (Racks 19", Gabinetes murales, Bandejas, Puesta a tierra)'],
    ['- Periféricos / Otros (Accesorios varios, herramientas en puesto)'],
    [],
    ['3. ESTADOS ADMITIDOS:'],
    ['- Operativo (Equipo en producción activo sin fallas)'],
    ['- Repuesto (Equipo de contingencia o backup disponible en sitio)'],
    ['- Con Falla (Equipo dañado pendiente de reemplazo o retiro)']
  ];
  const instrSheet = XLSX.utils.aoa_to_sheet(instructions);
  instrSheet['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, instrSheet, 'Instrucciones');

  XLSX.writeFile(workbook, 'Plantilla_Oficial_Relevamiento_Materiales.xlsx');
}

/**
 * Parsea un archivo Excel (.xlsx, .xls) o .csv subido por el usuario
 */
export async function parseExcelInventoryFile(file: File): Promise<ParsedInventoryResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('El archivo Excel no contiene ninguna hoja válida.');
  }

  // Buscar una hoja que se llame similar a "inventario", "materiales", "relevamiento", o usar la primera
  const targetSheetName = workbook.SheetNames.find(name => 
    /material|inventario|relevamiento|equipos/i.test(name)
  ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error(`No se pudo leer la hoja "${targetSheetName}".`);
  }

  // Convertir a matriz bidimensional de celdas (filas y columnas)
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '' });

  if (!rows || rows.length === 0) {
    throw new Error('La planilla seleccionada se encuentra completamente vacía.');
  }

  // Buscar la fila de encabezados analizando las primeras 10 filas
  let headerRowIndex = -1;
  let colIndexes: {
    category?: number;
    name?: number;
    model?: number;
    quantity?: number;
    condition?: number;
    rackLocation?: number;
    serialNumber?: number;
    notes?: number;
  } = {};

  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const matchedCols: typeof colIndexes = {};

    row.forEach((cellVal, colIdx) => {
      const cellText = String(cellVal || '').toLowerCase().trim();
      if (!cellText) return;

      // Nombre / Equipo
      if (/^(equipo|material|nombre|dispositivo|item|descripción|descripcion|producto|aparato|device|equipment)$/i.test(cellText) ||
          /(equipo \/ material|nombre del equipo|nombre \/ descripcion)/i.test(cellText)) {
        matchedCols.name = colIdx;
      }
      // Modelo / Marca
      else if (/^(modelo|marca|marca \/ modelo|marca\/modelo|modelo \/ marca|model|part number|p\/n|pn|versión|version)$/i.test(cellText)) {
        matchedCols.model = colIdx;
      }
      // Categoría
      else if (/^(categoría|categoria|tipo|rubro|category|tipo de equipo)$/i.test(cellText)) {
        matchedCols.category = colIdx;
      }
      // Cantidad
      else if (/^(cantidad|cant|cant\.|unidades|qty|quantity)$/i.test(cellText)) {
        matchedCols.quantity = colIdx;
      }
      // Estado
      else if (/^(estado|condición|condicion|status|condition|situación|situacion)$/i.test(cellText)) {
        matchedCols.condition = colIdx;
      }
      // Rack / Ubicación
      else if (/^(ubicación|ubicacion|rack|ubicación en rack|ubicacion en rack|posición|posicion|location)$/i.test(cellText)) {
        matchedCols.rackLocation = colIdx;
      }
      // Número de Serie
      else if (/^(nº de serie|n° de serie|nro de serie|nro serie|número de serie|numero de serie|serie|s\/n|sn|serial|serial number)$/i.test(cellText)) {
        matchedCols.serialNumber = colIdx;
      }
      // Notas / Observaciones
      else if (/^(notas|observaciones|observación|observacion|comentarios|comentario|detalle|notes|comments)$/i.test(cellText)) {
        matchedCols.notes = colIdx;
      }
    });

    // Si encontramos al menos 'name' o ('model' y 'quantity'), consideramos esta la fila de encabezados
    if (matchedCols.name !== undefined || (matchedCols.model !== undefined && matchedCols.quantity !== undefined)) {
      headerRowIndex = r;
      colIndexes = matchedCols;
      break;
    }
  }

  // Si no se detectaron encabezados por texto, asumir mapeo posicional estándar
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    colIndexes = {
      category: 0,
      name: 1,
      model: 2,
      quantity: 3,
      condition: 4,
      rackLocation: 5,
      serialNumber: 6,
      notes: 7
    };
  }

  const parsedItems: Omit<InventoryItem, 'id'>[] = [];
  const warnings: string[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    // Obtener campos de la fila
    const rawName = colIndexes.name !== undefined ? String(row[colIndexes.name] || '').trim() : '';
    const rawModel = colIndexes.model !== undefined ? String(row[colIndexes.model] || '').trim() : '';
    const rawCategory = colIndexes.category !== undefined ? String(row[colIndexes.category] || '').trim() : '';
    const rawQty = colIndexes.quantity !== undefined ? row[colIndexes.quantity] : 1;
    const rawCondition = colIndexes.condition !== undefined ? String(row[colIndexes.condition] || '').trim() : '';
    const rawRack = colIndexes.rackLocation !== undefined ? String(row[colIndexes.rackLocation] || '').trim() : '';
    const rawSerial = colIndexes.serialNumber !== undefined ? String(row[colIndexes.serialNumber] || '').trim() : '';
    const rawNotes = colIndexes.notes !== undefined ? String(row[colIndexes.notes] || '').trim() : '';

    // Si toda la fila está en blanco o solo contiene notas informativas, ignorar
    if (!rawName && !rawModel && !rawNotes) continue;

    // Nombre efectivo
    const name = rawName || rawModel || 'Equipo sin denominación';
    const model = rawModel || 'Estándar';

    // Parsear cantidad
    let quantity = 1;
    if (typeof rawQty === 'number') {
      quantity = Math.max(1, Math.round(rawQty));
    } else if (typeof rawQty === 'string') {
      const match = rawQty.match(/\d+/);
      if (match) {
        quantity = Math.max(1, parseInt(match[0], 10));
      }
    }

    const category = normalizeCategory(rawCategory, name, model);
    const condition = normalizeCondition(rawCondition);

    parsedItems.push({
      category,
      name,
      model,
      quantity,
      condition,
      rackLocation: rawRack || undefined,
      serialNumber: rawSerial || undefined,
      notes: rawNotes || undefined
    });
  }

  if (parsedItems.length === 0) {
    throw new Error('No se encontraron registros de materiales válidos en la planilla.');
  }

  return {
    items: parsedItems,
    totalRows: parsedItems.length,
    warnings,
    sheetName: targetSheetName
  };
}
