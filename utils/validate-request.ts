import { ZodError } from "@/lib/zod";

type ZodSchema<T> = {
  safeParse: (
    input: unknown
  ) => { success: true; data: T } | { success: false; error: ZodError };
};

type StandardizedError = { error: string; details?: string[] };

export function validateRequest<T>(
  schema: ZodSchema<T>,
  payload: unknown,
  options?: { errorMessage?: string }
): { success: true; data: T } | { success: false; error: StandardizedError } {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return { success: true, data: parsed.data };

  const details = parsed.error.issues.map((issue) => issue.message);
  return {
    success: false,
    error: {
      error: options?.errorMessage ?? "Payload tidak valid",
      ...(details.length ? { details } : {}),
    },
  };
}
