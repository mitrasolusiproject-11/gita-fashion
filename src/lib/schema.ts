import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role', { enum: ['ADMIN', 'MANAGER', 'CASHIER'] }).notNull().default('CASHIER'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Categories table
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Products table
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  barcode: text('barcode').notNull().unique(),
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  initialStock: integer('initial_stock').notNull().default(0),
  currentStock: integer('current_stock').notNull().default(0),
  sellPrice: real('sell_price').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  transactionDate: integer('transaction_date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  totalItems: integer('total_items').notNull(),
  cashAmount: real('cash_amount').notNull().default(0),
  transferAmount: real('transfer_amount').notNull().default(0),
  bankName: text('bank_name'),
  paymentProof: text('payment_proof'),
  paymentStatus: text('payment_status', { enum: ['PENDING', 'PAID', 'CANCELLED'] }).notNull().default('PENDING'),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Outgoing Items table
export const outgoingItems = sqliteTable('outgoing_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: integer('date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  barcode: text('barcode').notNull(),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  transactionCode: text('transaction_code').notNull().references(() => transactions.code),
  price: real('price').notNull(),
  discountPercent: real('discount_percent').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Settings table
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Shifts table (Tutup Kasir)
export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  startingCash: real('starting_cash').notNull().default(0),
  endingCash: real('ending_cash'),
  totalSales: real('total_sales').default(0),
  totalTransactions: integer('total_transactions').default(0),
  totalExpenses: real('total_expenses').default(0),
  status: text('status', { enum: ['OPEN', 'CLOSED'] }).notNull().default('OPEN'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Expenses table (Pengeluaran)
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shiftId: text('shift_id').references(() => shifts.id),
  userId: text('user_id').notNull().references(() => users.id),
  category: text('category').notNull(), // 'OPERATIONAL', 'INVENTORY', 'MAINTENANCE', 'OTHER'
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  receipt: text('receipt'), // Optional receipt/proof
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  outgoingItems: many(outgoingItems),
}))

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  outgoingItems: many(outgoingItems),
}))

export const outgoingItemsRelations = relations(outgoingItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [outgoingItems.transactionCode],
    references: [transactions.code],
  }),
  product: one(products, {
    fields: [outgoingItems.barcode],
    references: [products.barcode],
  }),
}))