import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { serverEnv } from '@/lib/env';

type GenericDatabase = Record<string, never>;

export function createSupabaseServerClient(): SupabaseClient<GenericDatabase> {
  return createClient<GenericDatabase>(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'X-Client-Info': 'masakan-bandung-server'
      }
    }
  });
}

export async function uploadImageToBucket({
  filePath,
  data,
  contentType
}: {
  filePath: string;
  data: ArrayBuffer;
  contentType: string;
}) {
  const client = createSupabaseServerClient();
  const storage = client.storage.from(serverEnv.supabaseBucket);

  const { error } = await storage.upload(filePath, data, {
    cacheControl: '3600',
    contentType,
    upsert: true
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicUrlData } = storage.getPublicUrl(filePath);
  if (!publicUrlData?.publicUrl) {
    throw new Error('Gagal menghasilkan URL publik untuk file yang diunggah.');
  }

  return {
    path: filePath,
    publicUrl: publicUrlData.publicUrl
  };
}
