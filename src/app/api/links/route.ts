import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { NetworkLink } from '@/types/network';

const DATA_DIR = path.join(process.cwd(), 'data');
const LINKS_FILE = path.join(DATA_DIR, 'network_links.json');

export async function GET() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    try {
      const content = await readFile(LINKS_FILE, 'utf-8');
      const links: NetworkLink[] = JSON.parse(content);
      return NextResponse.json(links);
    } catch {
      return NextResponse.json([]);
    }
  } catch (error: unknown) {
    console.error('Error al leer enlaces desde el servidor:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al leer enlaces' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const links: NetworkLink[] = Array.isArray(body) ? body : body.links;

    if (!Array.isArray(links)) {
      return NextResponse.json({ error: 'Formato inválido, se esperaba un array de enlaces' }, { status: 400 });
    }

    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(LINKS_FILE, JSON.stringify(links, null, 2), 'utf-8');

    return NextResponse.json({ success: true, count: links.length });
  } catch (error: unknown) {
    console.error('Error al guardar enlaces en el servidor:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar enlaces' },
      { status: 500 }
    );
  }
}
