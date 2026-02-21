/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'GIVE_CREDIT' | 'TAKE_CREDIT' | 'EXPENSE' | 'PAYMENT_RECEIVED' | 'PAYMENT_MADE';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
  customerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // Positive means they owe me (Green), Negative means I owe them (Red)
  type: 'CUSTOMER' | 'SUPPLIER';
  lastTransactionDate: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  amount?: number;
  type: 'COLLECTION' | 'PAYMENT' | 'PERSONAL';
  status: 'UPCOMING' | 'OVERDUE' | 'COMPLETED';
  customerId?: string;
}
