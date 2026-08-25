/**
 * Single source of truth for payment types.
 *
 * Keep this in sync with `paymentTypeEnum` in src/db/schema.ts — adding a value
 * there also needs a migration (see drizzle/0005_add_activity_payment_type.sql).
 */

export const PAYMENT_TYPES = ["monthly", "bus", "uniform", "activity"] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

/** Full labels, used in forms, receipts and detail views */
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  monthly: "اشتراك شهري",
  bus: "رسوم الباص",
  uniform: "الزي الرسمي",
  activity: "رسوم الأنشطة",
};

/** Compact labels, used in table badges and filter chips */
export const PAYMENT_TYPE_SHORT_LABELS: Record<PaymentType, string> = {
  monthly: "شهري",
  bus: "باص",
  uniform: "زي",
  activity: "أنشطة",
};

/**
 * Recurring fees billed against a coverage period, so a payment creates
 * per-month `payment_coverage` rows. One-off fees (uniform, activity) do not.
 */
export const COVERAGE_PAYMENT_TYPES = ["monthly", "bus"] as const;

export type CoverageFeeType = (typeof COVERAGE_PAYMENT_TYPES)[number];

/** Whether this type is billed over a from/to coverage period. */
export function hasCoveragePeriod(type: PaymentType): boolean {
  return (COVERAGE_PAYMENT_TYPES as readonly string[]).includes(type);
}

/**
 * The `fee_type` a payment maps onto in `payment_coverage`, or null for
 * one-off fees that are not tracked month by month.
 */
export function coverageFeeType(type: PaymentType): CoverageFeeType | null {
  return hasCoveragePeriod(type) ? (type as CoverageFeeType) : null;
}

export function paymentTypeLabel(type: string): string {
  return PAYMENT_TYPE_LABELS[type as PaymentType] ?? type;
}
