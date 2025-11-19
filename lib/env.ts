import 'server-only';

type EnvKey =
  | 'DATABASE_URL'
  | 'JWT_SECRET'
  | 'ADMIN_SECRET'
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'SUPABASE_BUCKET'
  | 'NEXT_PUBLIC_ADMIN_WHATSAPP';

function readEnv(key: EnvKey) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} belum diatur. Isi di .env.local atau dashboard hosting.`);
  }
  return value;
}

export const serverEnv = {
  databaseUrl: readEnv('DATABASE_URL'),
  jwtSecret: readEnv('JWT_SECRET'),
  adminSecret: readEnv('ADMIN_SECRET'),
  supabaseUrl: readEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseBucket: readEnv('SUPABASE_BUCKET'),
  adminWhatsapp: readEnv('NEXT_PUBLIC_ADMIN_WHATSAPP')
} as const;

export type ServerEnv = typeof serverEnv;
