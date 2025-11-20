// lib/env.seed.ts

import 'dotenv/config';

export const serverEnv = {
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'seed-jwt',
  adminSecret: process.env.ADMIN_SECRET || 'seed-admin',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseBucket: process.env.SUPABASE_BUCKET || '',
  adminWhatsapp: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '',
};
