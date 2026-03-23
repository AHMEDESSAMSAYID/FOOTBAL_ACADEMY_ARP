import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function check() {
  // Check parent evaluations
  const parentEvals = await db
    .select({
      studentName: schema.students.name,
      month: schema.parentEvaluations.month,
      year: schema.parentEvaluations.year,
      grandTotal: schema.parentEvaluations.grandTotal,
      isSubmitted: schema.parentEvaluations.isSubmitted,
    })
    .from(schema.parentEvaluations)
    .innerJoin(schema.students, eq(schema.parentEvaluations.studentId, schema.students.id))
    .where(eq(schema.parentEvaluations.month, 2));

  console.log("February parent evaluations:", parentEvals.length);
  parentEvals.forEach((e) =>
    console.log(`- ${e.studentName}: ${e.grandTotal}/50 (submitted: ${e.isSubmitted})`)
  );
  process.exit(0);
}
check();
