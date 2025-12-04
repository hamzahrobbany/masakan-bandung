import { z } from "@/lib/zod";

import { optionalSanitizedString, standardErrorSchema } from "./common";

export const createFoodRequestSchema = z.object({
  name: z.string().trim().min(1, { message: "Nama wajib diisi" }),
  price: z.number().nonnegative({ message: "Harga tidak boleh negatif" }),
  description: optionalSanitizedString,
  imageUrl: optionalSanitizedString,
  categoryId: z.string().trim().min(1, { message: "Kategori wajib dipilih" }),
  stock: z.number().int().nonnegative({ message: "Stok tidak boleh negatif" }).optional(),
  rating: z
    .number()
    .min(0, { message: "Rating harus di antara 0 hingga 5" })
    .max(5, { message: "Rating harus di antara 0 hingga 5" })
    .optional(),
  isFeatured: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

export const foodResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  description: optionalSanitizedString,
  imageUrl: z.string().optional(),
  categoryId: z.string(),
  stock: z.number(),
  rating: z.number(),
  isFeatured: z.boolean(),
  isAvailable: z.boolean(),
});

export const foodSchemaUsageExample = `// Example usage:\n// const validation = validateRequest(createFoodRequestSchema, payload);\n// if (!validation.success) return NextResponse.json(validation.error, { status: 400 });`;

export { standardErrorSchema };
