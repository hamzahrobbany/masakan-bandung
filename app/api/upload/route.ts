import { randomUUID } from 'node:crypto';
import { NextResponse, NextRequest } from 'next/server';

import { protectAdminRoute } from '@/lib/auth';
import { uploadFoodImage } from '@/lib/supabase';

export const runtime = 'nodejs';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

function buildSafePath(filename: string, mime: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const slug = filename.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase() || 'image';
  const extension = EXTENSION_BY_MIME[mime] ?? 'bin';
  return `uploads/${timestamp}-${randomUUID()}-${slug}.${extension}`;
}

export async function POST(request: NextRequest) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    const mime = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json({ error: 'Format file tidak diizinkan' }, { status: 415 });
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: 'Ukuran file terlalu besar (maksimal 5MB)' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = buildSafePath(file.name, mime);
    const { publicUrl } = await uploadFoodImage({ path, body: buffer, contentType: mime });

    return NextResponse.json({ url: publicUrl }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah gambar' }, { status: 500 });
  }
}
