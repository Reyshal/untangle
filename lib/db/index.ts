import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg, NodePgDatabase } from "drizzle-orm/node-postgres";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import * as schema from "./schema";

type AppDatabase = NodePgDatabase<typeof schema> | NeonHttpDatabase<typeof schema>;

let dbInstance: AppDatabase | null = null;
let isMock = false;

export function isDbMock(): boolean {
  return isMock;
}

export function getDb(): AppDatabase {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env.DATABASE_URL || "";

  if (!connectionString || connectionString.includes("mock") || connectionString.includes("placeholder")) {
    isMock = true;
    const dummyPool = new Pool({ connectionString: "postgresql://localhost:5432/mock_untangle" });
    dbInstance = drizzlePg(dummyPool, { schema });
    return dbInstance;
  }

  try {
    if (connectionString.includes("neon.tech")) {
      const sql = neon(connectionString);
      dbInstance = drizzleNeon(sql, { schema });
    } else {
      const pool = new Pool({ connectionString });
      dbInstance = drizzlePg(pool, { schema });
    }
  } catch (err) {
    console.warn("Failed to initialize database, using local fallback:", err);
    isMock = true;
    const dummyPool = new Pool({ connectionString: "postgresql://localhost:5432/mock_untangle" });
    dbInstance = drizzlePg(dummyPool, { schema });
  }

  return dbInstance;
}

export const db = getDb();
export * from "./schema";
