import { z } from 'zod'

// ─── Helpers ───────────────────────────────────────────
const uuidOptional = z.string().uuid('ID inválido').optional().nullable()
const uuidRequired = z.string().uuid('ID inválido')
const positiveNumber = z.number({ message: 'Deve ser um número' }).positive('Valor deve ser positivo')
const nonNegativeNumber = z.number({ message: 'Deve ser um número' }).nonnegative('Valor não pode ser negativo')
const dateString = z.string().refine(
  (v) => !isNaN(Date.parse(v)),
  { message: 'Data inválida' }
)

// ─── Projects ──────────────────────────────────────────
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().optional().nullable(),
  client_name: z.string().optional().nullable(),
  client_document: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(['planning', 'execution', 'completed', 'suspended']).optional(),
  start_date: dateString.optional().nullable(),
  expected_end_date: dateString.optional().nullable(),
  actual_end_date: dateString.optional().nullable(),
  contract_value: nonNegativeNumber.optional().nullable(),
  estimated_cost: nonNegativeNumber.optional().nullable(),
})

export const updateProjectSchema = createProjectSchema.partial()

// ─── Expenses ──────────────────────────────────────────
export const createExpenseSchema = z.object({
  project_id: uuidOptional,
  category_id: uuidOptional,
  supplier_id: uuidOptional,
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  amount: positiveNumber,
  date: dateString,
  due_date: dateString.optional().nullable(),
  payment_date: dateString.optional().nullable(),
  payment_status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  payment_method: z.string().optional().nullable(),
  receipt_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateExpenseSchema = createExpenseSchema.partial()

// ─── Revenues ──────────────────────────────────────────
export const createRevenueSchema = z.object({
  project_id: uuidOptional,
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  amount: positiveNumber,
  expected_date: dateString,
  received_date: dateString.optional().nullable(),
  status: z.enum(['pending', 'received', 'overdue', 'cancelled']).optional(),
  payment_method: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  client_name: z.string().optional().nullable(),
  installment_number: z.number().int().positive().optional().nullable(),
  total_installments: z.number().int().positive().optional().nullable(),
})

export const updateRevenueSchema = createRevenueSchema.partial()

// ─── Suppliers ─────────────────────────────────────────
export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  document: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  category: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateSupplierSchema = createSupplierSchema.partial()

// ─── Employees ─────────────────────────────────────────
export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  cpf: z.string().optional().nullable(),
  role_function: z.string().optional().nullable(),
  type: z.enum(['clt', 'pj', 'freelancer']),
  base_salary: nonNegativeNumber,
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  admission_date: dateString.optional().nullable(),
  active: z.boolean().optional(),
})

export const updateEmployeeSchema = createEmployeeSchema.partial()

// ─── Purchases ─────────────────────────────────────────
const purchaseItemSchema = z.object({
  description: z.string().min(1, 'Descrição do item é obrigatória'),
  quantity: positiveNumber,
  unit: z.string().optional().nullable(),
  unit_price: nonNegativeNumber,
  total_price: nonNegativeNumber.optional(),
})

export const createPurchaseSchema = z.object({
  project_id: uuidOptional,
  supplier_id: uuidRequired,
  status: z.enum(['draft', 'approved', 'ordered', 'delivered', 'cancelled']).optional(),
  expected_delivery: dateString.optional().nullable(),
  total_amount: nonNegativeNumber.optional(),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, 'Pelo menos 1 item é obrigatório'),
})

export const updatePurchaseSchema = z.object({
  project_id: uuidOptional,
  supplier_id: uuidOptional,
  status: z.enum(['draft', 'approved', 'ordered', 'delivered', 'cancelled']).optional(),
  expected_delivery: dateString.optional().nullable(),
  total_amount: nonNegativeNumber.optional(),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema).optional(),
}).partial()

export const patchPurchaseSchema = z.object({
  status: z.enum(['draft', 'approved', 'ordered', 'delivered', 'cancelled']).optional(),
  expected_delivery: dateString.optional().nullable(),
  total_amount: nonNegativeNumber.optional(),
  notes: z.string().optional().nullable(),
}).partial()

// ─── Payroll ───────────────────────────────────────────
export const generatePayrollSchema = z.object({
  reference_month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato deve ser YYYY-MM'),
})

export const patchPayrollSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled']).optional(),
  amount: nonNegativeNumber.optional(),
  bonuses: nonNegativeNumber.optional(),
  deductions: nonNegativeNumber.optional(),
  net_amount: nonNegativeNumber.optional(),
  payment_date: dateString.optional().nullable(),
}).partial().refine(data => Object.keys(data).length > 0, {
  message: 'Pelo menos um campo deve ser enviado',
})

// ─── Categories ────────────────────────────────────────
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  type: z.enum(['direct', 'indirect']).optional(),
  description: z.string().optional().nullable(),
})

export const updateCategorySchema = createCategorySchema.partial()

// ─── Audit Alerts ──────────────────────────────────────
export const patchAlertSchema = z.object({
  id: uuidRequired,
  status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']),
})

// ─── Budget Items ──────────────────────────────────────
export const createBudgetItemSchema = z.object({
  project_id: uuidRequired,
  phase: z.string().min(1, 'Fase é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  unit: z.string().optional().default('vb'),
  quantity: nonNegativeNumber.optional().default(1),
  unit_price: nonNegativeNumber,
  category_id: uuidOptional,
  sort_order: z.number().int().optional().default(0),
})

export const updateBudgetItemSchema = createBudgetItemSchema.partial().omit({ project_id: true })

// ─── Daily Reports (RDO) ──────────────────────────────
export const createDailyReportSchema = z.object({
  project_id: uuidRequired,
  report_date: dateString,
  weather: z.enum(['sol', 'nublado', 'chuva', 'chuva_forte', 'impraticavel']).optional().nullable(),
  temperature_min: z.number().optional().nullable(),
  temperature_max: z.number().optional().nullable(),
  workforce_own: z.number().int().nonnegative().optional().default(0),
  workforce_contractor: z.number().int().nonnegative().optional().default(0),
  activities: z.string().optional().nullable(),
  equipment_used: z.string().optional().nullable(),
  materials_received: z.string().optional().nullable(),
  incidents: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateDailyReportSchema = createDailyReportSchema.partial().omit({ project_id: true })

// ─── Measurements ──────────────────────────────────────
export const createMeasurementSchema = z.object({
  project_id: uuidRequired,
  budget_item_id: uuidOptional,
  phase: z.string().min(1, 'Fase é obrigatória'),
  measurement_number: z.number().int().positive().optional().default(1),
  measured_percentage: z.number().min(0).max(100).optional().default(0),
  measured_quantity: nonNegativeNumber.optional().default(0),
  measured_value: nonNegativeNumber.optional().default(0),
  measurement_date: dateString,
  notes: z.string().optional().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
})

export const updateMeasurementSchema = createMeasurementSchema.partial().omit({ project_id: true })
