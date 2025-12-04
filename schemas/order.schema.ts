import { OrderStatus } from "@prisma/client";
import { z } from "zod";

import { optionalSanitizedString, standardErrorSchema } from "./common";

const orderItemSchema = z.object({
  foodId: z.string().trim().min(1, { message: "ID menu wajib diisi" }),
  quantity: z.number().int().positive({ message: "Jumlah harus lebih dari 0" }),
});

const cartItemSchema = z
  .object({
    id: z.string().trim().optional(),
    foodId: z.string().trim().optional(),
    quantity: z.number().int().positive().optional(),
    qty: z.number().int().positive().optional(),
  })
  .transform((item) => ({
    foodId: (item.foodId || item.id || "").trim(),
    quantity: item.quantity ?? item.qty ?? 0,
  }));

export const orderDetailRequestSchema = z.object({
  ids: z.preprocess(
    (value) =>
      typeof value === "string"
        ? value
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : value,
    z.array(z.string().min(1)).nonempty({ message: "Parameter ids wajib diisi" })
  ),
});

export const orderDetailResponseSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        stock: z.number(),
        isAvailable: z.boolean(),
      })
    )
    .nonempty(),
});

export const createOrderRequestSchema = z
  .object({
    customerName: optionalSanitizedString,
    customerPhone: optionalSanitizedString,
    note: optionalSanitizedString,
    items: z.array(orderItemSchema).nonempty().optional(),
    cartItems: z.array(cartItemSchema).nonempty().optional(),
  })
  .refine((data) => Boolean(data.items || data.cartItems), {
    message: "Item pesanan tidak valid",
    path: ["items"],
  })
  .transform((data) => {
    const normalized = data.items ?? data.cartItems ?? [];
    const cleaned = normalized.filter((item) => item.foodId && item.quantity > 0);
    return {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      note: data.note,
      items: cleaned,
    };
  })
  .refine((data) => data.items.length > 0, {
    message: "Item pesanan tidak valid",
    path: ["items"],
  });

export const createOrderResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export const adminOrderRequestSchema = z
  .object({
    customerName: optionalSanitizedString,
    customerPhone: optionalSanitizedString,
    note: optionalSanitizedString,
    status: optionalSanitizedString,
    items: z.array(orderItemSchema).nonempty(),
  })
  .transform((data) => ({
    ...data,
    status: (data.status as OrderStatus | null) ?? OrderStatus.PENDING,
  }))
  .refine((data) =>
    [
      OrderStatus.PENDING,
      OrderStatus.PROCESSED,
      OrderStatus.DONE,
      OrderStatus.CANCELLED,
    ].includes(data.status),
  {
    message: "Status tidak valid",
    path: ["status"],
  });

export const adminOrderQuerySchema = z.object({
  search: optionalSanitizedString,
  page: z.preprocess(
    (value) => {
      const parsed = Number(value ?? 1);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    },
    z.number().int().positive()
  ),
  pageSize: z.preprocess(
    (value) => {
      const parsed = Number(value ?? 10);
      if (!Number.isFinite(parsed) || parsed <= 0) return 10;
      return Math.min(parsed, 50);
    },
    z.number().int().positive()
  ),
  status: optionalSanitizedString,
});

export const orderSchemaUsageExample = `// Example usage:\n// const validation = validateRequest(createOrderRequestSchema, payload);\n// if (!validation.success) return NextResponse.json(validation.error, { status: 400 });`;

export { standardErrorSchema };
