import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. .env.local 에 Neon connection string 을 추가하세요.");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export { schema };
