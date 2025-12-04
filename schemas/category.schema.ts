import { z } from "zod";

import { standardErrorSchema } from "./common";

export const createCategoryRequestSchema = z.object({
  name: z.string().trim().min(1, { message: "Nama wajib" }),
});

export const categoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const categorySchemaUsageExample = `// Example usage:\n// const validation = validateRequest(createCategoryRequestSchema, payload);\n// if (!validation.success) return NextResponse.json(validation.error, { status: 400 });`;

export { standardErrorSchema };
