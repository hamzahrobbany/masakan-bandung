import { z } from "@/lib/zod";

export const optionalSanitizedString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

export const standardErrorSchema = z.object({
  error: z.string(),
  details: z.array(z.string()).optional(),
});

export type StandardErrorShape = typeof standardErrorSchema;
