# Construtora ERP - Complete Build Task

You must create ALL files for a production-grade construction company ERP.

## Stack
- Next.js 14+ App Router with TypeScript
- TailwindCSS + shadcn/ui + Recharts
- Supabase (PostgreSQL + Auth + Storage)
- Deploy target: Vercel

## CRITICAL INSTRUCTIONS
1. Create EVERY file - do not skip any
2. All UI text in Brazilian Portuguese
3. Currency: BRL (R$), dates: dd/MM/yyyy
4. Use shadcn/ui for all components
5. Dark/light mode support
6. Mobile responsive

## Files to Create

### 1. Config Files
- package.json (all deps: next, react, @supabase/supabase-js, @supabase/ssr, tailwindcss, recharts, react-hook-form, zod, @hookform/resolvers, date-fns, lucide-react, next-themes, sonner, jspdf, xlsx)
- tsconfig.json
- tailwind.config.ts (with shadcn preset)
- next.config.ts
- postcss.config.js
- .env.example
- components.json (shadcn config)
- README.md

### 2. Supabase Migrations (supabase/migrations/001_initial.sql)
Single SQL file with ALL tables:
- companies (id uuid PK default gen_random_uuid(), name, cnpj, address, phone, email, created_at)
- projects (id, company_id FK, name, client_name, client_cnpj, address, contract_value numeric(15,2), estimated_budget, start_date, expected_end_date, actual_end_date, status text CHECK planning/execution/completed/suspended, completion_percentage int default 0, notes, created_at, updated_at)
- cost_categories (id, company_id FK, name, type text direct/indirect)
- suppliers (id, company_id FK, name, cnpj_cpf, phone, email, address, category, notes, rating int)
- expenses (id, company_id FK, project_id FK, category_id FK, supplier_id FK nullable, description, amount numeric(15,2), date, due_date, paid_date, payment_status CHECK pending/paid/overdue/cancelled, payment_method, receipt_url, notes, created_by uuid, created_at)
- revenues (id, company_id FK, project_id FK, client_name, description, amount, expected_date, received_date, status CHECK pending/received/overdue/cancelled, installment_number int, total_installments int)
- employees (id, company_id FK, name, cpf, role_function, hire_date, type CHECK clt/pj/freelancer, base_salary, active boolean default true, phone, email)
- employee_assignments (id, employee_id FK, project_id FK, start_date, end_date, role_in_project)
- payroll (id, company_id FK, employee_id FK, project_id FK, reference_month date, amount, bonuses default 0, deductions default 0, net_amount, payment_date, status CHECK pending/paid)
- purchase_orders (id, company_id FK, project_id FK, supplier_id FK, description, total_amount, status CHECK draft/approved/ordered/delivered/cancelled, payment_status CHECK pending/partial/paid, order_date, expected_delivery, actual_delivery, approved_by uuid, notes)
- purchase_items (id, purchase_order_id FK, material_name, quantity numeric, unit, unit_price, total_price)
- project_schedule (id, project_id FK, phase_name, planned_cost, actual_cost default 0, planned_revenue, actual_revenue default 0, planned_start, planned_end, actual_start, actual_end, status CHECK pending/in_progress/completed, sort_order int)
- transactions (id, company_id FK, project_id FK nullable, type CHECK income/expense, source_type text, source_id uuid, amount, date, description, created_at)
- audit_log (id uuid PK, company_id FK, user_id uuid, table_name text, record_id uuid, action text CHECK insert/update/delete, old_values jsonb, new_values jsonb, created_at default now())
- audit_alerts (id uuid PK, company_id FK, alert_type text, severity text CHECK critical/warning/info, title text, description text, related_table text, related_id uuid, status text CHECK pending/reviewed/resolved/dismissed default pending, reviewed_by uuid, reviewed_at timestamptz, resolved_at timestamptz, created_at default now())

Include: indexes on all FKs, RLS policies filtering by company_id, triggers for auto-creating transactions on expense/revenue/payroll changes, triggers for audit_log on all financial tables, seed data with a demo company and standard cost categories.

### 3. Types & Lib (src/lib/)
- supabase/client.ts - createBrowserClient
- supabase/server.ts - createServerClient  
- utils.ts - cn(), formatCurrency(value) → "R$ 1.234,56", formatDate(date) → "04/03/2026"
- types.ts - TypeScript interfaces for ALL tables
- validations.ts - Zod schemas for all forms

### 4. Layout (src/app/)
- layout.tsx - html, body, ThemeProvider, Toaster
- globals.css - tailwind base/components/utilities + CSS variables for themes
- (dashboard)/layout.tsx - sidebar + header + main content area

### 5. Pages

