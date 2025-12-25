import { execSync } from "node:child_process";

declare global {
  // eslint-disable-next-line no-var
  var __dbReady: boolean | undefined;
}

export function ensureDbSchema() {
  if (global.__dbReady) return;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for DB-backed tests.");
  }
  execSync("npx prisma generate", { stdio: "inherit" });
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
  global.__dbReady = true;
}

