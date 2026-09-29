import JSZip from 'jszip';

export interface VisioExtractionResult {
  hasVisual: boolean;
  imageUrl?: string;
  svgContent?: string;
  pageTitle?: string;
  shapeCount?: number;
}

/**
 * Inspecciona un archivo .vsdx de Microsoft Visio y extrae su previsualización visual:
 * 1. Miniatura o imagen guardada en docProps/thumbnail.png (alta fidelidad nativa de Visio)
 * 2. Imágenes incrustadas en visio/media/
 * 3. Formas vectoriales y textos en visio/pages/page1.xml convertidos a SVG
 */
export async function extractVisioPreview(file: File | ArrayBuffer): Promise<VisioExtractionResult> {
  try {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);

    // Estrategia 1: Buscar thumbnail oficial de Visio (docProps/thumbnail.png o jpeg)
    const thumbnailFiles = [
      'docProps/thumbnail.png',
      'docProps/thumbnail.jpeg',
      'docProps/thumbnail.jpg',
      'package/thumbnails/thumbnail.png',
      'package/thumbnails/thumbnail.jpeg'
    ];

    for (const thumbPath of thumbnailFiles) {
      const entry = loadedZip.file(thumbPath);
      if (entry) {
        const base64 = await entry.async('base64');
        const mime = thumbPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
        return {
          hasVisual: true,
          imageUrl: `data:${mime};base64,${base64}`,
          pageTitle: 'Miniatura Oficial de Visio'
        };
      }
    }

    // Estrategia 2: Buscar imágenes o planos exportados dentro de visio/media/
    const mediaFiles = Object.keys(loadedZip.files).filter(path => 
      path.startsWith('visio/media/') && 
      (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.svg'))
    );

    if (mediaFiles.length > 0) {
      const bestMedia = mediaFiles[0];
      const entry = loadedZip.file(bestMedia);
      if (entry) {
        if (bestMedia.endsWith('.svg')) {
          const svgText = await entry.async('text');
          return {
            hasVisual: true,
            svgContent: svgText,
            imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`,
            pageTitle: 'Plano Vectorial Visio'
          };
        } else {
          const base64 = await entry.async('base64');
          const mime = bestMedia.endsWith('.png') ? 'image/png' : 'image/jpeg';
          return {
            hasVisual: true,
            imageUrl: `data:${mime};base64,${base64}`,
            pageTitle: 'Esquema de Red Incrustado'
          };
        }
      }
    }

    // Estrategia 3: Parsear formas vectoriales desde visio/pages/page1.xml
    const pageEntry = loadedZip.file('visio/pages/page1.xml') || 
                      loadedZip.file('visio/pages/page.xml') ||
                      Object.keys(loadedZip.files).find(p => p.startsWith('visio/pages/') && p.endsWith('.xml') && !p.endsWith('pages.xml'));

    if (pageEntry) {
      const entryObj = typeof pageEntry === 'string' ? loadedZip.file(pageEntry) : pageEntry;
      if (entryObj) {
        const xmlText = await entryObj.async('text');
        const generatedSvg = parseVisioPageXmlToSvg(xmlText);
        if (generatedSvg) {
          return {
            hasVisual: true,
            svgContent: generatedSvg,
            imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(generatedSvg)}`,
            pageTitle: 'Diagrama Vectorial Visio'
          };
        }
      }
    }

    return { hasVisual: false };
  } catch (err) {
    console.warn('No se pudo extraer previsualización interna de Visio:', err);
    return { hasVisual: false };
  }
}

/**
 * Convierte el XML de una página de Visio (page1.xml) a un SVG estilizado para nuestro display
 */
