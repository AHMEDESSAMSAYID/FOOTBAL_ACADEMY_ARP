/**
 * Drizzle ORM Relations
 * Espanyol Academy Database Relations
 * 
 * @see https://orm.drizzle.team/docs/relations
 */

import { relations } from 'drizzle-orm';
import { 
  users, 
  students, 
  contacts, 
  feeConfigs, 
  payments, 
  paymentCoverage,
  trainingSessions,
  attendance,
  leads,
  leadCommunications,
  activityLogs,
  notifications,
  escalationLogs,
  evaluations,
  parentEvaluations,
  surveys,
  expenseCategories,
  expenses
} from './schema';

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  payments: many(payments),
  attendanceRecords: many(attendance),
  leadCommunications: many(leadCommunications),
  activityLogs: many(activityLogs),
  assignedLeads: many(leads),
  evaluations: many(evaluations),
}));

// Student relations
export const studentsRelations = relations(students, ({ one, many }) => ({
  contacts: many(contacts),
  feeConfig: one(feeConfigs, {
    fields: [students.id],
    references: [feeConfigs.studentId],
  }),
  payments: many(payments),
  paymentCoverage: many(paymentCoverage),
  attendanceRecords: many(attendance),
  notifications: many(notifications),
  escalationLogs: many(escalationLogs),
  evaluations: many(evaluations),
  parentEvaluations: many(parentEvaluations),
}));

// Contact relations
export const contactsRelations = relations(contacts, ({ one, many }) => ({
  student: one(students, {
    fields: [contacts.studentId],
    references: [students.id],
  }),
  notifications: many(notifications),
}));

// Fee config relations
export const feeConfigsRelations = relations(feeConfigs, ({ one }) => ({
  student: one(students, {
    fields: [feeConfigs.studentId],
    references: [students.id],
  }),
}));

// Payment relations
export const paymentsRelations = relations(payments, ({ one, many }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  createdByUser: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
  coverageRecords: many(paymentCoverage),
}));

// Payment coverage relations
export const paymentCoverageRelations = relations(paymentCoverage, ({ one }) => ({
  student: one(students, {
    fields: [paymentCoverage.studentId],
    references: [students.id],
  }),
  payment: one(payments, {
    fields: [paymentCoverage.paymentId],
    references: [payments.id],
  }),
}));

// Training session relations
export const trainingSessionsRelations = relations(trainingSessions, ({ many }) => ({
  attendanceRecords: many(attendance),
}));

// Attendance relations
export const attendanceRelations = relations(attendance, ({ one }) => ({
  session: one(trainingSessions, {
    fields: [attendance.sessionId],
    references: [trainingSessions.id],
  }),
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  recordedByUser: one(users, {
    fields: [attendance.recordedBy],
    references: [users.id],
  }),
}));

// Lead relations
export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedToUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
  convertedStudent: one(students, {
    fields: [leads.convertedToStudentId],
    references: [students.id],
  }),
  communications: many(leadCommunications),
}));

// Lead communication relations
export const leadCommunicationsRelations = relations(leadCommunications, ({ one }) => ({
  lead: one(leads, {
    fields: [leadCommunications.leadId],
    references: [leads.id],
  }),
  createdByUser: one(users, {
    fields: [leadCommunications.createdBy],
    references: [users.id],
  }),
}));

// Activity log relations
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  student: one(students, {
    fields: [notifications.studentId],
    references: [students.id],
  }),
  contact: one(contacts, {
    fields: [notifications.contactId],
    references: [contacts.id],
  }),
}));

// Escalation log relations
export const escalationLogsRelations = relations(escalationLogs, ({ one }) => ({
  student: one(students, {
    fields: [escalationLogs.studentId],
    references: [students.id],
  }),
  notification: one(notifications, {
    fields: [escalationLogs.notificationId],
    references: [notifications.id],
  }),
}));

// Evaluation relations
export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  student: one(students, {
    fields: [evaluations.studentId],
    references: [students.id],
  }),
  coach: one(users, {
    fields: [evaluations.coachId],
    references: [users.id],
  }),
}));

// Parent evaluation relations
export const parentEvaluationsRelations = relations(parentEvaluations, ({ one }) => ({
  student: one(students, {
    fields: [parentEvaluations.studentId],
    references: [students.id],
  }),
  survey: one(surveys, {
    fields: [parentEvaluations.surveyId],
    references: [surveys.id],
  }),
}));

// Survey relations
export const surveysRelations = relations(surveys, ({ many }) => ({
  evaluations: many(parentEvaluations),
}));

// Expense category relations
export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  expenses: many(expenses),
}));

// Expense relations
export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
}));
