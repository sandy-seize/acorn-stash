import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";

export async function listStrategies() {
  return db.select().from(schema.vrStrategies).orderBy(desc(schema.vrStrategies.createdAt));
}

export async function recentOrders(strategyId: number, limit = 12) {
  return db
    .select()
    .from(schema.vrOrders)
    .where(eq(schema.vrOrders.strategyId, strategyId))
    .orderBy(desc(schema.vrOrders.id))
    .limit(limit);
}

export async function schedulesFor(strategyId: number) {
  return db
    .select()
    .from(schema.vrSchedules)
    .where(eq(schema.vrSchedules.strategyId, strategyId))
    .orderBy(desc(schema.vrSchedules.id));
}

export async function paperFor(strategyId: number) {
  const [row] = await db
    .select()
    .from(schema.vrPaperAccounts)
    .where(eq(schema.vrPaperAccounts.strategyId, strategyId))
    .limit(1);
  return row ?? null;
}
