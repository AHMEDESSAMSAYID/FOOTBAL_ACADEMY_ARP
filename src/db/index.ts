import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle database instance with schema for relational queries
export const db = drizzle(sql, { schema });

// Re-export schema and types for convenience
export * from './schema';
export * from './relations';
