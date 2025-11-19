import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth';
import { uploadFoodImage } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
  const path = `${Date.now()}-${safeName}`;
  const { publicUrl } = await uploadFoodImage({ path, body: buffer, contentType: file.type || 'application/octet-stream' });

  return NextResponse.json({ url: publicUrl });
}
