import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function reset() {
  // Delete February parent evaluations (month 2)
  await db.delete(schema.parentEvaluations)
    .where(eq(schema.parentEvaluations.month, 2));
  
  console.log("✅ Deleted all February parent evaluations");
  
  // Verify
  const remaining = await db
    .select({ count: schema.parentEvaluations.id })
    .from(schema.parentEvaluations)
    .where(eq(schema.parentEvaluations.month, 2));
  
  console.log("Remaining February evaluations:", remaining.length);
  process.exit(0);
}
reset();
