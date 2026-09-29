/**
 * Parsea un diagrama de Draw.io (.drawio / .xml) y genera un SVG dinámico para nuestro display
 */
export function parseDrawioXmlToSvg(xmlText: string): string | null {
  try {
    if (typeof DOMParser === 'undefined') {
      return null;
    }
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const cells = xmlDoc.querySelectorAll('mxCell');
    if (!cells || cells.length === 0) return null;

    interface DrawioNode {
      id: string;
      value: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fillColor: string;
      strokeColor: string;
    }

    interface DrawioEdge {
      id: string;
      source?: string;
      target?: string;
      value?: string;
      points?: { x: number; y: number }[];
    }

    const nodes: DrawioNode[] = [];
    const edges: DrawioEdge[] = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    cells.forEach(cell => {
      const id = cell.getAttribute('id') || '';
      const value = cell.getAttribute('value') || '';
      const vertex = cell.getAttribute('vertex');
      const edge = cell.getAttribute('edge');
      const style = cell.getAttribute('style') || '';

      const geo = cell.querySelector('mxGeometry');

      if (vertex === '1' && geo) {
        const x = parseFloat(geo.getAttribute('x') || '0');
        const y = parseFloat(geo.getAttribute('y') || '0');
        const width = parseFloat(geo.getAttribute('width') || '120');
        const height = parseFloat(geo.getAttribute('height') || '60');

        // Parse colors from style string (e.g. fillColor=#dae8fc;strokeColor=#6c8ebf;)
        let fillColor = 'rgba(15, 23, 42, 0.9)';
        let strokeColor = '#00f2fe';

        if (style.includes('fillColor=')) {
          const match = style.match(/fillColor=([^;]+)/);
          if (match) fillColor = match[1];
        }
        if (style.includes('strokeColor=')) {
          const match = style.match(/strokeColor=([^;]+)/);
          if (match) strokeColor = match[1];
        }

        nodes.push({ id, value, x, y, width, height, fillColor, strokeColor });

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + width > maxX) maxX = x + width;
        if (y + height > maxY) maxY = y + height;
      } else if (edge === '1') {
        const source = cell.getAttribute('source') || undefined;
        const target = cell.getAttribute('target') || undefined;
        edges.push({ id, source, target, value });
      }
    });

    if (nodes.length === 0) return null;

    const padding = 60;
    const viewWidth = Math.max(maxX - minX + padding * 2, 450);
    const viewHeight = Math.max(maxY - minY + padding * 2, 320);

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Generar líneas de conexión
    const edgeSvgs = edges.map(e => {
      const src = e.source ? nodeMap.get(e.source) : null;
      const tgt = e.target ? nodeMap.get(e.target) : null;

      if (src && tgt) {
        const x1 = src.x - minX + padding + src.width / 2;
        const y1 = src.y - minY + padding + src.height / 2;
        const x2 = tgt.x - minX + padding + tgt.width / 2;
        const y2 = tgt.y - minY + padding + tgt.height / 2;

        return `
          <g class="drawio-edge">
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3b82f6" stroke-width="2.5" stroke-opacity="0.85" />
            <circle cx="${x1}" cy="${y1}" r="3.5" fill="#00f2fe" />
            <circle cx="${x2}" cy="${y2}" r="3.5" fill="#3b82f6" />
            ${e.value ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" fill="#94a3b8" font-size="10" text-anchor="middle">${escapeXml(e.value)}</text>` : ''}
          </g>
        `;
      }
      return '';
    }).join('\n');

    // Generar cajas de nodos
    const nodeSvgs = nodes.map(n => {
      const posX = n.x - minX + padding;
      const posY = n.y - minY + padding;

      return `
        <g class="drawio-node" transform="translate(${posX}, ${posY})">
          <rect
            width="${n.width}"
            height="${n.height}"
            rx="8"
            fill="${n.fillColor.startsWith('#') ? n.fillColor : 'rgba(15, 23, 42, 0.92)'}"
            stroke="${n.strokeColor.startsWith('#') ? n.strokeColor : '#00f2fe'}"
            stroke-width="1.8"
            filter="drop-shadow(0 4px 14px rgba(0, 242, 254, 0.2))"
          />
          <text
            x="${n.width / 2}"
            y="${n.height / 2 + 4}"
            fill="#ffffff"
            font-size="12"
            font-family="system-ui, sans-serif"
            font-weight="600"
            text-anchor="middle"
          >${escapeXml(n.value.slice(0, 30) || 'Nodo de Red')}</text>
        </g>
      `;
    }).join('\n');

    return `
      <svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="drawio-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#0c1326" />
            <stop offset="100%" stop-color="#060912" />
          </radialGradient>
        </defs>
        <rect width="${viewWidth}" height="${viewHeight}" fill="url(#drawio-bg)" />
        <g stroke="rgba(255,255,255,0.04)" stroke-width="1">
          ${Array.from({ length: Math.ceil(viewWidth / 35) }, (_, i) => `<line x1="${i * 35}" y1="0" x2="${i * 35}" y2="${viewHeight}" />`).join('')}
          ${Array.from({ length: Math.ceil(viewHeight / 35) }, (_, i) => `<line x1="0" y1="${i * 35}" x2="${viewWidth}" y2="${i * 35}" />`).join('')}
        </g>
        ${edgeSvgs}
        ${nodeSvgs}
      </svg>
    `.trim();
  } catch (err) {
    console.warn('Error al parsear Draw.io XML a SVG:', err);
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
