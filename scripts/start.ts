import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prismaCli = "node_modules/prisma/build/index.js";
const maxAttempts = Number(process.env.DB_INIT_MAX_ATTEMPTS || 15);
const retryMs = Number(process.env.DB_INIT_RETRY_MS || 3000);

function runNodeScript(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code}: node ${args.join(" ")}`));
    });

    child.on("error", reject);
  });
}

async function ensureDatabaseReady() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log(`[bootstrap] Running prisma db push (attempt ${attempt}/${maxAttempts})...`);
      await runNodeScript([prismaCli, "db", "push", "--accept-data-loss"]);
      console.log("[bootstrap] Database schema is ready.");
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.log(`[bootstrap] Database not ready yet. Retrying in ${retryMs}ms...`);
      await delay(retryMs);
    }
  }
}

async function seedIfEmpty() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    const adminCount = await prisma.adminUser.count();

    if (adminCount > 0) {
      console.log(`[bootstrap] Seed skipped. Found ${adminCount} admin user(s).`);
      return;
    }

    console.log("[bootstrap] No admin user found. Running prisma db seed...");
    await runNodeScript([prismaCli, "db", "seed"]);
    console.log("[bootstrap] Seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

function startServer() {
  const child = spawn(process.execPath, ["server.js"], {
    stdio: "inherit",
    env: process.env,
  });

  const forwardSignal = (signal: NodeJS.Signals) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", forwardSignal);
  process.on("SIGTERM", forwardSignal);

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error("[bootstrap] Failed to start Next server:", error);
    process.exit(1);
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required before starting the app.");
  }

  await ensureDatabaseReady();
  await seedIfEmpty();
  startServer();
}

main().catch((error) => {
  console.error("[bootstrap] Startup failed:", error);
  process.exit(1);
});
