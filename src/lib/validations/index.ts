/**
 * Zod Validation Schemas
 * 
 * This file exports shared validation schemas.
 * Schemas will be added as features are implemented.
 * 
 * @see https://zod.dev/
 */

import { z } from 'zod';

// Common validation schemas
export const idSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Placeholder for future schemas
export const studentSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'), // Name is required
  // Additional fields will be added in Story 2.1
});