**(dashboard)/page.tsx** - Main dashboard
- 6 KPI cards (faturamento total, custos totais, lucro, saldo caixa, a pagar, a receber)
- BarChart: receitas vs despesas últimos 12 meses
- Active projects cards with progress bars
- Recent audit alerts section

**(dashboard)/projetos/page.tsx** - Projects list with DataTable, status filters, search
**(dashboard)/projetos/[id]/page.tsx** - Project detail with tabs (Visão Geral, Custos, Receitas, Cronograma, Compras, Equipe)
**(dashboard)/projetos/novo/page.tsx** - New project form

**(dashboard)/financeiro/page.tsx** - Tabs: Contas a Pagar | Contas a Receber | Fluxo de Caixa

**(dashboard)/compras/page.tsx** - Purchase orders management
**(dashboard)/fornecedores/page.tsx** - Suppliers CRUD
**(dashboard)/pessoas/page.tsx** - Employees + payroll

**(dashboard)/relatorios/page.tsx** - Reports with PDF/Excel export
**(dashboard)/auditoria/page.tsx** - Audit alerts dashboard with severity filters, review/resolve actions, change history

**(dashboard)/configuracoes/page.tsx** - Company info, cost categories

### 6. API Routes (src/app/api/)
- projects/route.ts (GET, POST)
- projects/[id]/route.ts (GET, PUT, DELETE)
- projects/[id]/summary/route.ts (GET)
- expenses/route.ts (GET, POST)
- expenses/[id]/route.ts (GET, PUT, PATCH)
- revenues/route.ts (GET, POST)
- revenues/[id]/route.ts (GET, PUT, PATCH)
- suppliers/route.ts (GET, POST)
- suppliers/[id]/route.ts (GET, PUT)
- purchases/route.ts (GET, POST)
- purchases/[id]/route.ts (GET, PUT, PATCH)
- employees/route.ts (GET, POST)
- employees/[id]/route.ts (GET, PUT)
- payroll/route.ts (GET, POST)
- payroll/[id]/route.ts (PATCH)
- dashboard/overview/route.ts (GET - aggregated data)
- dashboard/cashflow/route.ts (GET - with 30/60/90 day projection)
- audit/alerts/route.ts (GET, PATCH)
- audit/log/route.ts (GET)
- audit/check/route.ts (POST - run all integrity checks)

### 7. Components (src/components/)
- layout/sidebar.tsx (collapsible, nav items with lucide icons)
- layout/header.tsx (breadcrumb, user menu, dark mode toggle, notification bell with alert count badge)
- ui/ folder with shadcn components (button, card, input, select, table, dialog, tabs, badge, dropdown-menu, sheet, skeleton, separator, form, label, textarea, popover, calendar)
- data-table.tsx (sorting, filtering, pagination, row actions)
- kpi-card.tsx (icon, title, value, trend indicator)
- charts/revenue-expense-chart.tsx (Recharts BarChart)
- charts/cost-by-category-chart.tsx (PieChart)
- charts/cashflow-chart.tsx (AreaChart with projection line)
- charts/budget-vs-actual-chart.tsx (grouped BarChart)
- forms/project-form.tsx
- forms/expense-form.tsx
- forms/revenue-form.tsx
- forms/supplier-form.tsx
- forms/purchase-form.tsx
- forms/employee-form.tsx
- audit/alert-list.tsx (alerts with severity badges, action buttons)
- audit/change-log.tsx (timeline of changes)
- theme-provider.tsx (next-themes)
- providers.tsx (wraps all providers)

### 8. Audit System (POST /api/audit/check)
Must detect:
1. DUPLICATE: same supplier_id + amount + date within 3 days
2. DUPLICATE_RECEIPT: same receipt_url on multiple expenses
3. DOUBLE_PAYROLL: same employee_id paid twice in same reference_month
4. AMOUNT_ANOMALY: single expense > 30% of project estimated_budget
5. DATE_ERROR: paid_date before expense date, or dates > 60 days in future
6. BUDGET_OVERRUN: project total expenses > 90% of budget with completion < 70%
7. MISSING_LINK: expense without project_id or category_id
8. SUPPLIER_CONCENTRATION: one supplier > 40% of a project's total costs
9. PAYROLL_EXCESS: monthly payroll > (contract_value / planned_months) * 1.3

Each creates an audit_alert with appropriate severity.

### 9. Vercel Config
vercel.json with cron: /api/audit/check daily at 06:00 UTC-3

### 10. README.md
Setup instructions: clone, npm install, create Supabase project, run migration, set env vars, deploy to Vercel.

## FINAL REMINDER
- Create complete, real, working code for EVERY file listed above
- No placeholder comments like "// TODO" or "// implement later"
- Professional quality UI
- All text in Portuguese (Obras, Despesas, Receitas, Fornecedores, Funcionários, etc)
- Handle loading/empty/error states
- Use sonner toasts for user feedback