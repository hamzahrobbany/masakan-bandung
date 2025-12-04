'use client';

import { ADMIN_TOKEN_STORAGE_KEY } from '@/lib/security';

let pendingTokenRequest: Promise<string> | null = null;

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

async function requestNewAdminToken() {
  if (typeof window === 'undefined') {
    throw new Error('Token admin hanya tersedia di browser.');
  }

  const response = await fetch('/api/admin/session', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Sesi admin tidak valid. Silakan login ulang.');
  }

  const data = (await response.json()) as {
    success: boolean;
    data?: { csrfToken?: string };
  };
  const csrfToken = data?.data?.csrfToken;

  if (!csrfToken) {
    throw new Error('Token admin tidak tersedia. Silakan login ulang.');
  }

  saveAdminToken(csrfToken);
  return csrfToken;
}

export async function ensureAdminToken() {
  const existing = readAdminToken();
  if (existing) return existing;

  if (!pendingTokenRequest) {
    pendingTokenRequest = requestNewAdminToken().catch((error) => {
      clearAdminToken();
      throw error;
    }).finally(() => {
      pendingTokenRequest = null;
    });
  }

  return pendingTokenRequest;
}
