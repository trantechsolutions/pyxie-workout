import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Read DATABASE_URL lazily at request time so the module is importable
// in environments where the env var is not yet provisioned (e.g. tests,
// build step, local dev pre-`vercel env pull`).
export function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(url);
}
