/**
 * Drizzle ORM Schema Definitions
 * Espanyol Academy Database Schema
 * 
 * @see https://orm.drizzle.team/docs/sql-schema-declaration
 */

import { 
  pgTable, 
  pgEnum,
  uuid, 
  varchar, 
  text,
  timestamp,
  date,
  decimal,
  boolean,
  integer,
  jsonb,
  unique
} from 'drizzle-orm/pg-core';

// ===== ENUMS =====

export const studentStatusEnum = pgEnum('student_status', [
  'active',
  'inactive', 
  'frozen',
  'trial'
]);

export const ageGroupEnum = pgEnum('age_group', [
  '5-10',
  '10-15',
  '15+'
]);

export const contactRelationEnum = pgEnum('contact_relation', [
  'father',
  'mother',
  'guardian',
  'other'
]);

export const discountTypeEnum = pgEnum('discount_type', [
  'fixed',
  'percentage',
  'sibling',
  'other'
]);

export const paymentTypeEnum = pgEnum('payment_type', [
  'monthly',
  'bus',
  'uniform'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'bank_transfer'
]);

export const feeTypeEnum = pgEnum('fee_type', [
  'monthly',
  'bus'
]);

export const coverageStatusEnum = pgEnum('coverage_status', [
  'paid',
  'partial',
  'overdue',
  'pending'
]);

export const dayOfWeekEnum = pgEnum('day_of_week', [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday'
]);

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present',
  'absent',
  'excused'
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'interested',
  'trial_scheduled',
  'trial_completed',
  'converted',
  'not_interested',
  'waiting_other_area'
]);

export const communicationChannelEnum = pgEnum('communication_channel', [
  'call',
  'whatsapp',
  'visit',
  'other'
]);

export const notificationChannelEnum = pgEnum('notification_channel', [
  'email',
  'telegram'
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'payment_reminder',
  'payment_received',
  'payment_overdue',
  'trial_reminder',
  'general'
]);

export const notificationStatusEnum = pgEnum('notification_status', [
  'pending',
  'sent',
  'failed'
]);

export const escalationLevelEnum = pgEnum('escalation_level', [
  'reminder',
  'warning',
  'blocked'
]);

export const skillCategoryEnum = pgEnum('skill_category', [
  'technical',
  'physical',
  'tactical',
  'attitude',
  'teamwork'
]);

export const uniformTypeEnum = pgEnum('uniform_type', [
  'red',
  'navy'
]);

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'coach'
]);

// ===== TABLES =====

