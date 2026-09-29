import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { detectDiagramFileType, formatFileSize } from '@/utils/diagramFileHelpers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    // Carpeta en el servidor local donde se guardan físicamente los archivos
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'diagrams');
    await mkdir(uploadDir, { recursive: true });

    // Sanitizar nombre de archivo y agregar timestamp para evitar colisiones
    const timestamp = Date.now();
    const originalName = file.name;
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const savedFileName = `${timestamp}_${sanitizedName}`;
    const targetFilePath = path.join(uploadDir, savedFileName);

    // Escribir los bytes físicamente en el disco
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(targetFilePath, buffer);

    const fileType = detectDiagramFileType(originalName, file.type);
    const publicUrl = `/uploads/diagrams/${savedFileName}`;
    const apiUrl = `/api/files/${savedFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      apiUrl,
      savedFileName,
      originalName,
      fileSize: formatFileSize(file.size),
      sizeBytes: file.size,
      fileType,
      mimeType: file.type || 'application/octet-stream'
    });
  } catch (error: unknown) {
    console.error('Error al guardar archivo en el servidor:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno al escribir archivo' },
      { status: 500 }
    );
  }
}
