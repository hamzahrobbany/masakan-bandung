// prisma/config.ts
import { defineConfig } from "prisma/config";

// Prisma 6 configuration file
export default defineConfig({
  // Enable accelerated client for Vercel/Serverless
  client: {
    engineType: "dataproxy", // recommended for Vercel + Neon
  },
});
