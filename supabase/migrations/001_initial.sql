-- ============================================
-- CONSTRUTORA ERP - Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- COMPANIES
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECTS (OBRAS)
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT,
  client_cnpj TEXT,
  address TEXT,
  contract_value NUMERIC(15,2) DEFAULT 0,
  estimated_budget NUMERIC(15,2) DEFAULT 0,
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','execution','completed','suspended')),
  completion_percentage INT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================
-- COST CATEGORIES
-- ============================================
CREATE TABLE cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct','indirect')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_categories_company ON cost_categories(company_id);

-- ============================================
-- SUPPLIERS (FORNECEDORES)
-- ============================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cnpj_cpf TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT,
  notes TEXT,
  rating INT DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_company ON suppliers(company_id);

-- ============================================
-- EXPENSES (DESPESAS)
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  category_id UUID REFERENCES cost_categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','overdue','cancelled')),
  payment_method TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_company ON expenses(company_id);
CREATE INDEX idx_expenses_project ON expenses(project_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_supplier ON expenses(supplier_id);
CREATE INDEX idx_expenses_status ON expenses(payment_status);
CREATE INDEX idx_expenses_due_date ON expenses(due_date);

-- ============================================
-- REVENUES (RECEITAS)
-- ============================================
CREATE TABLE revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_name TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  expected_date DATE,
  received_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','received','overdue','cancelled')),
  installment_number INT,
  total_installments INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revenues_company ON revenues(company_id);
CREATE INDEX idx_revenues_project ON revenues(project_id);
CREATE INDEX idx_revenues_status ON revenues(status);

-- ============================================
-- EMPLOYEES (FUNCIONÁRIOS)
-- ============================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT,
  role_function TEXT,
  hire_date DATE,
  type TEXT NOT NULL DEFAULT 'clt' CHECK (type IN ('clt','pj','freelancer')),
  base_salary NUMERIC(15,2) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_active ON employees(active);

-- ============================================
-- EMPLOYEE ASSIGNMENTS
-- ============================================
CREATE TABLE employee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  role_in_project TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assignments_employee ON employee_assignments(employee_id);
CREATE INDEX idx_assignments_project ON employee_assignments(project_id);

-- ============================================
-- PAYROLL (FOLHA DE PAGAMENTO)
-- ============================================
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  reference_month DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  bonuses NUMERIC(15,2) DEFAULT 0,
  deductions NUMERIC(15,2) DEFAULT 0,
  net_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payroll_company ON payroll(company_id);
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_project ON payroll(project_id);
CREATE INDEX idx_payroll_month ON payroll(reference_month);

-- ============================================
-- PURCHASE ORDERS (PEDIDOS DE COMPRA)
-- ============================================
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  description TEXT,
  total_amount NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','ordered','delivered','cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid')),
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_company ON purchase_orders(company_id);
CREATE INDEX idx_purchases_project ON purchase_orders(project_id);
CREATE INDEX idx_purchases_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchases_status ON purchase_orders(status);

-- ============================================
-- PURCHASE ITEMS
-- ============================================
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'un',
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_items_order ON purchase_items(purchase_order_id);

-- ============================================
-- PROJECT SCHEDULE (CRONOGRAMA)
-- ============================================
CREATE TABLE project_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  planned_cost NUMERIC(15,2) DEFAULT 0,
  actual_cost NUMERIC(15,2) DEFAULT 0,
  planned_revenue NUMERIC(15,2) DEFAULT 0,
  actual_revenue NUMERIC(15,2) DEFAULT 0,
  planned_start DATE,
  planned_end DATE,
  actual_start DATE,
  actual_end DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedule_project ON project_schedule(project_id);

-- ============================================
-- TRANSACTIONS (FLUXO DE CAIXA)
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  source_type TEXT,
  source_id UUID,
  amount NUMERIC(15,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_company ON transactions(company_id);
CREATE INDEX idx_transactions_project ON transactions(project_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert','update','delete')),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_company ON audit_log(company_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- AUDIT ALERTS
-- ============================================
CREATE TABLE audit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical','warning','info')),
  title TEXT NOT NULL,
  description TEXT,
  related_table TEXT,
  related_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_alerts_company ON audit_alerts(company_id);
CREATE INDEX idx_audit_alerts_status ON audit_alerts(status);
CREATE INDEX idx_audit_alerts_severity ON audit_alerts(severity);

-- ============================================
-- TRIGGERS: Auto-create transactions
-- ============================================

-- On expense INSERT/UPDATE
CREATE OR REPLACE FUNCTION fn_expense_to_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'paid' THEN
    INSERT INTO transactions (company_id, project_id, type, source_type, source_id, amount, date, description)
    VALUES (NEW.company_id, NEW.project_id, 'expense', 'expense', NEW.id, NEW.amount, COALESCE(NEW.paid_date, NEW.date), NEW.description);
  ELSIF TG_OP = 'UPDATE' AND NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    INSERT INTO transactions (company_id, project_id, type, source_type, source_id, amount, date, description)
    VALUES (NEW.company_id, NEW.project_id, 'expense', 'expense', NEW.id, NEW.amount, COALESCE(NEW.paid_date, NEW.date), NEW.description);
  ELSIF TG_OP = 'UPDATE' AND NEW.payment_status != 'paid' AND OLD.payment_status = 'paid' THEN
    DELETE FROM transactions WHERE source_type = 'expense' AND source_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expense_transaction
AFTER INSERT OR UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION fn_expense_to_transaction();

-- On revenue INSERT/UPDATE
CREATE OR REPLACE FUNCTION fn_revenue_to_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'received' THEN
    INSERT INTO transactions (company_id, project_id, type, source_type, source_id, amount, date, description)
    VALUES (NEW.company_id, NEW.project_id, 'income', 'revenue', NEW.id, NEW.amount, COALESCE(NEW.received_date, NEW.expected_date), NEW.description);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'received' AND OLD.status != 'received' THEN
    INSERT INTO transactions (company_id, project_id, type, source_type, source_id, amount, date, description)
    VALUES (NEW.company_id, NEW.project_id, 'income', 'revenue', NEW.id, NEW.amount, COALESCE(NEW.received_date, NEW.expected_date), NEW.description);
  ELSIF TG_OP = 'UPDATE' AND NEW.status != 'received' AND OLD.status = 'received' THEN
    DELETE FROM transactions WHERE source_type = 'revenue' AND source_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_revenue_transaction
AFTER INSERT OR UPDATE ON revenues
FOR EACH ROW EXECUTE FUNCTION fn_revenue_to_transaction();

-- On payroll INSERT/UPDATE
CREATE OR REPLACE FUNCTION fn_payroll_to_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'paid' THEN
    INSERT INTO transactions (company_id, project_id, type, source_type, source_id, amount, date, description)
    VALUES (NEW.company_id, NEW.project_id, 'expense', 'payroll', NEW.id, NEW.net_amount, NEW.payment_date, 'Folha - ' || NEW.reference_month);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status != 'paid' THEN
    INSERT INTO transactions (company_id, project_id, type, source_type, source_id, amount, date, description)
    VALUES (NEW.company_id, NEW.project_id, 'expense', 'payroll', NEW.id, NEW.net_amount, NEW.payment_date, 'Folha - ' || NEW.reference_month);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payroll_transaction
AFTER INSERT OR UPDATE ON payroll
FOR EACH ROW EXECUTE FUNCTION fn_payroll_to_transaction();

-- ============================================
-- TRIGGERS: Audit log on financial tables
-- ============================================
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_old JSONB;
  v_new JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_company_id := (v_old->>'company_id')::UUID;
    INSERT INTO audit_log (company_id, table_name, record_id, action, old_values)
    VALUES (v_company_id, TG_TABLE_NAME, OLD.id, 'delete', v_old);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_company_id := (v_new->>'company_id')::UUID;
    INSERT INTO audit_log (company_id, table_name, record_id, action, old_values, new_values)
    VALUES (v_company_id, TG_TABLE_NAME, NEW.id, 'update', v_old, v_new);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_company_id := (v_new->>'company_id')::UUID;
    INSERT INTO audit_log (company_id, table_name, record_id, action, new_values)
    VALUES (v_company_id, TG_TABLE_NAME, NEW.id, 'insert', v_new);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to all financial tables
CREATE TRIGGER trg_audit_expenses AFTER INSERT OR UPDATE OR DELETE ON expenses FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_audit_revenues AFTER INSERT OR UPDATE OR DELETE ON revenues FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_audit_payroll AFTER INSERT OR UPDATE OR DELETE ON payroll FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_audit_purchases AFTER INSERT OR UPDATE OR DELETE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_audit_projects AFTER INSERT OR UPDATE OR DELETE ON projects FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ============================================
-- TRIGGER: Auto-update updated_at on projects
-- ============================================
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO companies (id, name, cnpj, address, phone, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'DEB Construtora', '00.000.000/0001-00', 'Fortaleza, CE', '(85) 99999-0000', 'contato@debconstrutora.com.br');

INSERT INTO cost_categories (company_id, name, type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Material', 'direct'),
  ('00000000-0000-0000-0000-000000000001', 'Mão de Obra', 'direct'),
  ('00000000-0000-0000-0000-000000000001', 'Equipamentos', 'direct'),
  ('00000000-0000-0000-0000-000000000001', 'Serviços Terceirizados', 'direct'),
  ('00000000-0000-0000-0000-000000000001', 'Transporte', 'direct'),
  ('00000000-0000-0000-0000-000000000001', 'Custos Indiretos', 'indirect'),
  ('00000000-0000-0000-0000-000000000001', 'Administrativo', 'indirect');
