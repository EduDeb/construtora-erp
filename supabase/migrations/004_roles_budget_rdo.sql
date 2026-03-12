-- ============================================================
-- Migration 004: User Profiles (Roles), Budget Items, Daily Reports, Measurements
-- ============================================================

-- 1. USER PROFILES (Roles/Permissions)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);

-- 2. PROJECT BUDGET ITEMS (Orçamento de Obra)
CREATE TABLE IF NOT EXISTS project_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  phase TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT DEFAULT 'vb',
  quantity NUMERIC(12,2) DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  category_id UUID REFERENCES cost_categories(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_items_project ON project_budget_items(project_id);
CREATE INDEX idx_budget_items_company ON project_budget_items(company_id);

-- 3. DAILY REPORTS (Diário de Obra / RDO)
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  report_date DATE NOT NULL,
  weather TEXT CHECK (weather IN ('sol', 'nublado', 'chuva', 'chuva_forte', 'impraticavel')),
  temperature_min NUMERIC(4,1),
  temperature_max NUMERIC(4,1),
  workforce_own INT DEFAULT 0,
  workforce_contractor INT DEFAULT 0,
  activities TEXT,
  equipment_used TEXT,
  materials_received TEXT,
  incidents TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, report_date)
);

CREATE INDEX idx_daily_reports_project ON daily_reports(project_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date DESC);

-- 4. MEASUREMENTS (Medição / Avanço Físico)
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  budget_item_id UUID REFERENCES project_budget_items(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  measurement_number INT NOT NULL DEFAULT 1,
  measured_percentage NUMERIC(5,2) DEFAULT 0 CHECK (measured_percentage >= 0 AND measured_percentage <= 100),
  measured_quantity NUMERIC(12,2) DEFAULT 0,
  measured_value NUMERIC(14,2) DEFAULT 0,
  measurement_date DATE NOT NULL,
  measured_by UUID,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_measurements_project ON measurements(project_id);
CREATE INDEX idx_measurements_budget_item ON measurements(budget_item_id);

-- 5. Add updated_at trigger to new tables
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['user_profiles', 'project_budget_items', 'daily_reports', 'measurements'])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- 6. Add audit log triggers to new tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['project_budget_items', 'daily_reports', 'measurements'])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION fn_audit_log()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- 7. Disable RLS on new tables (single-tenant)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_budget_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE measurements DISABLE ROW LEVEL SECURITY;
