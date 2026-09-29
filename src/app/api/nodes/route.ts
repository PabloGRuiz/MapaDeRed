import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { NetworkNode } from '@/types/network';

const DATA_DIR = path.join(process.cwd(), 'data');
const NODES_FILE = path.join(DATA_DIR, 'network_nodes.json');

export async function GET() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    try {
      const content = await readFile(NODES_FILE, 'utf-8');
      const nodes: NetworkNode[] = JSON.parse(content);
      return NextResponse.json(nodes);
    } catch {
      // Si el archivo no existe aún, retornar lista vacía
      return NextResponse.json([]);
    }
  } catch (error: unknown) {
    console.error('Error al leer puestos desde el servidor:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al leer datos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nodes: NetworkNode[] = Array.isArray(body) ? body : body.nodes;

    if (!Array.isArray(nodes)) {
      return NextResponse.json({ error: 'Formato inválido, se esperaba un array de puestos' }, { status: 400 });
    }

    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(NODES_FILE, JSON.stringify(nodes, null, 2), 'utf-8');

    return NextResponse.json({ success: true, count: nodes.length });
  } catch (error: unknown) {
    console.error('Error al guardar puestos en el servidor:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar datos' },
      { status: 500 }
    );
  }
}
