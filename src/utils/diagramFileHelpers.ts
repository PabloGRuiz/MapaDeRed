import { DiagramFileType, NetworkDiagram } from '@/types/network';
import { extractVisioPreview } from './visioParser';
import { parseDrawioXmlToSvg } from './drawioParser';

/**
 * Detecta el tipo de archivo de diagrama según extensión y MIME
 */
export function detectDiagramFileType(fileName: string, mimeType?: string): DiagramFileType {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.endsWith('.svg') || mimeType === 'image/svg+xml') {
    return 'svg';
  }
  
  if (
    lowerName.endsWith('.png') || 
    lowerName.endsWith('.jpg') || 
    lowerName.endsWith('.jpeg') || 
    lowerName.endsWith('.webp') || 
    lowerName.endsWith('.gif') || 
    lowerName.endsWith('.bmp') ||
    (mimeType && mimeType.startsWith('image/'))
  ) {
    return 'image';
  }
  
  if (
    lowerName.endsWith('.drawio') || 
    lowerName.endsWith('.drawio.xml') || 
    lowerName.endsWith('.dio')
  ) {
    return 'drawio';
  }
  
  if (lowerName.endsWith('.xml')) {
    return 'xml';
  }
  
  if (
    lowerName.endsWith('.vsdx') || 
    lowerName.endsWith('.vsd') || 
    (mimeType && mimeType.includes('visio'))
  ) {
    return 'visio';
  }
  
  if (lowerName.endsWith('.pdf') || mimeType === 'application/pdf') {
    return 'pdf';
  }
  
  return 'other';
}

/**
 * Formatea el tamaño en bytes a KB o MB legibles
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Sube físicamente un archivo de diagrama o imagen al servidor local (/api/upload)
 */
export async function uploadDiagramFileToServer(file: File): Promise<{
  success: boolean;
  url: string;
  apiUrl: string;
  savedFileName: string;
  originalName: string;
  fileSize: string;
  sizeBytes: number;
  fileType: DiagramFileType;
  mimeType: string;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error en el servidor (${response.status})`);
  }

  return await response.json();
}

/**
 * Procesa y lee un archivo cargado por el usuario, guardándolo de forma permanente en el servidor
 * y extrayendo automáticamente su visualización si es compatible (Visio, Draw.io, SVG, Imagen)
 */
export async function processUploadedDiagramFile(file: File): Promise<{
  fileName: string;
  fileSize: string;
  fileType: DiagramFileType;
  mimeType: string;
  fileData: string;
  fileUrl?: string;
  svgContent?: string;
  imageUrl?: string;
  xmlContent?: string;
}> {
  const fileType = detectDiagramFileType(file.name, file.type);
  const fileSize = formatFileSize(file.size);
  const mimeType = file.type || 'application/octet-stream';

  // 1. Guardar físicamente el archivo en el disco del servidor local (/public/uploads/diagrams/)
  let serverFileUrl: string | undefined;
  try {
    const serverResult = await uploadDiagramFileToServer(file);
    if (serverResult?.url) {
      serverFileUrl = serverResult.url;
    }
  } catch (serverErr) {
    console.warn('Aviso: Guardado en servidor falló o se ejecuta en entorno offline:', serverErr);
  }

  // 2. Extraer visualización automática según compatibilidad
  if (fileType === 'visio') {
    // Inspeccionar el paquete .vsdx de Visio para extraer miniatura, imágenes o formas vectoriales
    const visioVisual = await extractVisioPreview(file);
    if (visioVisual.hasVisual) {
      return {
        fileName: file.name,
        fileSize,
        fileType,
        mimeType,
        fileData: serverFileUrl || '',
        fileUrl: serverFileUrl,
        imageUrl: visioVisual.imageUrl,
        svgContent: visioVisual.svgContent
      };
    }
  }

  return new Promise((resolve, reject) => {
    const isImageFile = fileType === 'image' || fileType === 'svg';

    if (fileType === 'svg') {
      const textReader = new FileReader();
      textReader.onload = () => {
        const svgText = textReader.result as string;
        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
        resolve({
          fileName: file.name,
          fileSize,
          fileType,
          mimeType,
          fileData: serverFileUrl || dataUrl,
          fileUrl: serverFileUrl,
          svgContent: svgText,
          imageUrl: serverFileUrl || dataUrl
        });
      };
      textReader.onerror = () => reject(new Error('Error al leer SVG'));
      textReader.readAsText(file);
    } else if (fileType === 'xml' || fileType === 'drawio') {
      const textReader = new FileReader();
      textReader.onload = () => {
        const xmlText = textReader.result as string;
        const isDrawioXml = xmlText.includes('<mxfile') || xmlText.includes('<mxGraphModel');
        const resolvedType = isDrawioXml ? 'drawio' : fileType;
        const dataUrl = `data:application/xml;charset=utf-8,${encodeURIComponent(xmlText)}`;
        
        // Generar SVG automático a partir del XML de Draw.io
        const generatedSvg = parseDrawioXmlToSvg(xmlText);
        const autoImageUrl = generatedSvg ? `data:image/svg+xml;utf8,${encodeURIComponent(generatedSvg)}` : undefined;

        resolve({
          fileName: file.name,
          fileSize,
          fileType: resolvedType,
          mimeType: file.type || 'application/xml',
          fileData: serverFileUrl || dataUrl,
          fileUrl: serverFileUrl,
          svgContent: generatedSvg || undefined,
          imageUrl: autoImageUrl,
          xmlContent: xmlText
        });
      };
      textReader.onerror = () => reject(new Error('Error al leer XML/Draw.io'));
      textReader.readAsText(file);
    } else {
      // Para imágenes binarias (PNG, JPG, WEBP) o archivos sin parser
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({
          fileName: file.name,
          fileSize,
          fileType,
          mimeType,
          fileData: serverFileUrl || dataUrl,
          fileUrl: serverFileUrl,
          imageUrl: isImageFile ? (serverFileUrl || dataUrl) : undefined
        });
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Descarga el archivo de diagrama original preservando su contenido y extensión,
 * priorizando la ruta física en el servidor
 */
export function downloadDiagramFile(diagram: NetworkDiagram): void {
  const fileName = diagram.fileName || diagram.vsdxFileName || 'esquema_red';

  // Si existe en el servidor local, descargar directamente desde la ruta física
  if (diagram.fileUrl) {
    const safeFile = diagram.fileUrl.split('/').pop();
    const downloadUrl = `/api/files/${safeFile}?download=1`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  if (diagram.fileData) {
    const a = document.createElement('a');
    a.href = diagram.fileData;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  if (diagram.imageUrl) {
    const a = document.createElement('a');
    a.href = diagram.imageUrl.startsWith('/uploads/') 
      ? `/api/files/${diagram.imageUrl.split('/').pop()}?download=1` 
      : diagram.imageUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  if (diagram.xmlContent) {
    const blob = new Blob([diagram.xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  if (diagram.svgContent) {
    const blob = new Blob([diagram.svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.svg') ? fileName : `${fileName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // Fallback genérico
  const blob = new Blob(['Archivo de esquema de red'], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
