/**
 * Billing Utility Module
 *
 * Calculates payment periods based on a student's registration date
 * instead of using calendar months. Each student's billing "day"
 * is the day-of-month they registered on.
 *
 * Example: Ahmed registers on Jan 15.
 *  - His billing day is the 15th of each month.
 *  - Period 1 covers Jan 15 → Feb 14.
 *  - In early February (before the 15th), he is NOT overdue for
 *    February — he still has days remaining on Period 1.
 *  - On Feb 15, the new period starts and he should pay for "2026-02".
 */

export interface BillingInfo {
  /** The YYYY-MM that the student should currently have paid for */
  currentDueYearMonth: string;
  /** The day number from the registration date (1-31) */
  billingDay: number;
  /** Days since the current due period's billing day (overdue indicator) */
  daysSinceDue: number;
  /** Days until the NEXT billing day (when next payment is due) */
  daysUntilNextDue: number;
}

/**
 * Calculate billing info for a student based on their registration date.
 *
 * @param registrationDate - The student's registration date (YYYY-MM-DD string)
 * @param referenceDate - Optional reference date (defaults to today). Useful for testing.
 * @returns BillingInfo with the current due period and timing details.
 */
export function getBillingInfo(
  registrationDate: string,
  referenceDate?: Date
): BillingInfo {
  const regDate = new Date(registrationDate + "T00:00:00");
  const billingDay = regDate.getDate(); // 1-31
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);

  // Adjust billing day for months with fewer days
  const daysInCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  const effectiveBillingDay = Math.min(billingDay, daysInCurrentMonth);

  let dueYear: number;
  let dueMonth: number; // 1-based
  let nextDueDate: Date;

  if (today.getDate() >= effectiveBillingDay) {
    // Current billing period has started → student should have paid for THIS month
    dueYear = today.getFullYear();
    dueMonth = today.getMonth() + 1;

    // Next due date = billing day of next calendar month
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysInNextMonth = new Date(
      nextMonthDate.getFullYear(),
      nextMonthDate.getMonth() + 1,
      0
    ).getDate();
    nextDueDate = new Date(
      nextMonthDate.getFullYear(),
      nextMonthDate.getMonth(),
      Math.min(billingDay, daysInNextMonth)
    );
  } else {
    // Haven't reached billing day yet → still in PREVIOUS month's period
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    dueYear = prevMonthDate.getFullYear();
    dueMonth = prevMonthDate.getMonth() + 1;

    // Next due date = billing day of THIS calendar month
    nextDueDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      effectiveBillingDay
    );
  }

  const currentDueYearMonth = `${dueYear}-${String(dueMonth).padStart(2, "0")}`;

  // Calculate days since the due date for the current period
  const daysInDueMonth = new Date(dueYear, dueMonth, 0).getDate();
  const effectiveDueDay = Math.min(billingDay, daysInDueMonth);
  const periodDueDate = new Date(dueYear, dueMonth - 1, effectiveDueDay);
  periodDueDate.setHours(0, 0, 0, 0);

  const daysSinceDue = Math.floor(
    (today.getTime() - periodDueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysUntilNextDue = Math.max(
    0,
    Math.floor(
      (nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return {
    currentDueYearMonth,
    billingDay,
    daysSinceDue,
    daysUntilNextDue,
  };
}

/**
 * Check if a yearMonth is before the student's registration month.
 * Months before registration should not show as overdue.
 */
export function isBeforeRegistration(
  yearMonth: string,
  registrationDate: string
): boolean {
  const regDate = new Date(registrationDate + "T00:00:00");
  const regYearMonth = `${regDate.getFullYear()}-${String(
    regDate.getMonth() + 1
  ).padStart(2, "0")}`;
  return yearMonth < regYearMonth;
}

/**
 * Get the registration-based YYYY-MM for the first billing period.
 */
export function getRegistrationYearMonth(registrationDate: string): string {
  const regDate = new Date(registrationDate + "T00:00:00");
  return `${regDate.getFullYear()}-${String(regDate.getMonth() + 1).padStart(2, "0")}`;
}
