/**
 * TypeScript Type Definitions
 * 
 * This file contains shared types used across the application.
 * Types will be added as features are implemented.
 */

// Action Result type for Server Actions (from Architecture)
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Student status (from database schema)
export type StudentStatus = 'active' | 'inactive' | 'frozen' | 'trial';

// Age group (from database schema)
export type AgeGroup = '5-10' | '10-15' | '15+';

// Payment status (computed)
export type PaymentStatus = 'paid' | 'partial' | 'overdue' | 'pending';

// Lead status (from CRM)
export type LeadStatus = 
  | 'new' 
  | 'contacted' 
  | 'interested' 
  | 'trial_scheduled' 
  | 'trial_completed' 
  | 'converted' 
  | 'not_interested' 
  | 'waiting_other_area';
