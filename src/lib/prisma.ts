import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const isDev = process.env.NODE_ENV !== "production";

/**
 * Singleton PrismaClient pour éviter l'épuisement des connexions en développement.
 * Logs SQL uniquement en dev (évite fuite de données en prod).
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: isDev ? ["query", "error", "warn"] : ["error"],
  });

if (isDev) globalForPrisma.prisma = prisma;
