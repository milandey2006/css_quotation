
import { pgTable, serial, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const quotations = pgTable('quotations', {
  id: serial('id').primaryKey(),
  quotationNo: text('quotation_no').notNull(),
  date: timestamp('date').defaultNow().notNull(),
  clientName: text('client_name'),
  totalAmount: integer('total_amount'),
  status: text('status').default('pending'), // pass, failed, pending
  data: jsonb('data').notNull(), // Stores the full JSON structure of the quotation
  createdAt: timestamp('created_at').defaultNow(),
});

export const proformas = pgTable('proformas', {
  id: serial('id').primaryKey(),
  quotationNo: text('quotation_no').notNull(), // Can keep same column name or change to proforma_no, keeping same for simplicity/compatibility
  date: timestamp('date').defaultNow().notNull(),
  clientName: text('client_name'),
  totalAmount: integer('total_amount'),
  status: text('status').default('pending'),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
