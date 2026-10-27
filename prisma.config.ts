import { config as loadEnvironment } from "dotenv";
import { defineConfig, env } from "prisma/config";

if (!process.env.DIRECT_URL) {
  loadEnvironment({ path: ".env.local", quiet: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
