export const CURRENCY_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

export function formatCurrency(value: number) {
  return CURRENCY_FORMATTER.format(Number.isFinite(value) ? value : 0);
}

export type WhatsAppCartItem = {
  name: string;
  quantity: number;
  price: number;
};

export function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

export function isValidWhatsAppNumber(value: string) {
  const normalized = normalizeWhatsAppNumber(value);
  return normalized.startsWith('62') && normalized.length >= 10 && normalized.length <= 15;
}

export function buildWhatsAppMessage(
  items: WhatsAppCartItem[],
  options?: { customerName?: string | null; customerPhone?: string | null; note?: string | null }
) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = items.length
    ? items.map((item) => `- ${item.name} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}`)
    : ['(Belum ada item di keranjang)'];
  const identityLines = [options?.customerName ? `Nama: ${options.customerName}` : null]
    .concat(options?.customerPhone ? `No. WhatsApp: ${options.customerPhone}` : null)
    .concat(options?.note ? `Catatan: ${options.note}` : null)
    .filter(Boolean) as string[];

  return [
    'Halo, saya mau pesan:',
    ...lines,
    `Total: ${formatCurrency(total)}`,
    identityLines.length ? '' : null,
    identityLines.length ? 'Detail pemesan:' : null,
    ...identityLines
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildWhatsAppUrl(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const CART_STORAGE_KEY = 'masakan-bandung-cart';