export function parseVisioPageXmlToSvg(xmlText: string): string | null {
  try {
    if (typeof DOMParser === 'undefined') {
      return null;
    }
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const shapeNodes = xmlDoc.querySelectorAll('Shape');
    if (!shapeNodes || shapeNodes.length === 0) return null;

    interface VisioShape {
      id: string;
      name: string;
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }

    const shapes: VisioShape[] = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    shapeNodes.forEach((shape) => {
      const id = shape.getAttribute('ID') || Math.random().toString();
      const name = shape.getAttribute('Name') || shape.getAttribute('NameU') || 'Elemento';
      
      let text = '';
      const textNode = shape.querySelector('Text');
      if (textNode) {
        text = textNode.textContent?.trim() || '';
      }

      // Extraer celdas de posición y dimensión
      let pinX = 0, pinY = 0, width = 1.2, height = 0.8;
      const cells = shape.querySelectorAll('Cell');
      cells.forEach(cell => {
        const n = cell.getAttribute('N');
        const v = parseFloat(cell.getAttribute('V') || '0');
        if (!isNaN(v)) {
          if (n === 'PinX') pinX = v;
          if (n === 'PinY') pinY = v;
          if (n === 'Width') width = Math.max(v, 0.4);
          if (n === 'Height') height = Math.max(v, 0.4);
        }
      });

      // Normalizar escala a píxeles (Visio usa pulgadas o mm por defecto en V)
      const scale = 72; // 72 DPI estándar
      const x = (pinX - width / 2) * scale;
      const y = (pinY - height / 2) * scale;
      const w = width * scale;
      const h = height * scale;

      shapes.push({ id, name, text: text || name, x, y, width: w, height: h });

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + w > maxX) maxX = x + w;
      if (y + h > maxY) maxY = y + h;
    });

    if (shapes.length === 0) return null;

    // Normalizar coordenadas para vista SVG
    const padding = 50;
    const viewWidth = Math.max(maxX - minX + padding * 2, 400);
    const viewHeight = Math.max(maxY - minY + padding * 2, 300);

    const svgElements = shapes.map(s => {
      const posX = s.x - minX + padding;
      const posY = s.y - minY + padding;
      const isConnection = s.width < 10 || s.height < 10;

      if (isConnection) {
        return `<line x1="${posX}" y1="${posY}" x2="${posX + s.width}" y2="${posY + s.height}" stroke="#00f2fe" stroke-width="2" stroke-dasharray="4,2" />`;
      }

      return `
        <g class="visio-shape" transform="translate(${posX}, ${posY})">
          <rect
            width="${s.width}"
            height="${s.height}"
            rx="6"
            fill="rgba(15, 23, 42, 0.92)"
            stroke="#00f2fe"
            stroke-width="1.5"
            filter="drop-shadow(0 4px 12px rgba(0, 242, 254, 0.25))"
          />
          <rect
            width="${s.width}"
            height="18"
            rx="6"
            fill="rgba(0, 242, 254, 0.15)"
          />
          <text
            x="${s.width / 2}"
            y="${s.height / 2 + 4}"
            fill="#ffffff"
            font-size="11"
            font-family="system-ui, sans-serif"
            font-weight="600"
            text-anchor="middle"
          >${escapeXml(s.text.slice(0, 28))}</text>
        </g>
      `;
    }).join('\n');

    return `
      <svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="visio-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#0a1224" />
            <stop offset="100%" stop-color="#040812" />
          </radialGradient>
        </defs>
        <rect width="${viewWidth}" height="${viewHeight}" fill="url(#visio-bg)" />
        <g stroke="rgba(255,255,255,0.04)" stroke-width="1">
          ${Array.from({ length: Math.ceil(viewWidth / 40) }, (_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="${viewHeight}" />`).join('')}
          ${Array.from({ length: Math.ceil(viewHeight / 40) }, (_, i) => `<line x1="0" y1="${i * 40}" x2="${viewWidth}" y2="${i * 40}" />`).join('')}
        </g>
        ${svgElements}
      </svg>
    `.trim();
  } catch (e) {
    console.warn('Error al convertir XML de página Visio a SVG:', e);
    return null;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
