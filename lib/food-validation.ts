export type FoodPayload = {
  name: string;
  price: number;
  imageUrl: string;
  description: string | null;
  categoryId: string | null;
};

type FoodPayloadInput = {
  name?: unknown;
  price?: unknown;
  imageUrl?: unknown;
  description?: unknown;
  categoryId?: unknown;
};

export function sanitizeFoodPayload(body: unknown): { error?: string; value?: FoodPayload } {
  if (!body || typeof body !== 'object') {
    return { error: 'Payload tidak valid' };
  }
  const payload = body as FoodPayloadInput;
  if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    return { error: 'Nama makanan wajib diisi' };
  }
  const price = Number(payload.price);
  if (!Number.isFinite(price) || price < 0) {
    return { error: 'Harga makanan tidak valid' };
  }
  if (typeof payload.imageUrl !== 'string' || payload.imageUrl.trim().length === 0) {
    return { error: 'URL gambar wajib diisi' };
  }
  const name = payload.name.trim();
  const imageUrl = payload.imageUrl.trim();
  const descriptionInput = typeof payload.description === 'string' ? payload.description.trim() : '';
  const description = descriptionInput.length > 0 ? descriptionInput : null;
  const categoryId =
    typeof payload.categoryId === 'string' && payload.categoryId.trim().length > 0
      ? payload.categoryId.trim()
      : null;

  return {
    value: {
      name,
      price,
      imageUrl,
      description,
      categoryId
    }
  };
}
