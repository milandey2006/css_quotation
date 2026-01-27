
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
  createdAt: timestamp('created_at').defaultNow(),
});

export const punches = pgTable('punches', {
  id: serial('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  clientName: text('client_name'),
  areaName: text('area_name'),
  type: text('type').notNull(), // 'in' or 'out'
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  lat: text('lat'), // text to be safe with precision, or real/double precision if supported by driver easily
  lng: text('lng'),
  workDetails: text('work_details'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const works = pgTable('works', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  clientPhone: text('client_phone'),
  clientAddress: text('client_address'),
  instructions: text('instructions'),
  userId: text('user_id'), // Clerk User ID
  status: text('status').default('pending'), // pending, completed
  createdAt: timestamp('created_at').defaultNow(),
});

export const salarySlips = pgTable('salary_slips', {
  id: serial('id').primaryKey(),
  employeeName: text('employee_name').notNull(),
  employeeId: text('employee_id'),
  designation: text('designation'),
  monthYear: text('month_year').notNull(), // e.g. "March 2024"
  
  // Employee documents
  aadhaarNo: text('aadhaar_no'),
  panNo: text('pan_no'),
  uanNo: text('uan_no'),
  utrNo: text('utr_no'), // Payment reference
  
  // JSONB for flexible earnings/deductions structure
  earnings: jsonb('earnings'), 
  deductions: jsonb('deductions'),
  
  // Specific requested fields
  advanceSalary: integer('advance_salary').default(0),
  basicSalary: integer('basic_salary'),
  
  // Totals
  totalEarnings: integer('total_earnings'),
  totalDeductions: integer('total_deductions'),
  netPayable: integer('net_payable'),
  
  // Attendance
  workDays: integer('work_days'),
  holidays: integer('holidays'),
  paidDays: integer('paid_days'), 
  
  createdAt: timestamp('created_at').defaultNow(),
});

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  designation: text('designation'),
  mobile: text('mobile'),
  email: text('email'),
  address: text('address'),
  panNo: text('pan_no'),
  aadhaarNo: text('aadhaar_no'),
  uanNo: text('uan_no'),
  bankAccountNo: text('bank_account_no'),
  ifscCode: text('ifsc_code'),
  joinDate: timestamp('join_date'),
  basicSalary: integer('basic_salary'),
  status: text('status').default('active'), // active, inactive
  createdAt: timestamp('created_at').defaultNow(),
});

export const estimates = pgTable('estimates', {
  id: serial('id').primaryKey(),
  billNo: text('bill_no').notNull(),
  billDate: timestamp('bill_date').defaultNow().notNull(),
  clientName: text('client_name'),
  totalAmount: integer('total_amount'),
  paidAmount: integer('paid_amount').default(0),
  status: text('status').default('pending'),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
