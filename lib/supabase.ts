const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_FOOD_BUCKET = 'foods';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables belum lengkap. Pastikan .env.local diisi.');
}

export async function uploadFoodImage({
  path,
  body,
  contentType
}: {
  path: string;
  body: ArrayBuffer | Buffer;
  contentType: string;
}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables belum diatur.');
  }

  const endpoint = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_FOOD_BUCKET}/${path}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'content-type': contentType,
      'x-upsert': 'true'
    },
    body: body instanceof Buffer ? body : Buffer.from(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Gagal upload ke Supabase');
  }

  return {
    path,
    publicUrl: getPublicUrl(path)
  };
}

export function getPublicUrl(path: string) {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL belum tersedia');
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_FOOD_BUCKET}/${path}`;
}
