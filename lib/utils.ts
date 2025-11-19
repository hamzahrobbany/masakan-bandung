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

export function buildWhatsAppMessage(items: WhatsAppCartItem[]) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = items.length
    ? items.map((item) => `- ${item.name} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}`)
    : ['(Belum ada item di keranjang)'];
  return `Halo, saya mau pesan:\n${lines.join('\n')}\nTotal: ${formatCurrency(total)}`;
}

export function buildWhatsAppUrl(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const CART_STORAGE_KEY = 'masakan-bandung-cart';
