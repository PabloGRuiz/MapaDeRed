import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.vsdx': 'application/vnd.ms-visio.drawing',
  '.vsd': 'application/vnd.ms-visio.drawing',
  '.xml': 'application/xml',
  '.drawio': 'application/xml',
  '.dio': 'application/xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Evitar ataques de Path Traversal asegurando solo el nombre base
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'diagrams', safeFilename);

    try {
      await stat(filePath);
    } catch {
      return NextResponse.json({ error: 'Archivo no encontrado en el servidor' }, { status: 404 });
    }

    const data = await readFile(filePath);
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === '1';

    // Para descarga forzada o visualización inline
    const disposition = isDownload
      ? `attachment; filename="${safeFilename}"`
      : `inline; filename="${safeFilename}"`;

    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error: unknown) {
    console.error('Error al servir archivo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al leer archivo' },
      { status: 500 }
    );
  }
}
