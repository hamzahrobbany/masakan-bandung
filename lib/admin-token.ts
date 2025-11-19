'use client';

import { ADMIN_TOKEN_STORAGE_KEY } from '@/lib/security';

export function saveAdminToken(token: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

export function readAdminToken() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}
