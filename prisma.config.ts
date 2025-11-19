import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Ensure Prisma config gets values even when CLI doesn't auto-load .env files
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
