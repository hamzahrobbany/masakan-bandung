'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type GenericDatabase = Record<string, never>;

export function createSupabaseBrowserClient(): SupabaseClient<GenericDatabase> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diatur.');
  }
  return createClient<GenericDatabase>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'masakan-bandung-client'
      }
    }
  });
}
