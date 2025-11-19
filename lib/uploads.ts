import { randomUUID } from 'node:crypto';

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_UPLOAD_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

export type AcceptedMime = (typeof ALLOWED_UPLOAD_MIME)[number];

export function buildUploadPath(filename: string, mime: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const slug = filename.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase() || 'image';
  const extension = EXTENSION_BY_MIME[mime] ?? 'bin';
  return `uploads/${timestamp}-${randomUUID()}-${slug}.${extension}`;
}

export function assertValidUpload({
  size,
  type,
  maxSize = MAX_UPLOAD_SIZE_BYTES
}: {
  size: number;
  type: string;
  maxSize?: number;
}) {
  const mime = type || 'application/octet-stream';
  if (!ALLOWED_UPLOAD_MIME.includes(mime as AcceptedMime)) {
    throw new Error('Format file tidak diizinkan.');
  }
  if (size > maxSize) {
    throw new Error('Ukuran file terlalu besar (maksimal 5MB).');
  }
  return mime;
}
