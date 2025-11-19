const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SUPABASE_FOOD_BUCKET = 'masakan-bandung';

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} belum diatur di environment.`);
  }
  return value;
}

const supabaseUrl = requireEnv(SUPABASE_URL, 'SUPABASE_URL');
const supabaseServiceKey = requireEnv(SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
const supabaseAnonKey = requireEnv(SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY');

function buildStorageEndpoint(path: string) {
  return `${supabaseUrl}/storage/v1/object/${path}`;
}

async function requestSignedUploadUrl(path: string, contentType: string) {
  const endpoint = buildStorageEndpoint(`sign/${SUPABASE_FOOD_BUCKET}/${path}`);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: supabaseServiceKey,
      authorization: `Bearer ${supabaseServiceKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      expiresIn: 60,
      upsert: true,
      contentType
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Gagal membuat signed upload URL Supabase');
  }

  const data = (await response.json()) as { signedUrl: string };
  if (!data?.signedUrl) {
    throw new Error('Signed upload URL tidak tersedia.');
  }

  return data.signedUrl;
}

async function uploadToSignedUrl(signedUrl: string, body: Buffer, contentType: string) {
  const response = await fetch(`${supabaseUrl}${signedUrl}`, {
    method: 'PUT',
    headers: {
      'content-type': contentType
    },
    body
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Upload ke signed URL gagal');
  }
}

export async function uploadFoodImage({
  path,
  body,
  contentType
}: {
  path: string;
  body: Buffer;
  contentType: string;
}) {
  const signedUrl = await requestSignedUploadUrl(path, contentType);
  await uploadToSignedUrl(signedUrl, body, contentType);
  return {
    path,
    publicUrl: getPublicUrl(path)
  };
}

export function getPublicUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${SUPABASE_FOOD_BUCKET}/${path}`;
}

export function getPublicAnonHeaders() {
  return {
    apikey: supabaseAnonKey,
    authorization: `Bearer ${supabaseAnonKey}`
  };
}