// Users table (Clerk-synced system users)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).unique(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum('role').default('admin').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Students table (core registry)
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  membershipNumber: varchar('membership_number', { length: 20 }),
  name: varchar('name', { length: 100 }).notNull(),
  fullName: varchar('full_name', { length: 200 }),
  status: studentStatusEnum('status').default('active').notNull(),
  birthDate: date('birth_date'),
  ageGroup: ageGroupEnum('age_group'),
  nationality: varchar('nationality', { length: 50 }),
  idNumber: varchar('id_number', { length: 50 }),
  phone: varchar('phone', { length: 20 }),
  school: varchar('school', { length: 100 }),
  address: text('address'),
  area: varchar('area', { length: 50 }),
  siblingGroupId: varchar('sibling_group_id', { length: 50 }),
  registrationDate: date('registration_date').notNull(),
  registrationFormStatus: varchar('registration_form_status', { length: 20 }).default('not_filled'),
  registrationFormNotes: text('registration_form_notes'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contacts table (student parents/guardians)
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  relation: contactRelationEnum('relation'),
  phone: varchar('phone', { length: 20 }).notNull(),
  isPrimaryPayer: boolean('is_primary_payer').default(false),
  telegramId: varchar('telegram_id', { length: 50 }),
  email: varchar('email', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Fee configs table (per-student pricing)
export const feeConfigs = pgTable('fee_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }).unique(),
  monthlyFee: decimal('monthly_fee', { precision: 10, scale: 2 }).notNull(),
  busFee: decimal('bus_fee', { precision: 10, scale: 2 }),
  uniformPaid: boolean('uniform_paid').default(false),
  uniformPrice: decimal('uniform_price', { precision: 10, scale: 2 }),
  discountType: discountTypeEnum('discount_type'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }),
  discountReason: text('discount_reason'),
  effectiveFrom: date('effective_from').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payments table (all transactions)
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentType: paymentTypeEnum('payment_type').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  payerName: varchar('payer_name', { length: 100 }),
  coverageStart: date('coverage_start'),
  coverageEnd: date('coverage_end'),
  monthsCovered: integer('months_covered'),
  notes: text('notes'),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  paymentDate: date('payment_date').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payment coverage table (which months are paid)
export const paymentCoverage = pgTable('payment_coverage', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  feeType: feeTypeEnum('fee_type').notNull(),
  yearMonth: varchar('year_month', { length: 7 }).notNull(), // '2026-02'
  amountDue: decimal('amount_due', { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull(),
  status: coverageStatusEnum('status').notNull(),
  paymentId: uuid('payment_id').references(() => payments.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('student_fee_month_unique').on(table.studentId, table.feeType, table.yearMonth)
]);

// Training sessions table
export const trainingSessions = pgTable('training_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionDate: date('session_date').notNull(),
  dayOfWeek: dayOfWeekEnum('day_of_week'),
  ageGroup: ageGroupEnum('age_group'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Attendance table
export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => trainingSessions.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  status: attendanceStatusEnum('status').notNull(),
  notes: text('notes'),
  recordedBy: uuid('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('session_student_unique').on(table.sessionId, table.studentId)
]);

// Leads table (CRM)
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  childName: varchar('child_name', { length: 100 }),
  age: integer('age'),
  area: varchar('area', { length: 50 }),
  status: leadStatusEnum('status').default('new').notNull(),
  source: varchar('source', { length: 50 }),
  assignedTo: uuid('assigned_to').references(() => users.id),
  nextFollowup: date('next_followup'),
  convertedToStudentId: uuid('converted_to_student_id').references(() => students.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Lead communications table
export const leadCommunications = pgTable('lead_communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  communicationDate: timestamp('communication_date').notNull(),
  channel: communicationChannelEnum('channel'),
  notes: text('notes').notNull(),
  outcome: varchar('outcome', { length: 100 }),
  nextAction: text('next_action'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Activity logs table
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  actionType: varchar('action_type', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  channel: notificationChannelEnum('channel').notNull(),
  notificationType: notificationTypeEnum('notification_type').notNull(),
  content: text('content').notNull(),
  status: notificationStatusEnum('status').default('pending').notNull(),
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Escalation logs table
export const escalationLogs = pgTable('escalation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  level: escalationLevelEnum('level').notNull(),
  daysOverdue: integer('days_overdue').notNull(),
  notificationId: uuid('notification_id').references(() => notifications.id),
  triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Evaluations table (Coach Performance Tracking — 10 KPIs × 1-5 stars = /50)
export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  coachId: uuid('coach_id').references(() => users.id),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  // التقنية Technical (3 criteria, /15)
  ballControl: integer('ball_control').notNull(), // التحكم بالكرة
  passing: integer('passing').notNull(), // التمرير
  shooting: integer('shooting').notNull(), // التسديد
  // البدنية Physical (2 criteria, /10)
  speed: integer('speed').notNull(), // السرعة
  fitness: integer('fitness').notNull(), // اللياقة
  // التكتيكية Tactical (2 criteria, /10)
  positioning: integer('positioning').notNull(), // التمركز
  gameAwareness: integer('game_awareness').notNull(), // الوعي بالملعب
  // السلوك Attitude (3 criteria, /15)
  commitment: integer('commitment').notNull(), // الالتزام
  teamwork: integer('teamwork').notNull(), // العمل الجماعي
  discipline: integer('discipline').notNull(), // الانضباط
  // Totals
  grandTotal: integer('grand_total').notNull(), // /50
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('student_month_year_unique').on(table.studentId, table.month, table.year)
]);

// Surveys table (monthly campaign - one shared link per month)
export const surveys = pgTable('surveys', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Survey responses table (fixed template)
export const surveyResponses = pgTable('survey_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  surveyId: uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  parentName: varchar('parent_name', { length: 100 }).notNull(),
  childName: varchar('child_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  // Rating questions (1-5)
  coachingRating: integer('coaching_rating').notNull(), // رضاك عن مستوى التدريب
  communicationRating: integer('communication_rating').notNull(), // رضاك عن التواصل
  enjoymentRating: integer('enjoyment_rating').notNull(), // مدى استمتاع طفلك
  facilitiesRating: integer('facilities_rating').notNull(), // رضاك عن المرافق
  organizationRating: integer('organization_rating').notNull(), // رضاك عن التنظيم
  // Text questions
  improvements: text('improvements'), // ما الذي يمكننا تحسينه
  additionalNotes: text('additional_notes'), // ملاحظات إضافية
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Parent monthly evaluations table (filled by parents via public link, /50 total)
export const parentEvaluations = pgTable('parent_evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  surveyId: uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  // الانضباط (Discipline) - 20 points
  prayer: integer('prayer'), // المحافظة على الصلاة /10
  sleep: integer('sleep'), // النوم المنتظم /5
  healthyEating: integer('healthy_eating'), // الأكل الصحي /5
  // الأخلاق (Morals) - 20 points
  respectOthers: integer('respect_others'), // احترام الوالدين والآخرين /10
  angerControl: integer('anger_control'), // التحكم في العصبية /10
  // المساهمة المنزلية (Home Contribution) - 10 points
  prepareBag: integer('prepare_bag'), // تجهيز الشنطة والزي /2
  organizePersonal: integer('organize_personal'), // ترتيب وتنظيم الأغراض /3
  fulfillRequests: integer('fulfill_requests'), // تلبية طلبات الوالدين /5
  // Totals (computed on submit)
  disciplineTotal: integer('discipline_total'), // /20
  moralsTotal: integer('morals_total'), // /20
  homeTotal: integer('home_total'), // /10
  grandTotal: integer('grand_total'), // /50
  parentNotes: text('parent_notes'),
  isSubmitted: boolean('is_submitted').default(false).notNull(),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('parent_eval_student_month_year').on(table.studentId, table.month, table.year)
]);

// Uniform records table (tracks each uniform given to a student)
export const uniformRecords = pgTable('uniform_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  uniformType: uniformTypeEnum('uniform_type').notNull(),
  givenDate: date('given_date').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean('is_paid').default(false).notNull(),
  paidDate: date('paid_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===== TYPE EXPORTS =====

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type FeeConfig = typeof feeConfigs.$inferSelect;
export type NewFeeConfig = typeof feeConfigs.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type PaymentCoverage = typeof paymentCoverage.$inferSelect;
export type NewPaymentCoverage = typeof paymentCoverage.$inferInsert;

export type TrainingSession = typeof trainingSessions.$inferSelect;
export type NewTrainingSession = typeof trainingSessions.$inferInsert;

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type LeadCommunication = typeof leadCommunications.$inferSelect;
export type NewLeadCommunication = typeof leadCommunications.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type EscalationLog = typeof escalationLogs.$inferSelect;
export type NewEscalationLog = typeof escalationLogs.$inferInsert;

export type Evaluation = typeof evaluations.$inferSelect;
export type NewEvaluation = typeof evaluations.$inferInsert;

export type ParentEvaluation = typeof parentEvaluations.$inferSelect;
export type NewParentEvaluation = typeof parentEvaluations.$inferInsert;

export type UniformRecord = typeof uniformRecords.$inferSelect;
export type NewUniformRecord = typeof uniformRecords.$inferInsert;

// Expense categories table (predefined names)
export const expenseCategories = pgTable('expense_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => expenseCategories.id, { onDelete: 'restrict' }),
  amount: integer('amount').notNull(), // stored in minor units
  currency: varchar('currency', { length: 5 }).notNull().default('TL'), // TL or USD
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type NewExpenseCategory = typeof expenseCategories.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
