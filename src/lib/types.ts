export interface Company {
  id: string
  name: string
  cnpj: string | null
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  created_at: string
}

export interface Project {
  id: string
  company_id: string
  name: string
  client_name: string | null
  client_cnpj: string | null
  address: string | null
  contract_value: number
  estimated_budget: number
  start_date: string | null
  expected_end_date: string | null
  actual_end_date: string | null
  status: 'planning' | 'execution' | 'completed' | 'suspended'
  completion_percentage: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CostCategory {
  id: string
  company_id: string
  name: string
  type: 'direct' | 'indirect'
}

export interface Supplier {
  id: string
  company_id: string
  name: string
  cnpj_cpf: string | null
  phone: string | null
  email: string | null
  address: string | null
  category: string | null
  notes: string | null
  rating: number
  created_at: string
}

export interface Expense {
  id: string
  company_id: string
  project_id: string | null
  category_id: string | null
  supplier_id: string | null
  description: string
  amount: number
  date: string
  due_date: string | null
  paid_date: string | null
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  payment_method: string | null
  receipt_url: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  // Joined
  project?: Project
  category?: CostCategory
  supplier?: Supplier
}

export interface Revenue {
  id: string
  company_id: string
  project_id: string | null
  client_name: string | null
  description: string
  amount: number
  expected_date: string | null
  received_date: string | null
  status: 'pending' | 'received' | 'overdue' | 'cancelled'
  installment_number: number | null
  total_installments: number | null
  notes: string | null
  created_at: string
  // Joined
  project?: Project
}

export interface Employee {
  id: string
  company_id: string
  name: string
  cpf: string | null
  role_function: string | null
  hire_date: string | null
  type: 'clt' | 'pj' | 'freelancer'
  base_salary: number
  active: boolean
  phone: string | null
  email: string | null
  created_at: string
}

export interface EmployeeAssignment {
  id: string
  employee_id: string
  project_id: string
  start_date: string
  end_date: string | null
  role_in_project: string | null
  employee?: Employee
  project?: Project
}

export interface Payroll {
  id: string
  company_id: string
  employee_id: string
  project_id: string | null
  reference_month: string
  amount: number
  bonuses: number
  deductions: number
  net_amount: number
  payment_date: string | null
  status: 'pending' | 'paid'
  created_at: string
  employee?: Employee
  project?: Project
}

export interface PurchaseOrder {
  id: string
  company_id: string
  project_id: string | null
  supplier_id: string | null
  description: string | null
  total_amount: number
  status: 'draft' | 'approved' | 'ordered' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'partial' | 'paid'
  order_date: string
  expected_delivery: string | null
  actual_delivery: string | null
  approved_by: string | null
  notes: string | null
  created_at: string
  items?: PurchaseItem[]
  supplier?: Supplier
  project?: Project
}

export interface PurchaseItem {
  id: string
  purchase_order_id: string
  material_name: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
}

export interface ProjectSchedule {
  id: string
  project_id: string
  phase_name: string
  planned_cost: number
  actual_cost: number
  planned_revenue: number
  actual_revenue: number
  planned_start: string | null
  planned_end: string | null
  actual_start: string | null
  actual_end: string | null
  status: 'pending' | 'in_progress' | 'completed'
  sort_order: number
}

export interface Transaction {
  id: string
  company_id: string
  project_id: string | null
  type: 'income' | 'expense'
  source_type: string | null
  source_id: string | null
  amount: number
  date: string
  description: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  company_id: string | null
  user_id: string | null
  table_name: string
  record_id: string
  action: 'insert' | 'update' | 'delete'
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}

export interface AuditAlert {
  id: string
  company_id: string
  alert_type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string | null
  related_table: string | null
  related_id: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: string | null
  resolved_at: string | null
  created_at: string
}

export interface DashboardOverview {
  totalRevenue: number
  totalExpenses: number
  profit: number
  profitMargin: number
  cashBalance: number
  payables: number
  receivables: number
  activeProjects: number
  pendingAlerts: number
  projects: (Project & {
    totalSpent: number
    totalReceived: number
    profit: number
  })[]
}

export interface CashFlowData {
  month: string
  income: number
  expense: number
  balance: number
}
