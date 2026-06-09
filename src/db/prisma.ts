/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrismaClient } from "@prisma/client";

let prismaClientInstance: PrismaClient | null = null;
let isDbConfigured = false;

export function getPrismaClient(): PrismaClient | null {
  if (prismaClientInstance) {
    return prismaClientInstance;
  }

  const url = process.env.DATABASE_URL;
  if (
    !url ||
    url.includes("your-password") ||
    url === "" ||
    !url.startsWith("mysql://")
  ) {
    console.warn(
      "⚠️ [Prisma Services] DATABASE_URL is not set or is not a valid MySQL protocol connection string. Dynamic endpoints will function in robust stateful mock/file fallback mode.",
    );
    isDbConfigured = false;
    return null;
  }

  try {
    prismaClientInstance = new PrismaClient({
      datasources: {
        db: {
          url: url,
        },
      },
    });
    isDbConfigured = true;
    console.log(
      "✅ [Prisma Client] Database Engine initialized with connection pooling constraints.",
    );
    return prismaClientInstance;
  } catch (err) {
    console.error("❌ [Prisma Client] Connection initialization error:", err);
    isDbConfigured = false;
    return null;
  }
}

export function isDatabaseConnected(): boolean {
  return isDbConfigured && prismaClientInstance !== null;
}
