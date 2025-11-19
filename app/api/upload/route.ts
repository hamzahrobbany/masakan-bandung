import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRoute } from '@/lib/auth';
import { uploadFoodImage } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9.]+/g, '-').toLowerCase();
  const path = `uploads/${Date.now()}-${randomUUID()}-${safeName}`;
  const { publicUrl } = await uploadFoodImage({ path, body: buffer, contentType: file.type || 'application/octet-stream' });

  return NextResponse.json({ url: publicUrl });
}
