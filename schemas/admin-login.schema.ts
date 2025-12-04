import { z } from "@/lib/zod";

import { ADMIN_ROUTE_PREFIX } from "@/lib/security";
import { optionalSanitizedString, standardErrorSchema } from "./common";

const sanitizeRedirect = (target: string | null | undefined) => {
  if (!target) return ADMIN_ROUTE_PREFIX;
  return target.startsWith(ADMIN_ROUTE_PREFIX) ? target : ADMIN_ROUTE_PREFIX;
};

export const adminLoginRequestSchema = z.object({
  email: z.string().trim().min(1, { message: "Email wajib diisi" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
  redirect: optionalSanitizedString.transform((value) => sanitizeRedirect(value)),
});

export const adminLoginResponseSchema = z.object({
  redirect: z.string(),
});

export const adminLoginSchemaUsageExample = `// Example usage:\n// const validation = validateRequest(adminLoginRequestSchema, payload);\n// if (!validation.success) return redirectWithError(req, validation.error.error, payload.redirect);`;

export { standardErrorSchema };
