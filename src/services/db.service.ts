/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development (due to hot reloading/re-execution)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'info' },
      { emit: 'stdout', level: 'warn' },
      { emit: 'stdout', level: 'error' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export class DbService {
  private static instance: PrismaClient = prisma;

  /**
   * Retrieves the singleton Prisma Client instance.
   */
  public static getInstance(): PrismaClient {
    return DbService.instance;
  }

  /**
   * Attempts to establish a database connection with retry logic.
   * Useful during startup when the database might be booting up.
   */
  public static async connectWithRetry(retries = 5, delayMs = 3000): Promise<void> {
    const client = DbService.getInstance();
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[DbService] Connecting to database... (Attempt ${attempt}/${retries})`);
        await client.$connect();
        console.log('[DbService] Database connection established successfully.');
        return;
      } catch (error) {
        console.error(`[DbService] Connection attempt ${attempt} failed:`, error);
        if (attempt === retries) {
          throw new Error('[DbService] Max connection retries reached. Could not connect to database.');
        }
        console.log(`[DbService] Retrying in ${delayMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Gracefully disconnects Prisma Client on process shutdown.
   */
  public static async shutdown(): Promise<void> {
    console.log('[DbService] Disconnecting database client...');
    try {
      await DbService.instance.$disconnect();
      console.log('[DbService] Database client disconnected successfully.');
    } catch (error) {
      console.error('[DbService] Error during database disconnection:', error);
    }
  }
}

// Log queries if in debug mode
// @ts-ignore
prisma.$on('query', (e: any) => {
  if (process.env.DEBUG_DB === 'true') {
    console.log(`[Prisma Query] Query: ${e.query}`);
    console.log(`[Prisma Query] Params: ${e.params}`);
    console.log(`[Prisma Query] Duration: ${e.duration}ms`);
  }
});
