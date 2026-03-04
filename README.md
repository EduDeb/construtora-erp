# Construtora ERP

Sistema de gestão completo para construtora, com controle financeiro, gestão de obras, fornecedores, folha de pagamento, compras e auditoria automática.

## Stack

- **Frontend:** Next.js 14 (App Router) + TailwindCSS + Recharts
- **Backend:** Next.js API Routes
- **Banco de Dados:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Deploy:** Vercel + Supabase

## Setup Rápido

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd construtora-app
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Copie a **URL** e a **anon key** do projeto (Settings > API)
3. Copie a **service role key** (Settings > API > Service role key)

### 3. Rodar a migration

1. No Supabase, vá em **SQL Editor**
2. Cole o conteúdo de `supabase/migrations/001_initial.sql`
3. Execute

Isso cria todas as tabelas, triggers de auditoria, e dados iniciais.

### 4. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`

### 6. Deploy na Vercel

1. Conecte o repositório na [Vercel](https://vercel.com)
2. Adicione as variáveis de ambiente
3. Deploy!

O `vercel.json` já configura o cron de auditoria para rodar diariamente às 06:00.

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Visão consolidada com KPIs, gráficos e alertas |
| **Obras** | Cadastro e gestão de obras com centro de custo |
| **Financeiro** | Contas a pagar, receber e fluxo de caixa |
| **Compras** | Pedidos de compra com itens e status |
| **Fornecedores** | Cadastro com avaliação |
| **Pessoas** | Funcionários (CLT/PJ/Freelancer) e folha de pagamento |
| **Relatórios** | DRE simplificado, resultado por obra, exportação CSV |
| **Auditoria** | Detecção automática de erros, duplicidades e anomalias |
| **Configurações** | Empresa, categorias de custo |

## Sistema de Auditoria

O sistema roda verificações automáticas diariamente e detecta:

- 🔴 **Despesas duplicadas** (mesmo fornecedor + valor + data próxima)
- 🔴 **Recibos/NF duplicados**
- 🔴 **Pagamento duplo de funcionário**
- 🔴 **Valores anômalos** (despesa > 30% do orçamento da obra)
- 🔴 **Estouro de orçamento** (>90% gasto com <70% executado)
- 🟡 **Datas inconsistentes**
- 🟡 **Concentração em fornecedor** (>40% dos custos)
- 🔵 **Despesas sem vínculo** (sem obra ou categoria)

Toda alteração em dados financeiros é registrada no log de auditoria com valores antigos e novos.

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/              # API Routes
│   │   ├── audit/        # Auditoria
│   │   ├── dashboard/    # KPIs e cashflow
│   │   ├── expenses/     # Despesas
│   │   ├── revenues/     # Receitas
│   │   ├── projects/     # Obras
│   │   ├── suppliers/    # Fornecedores
│   │   ├── employees/    # Funcionários
│   │   ├── purchases/    # Compras
│   │   ├── payroll/      # Folha
│   │   └── categories/   # Categorias de custo
│   └── (dashboard)/      # Páginas do sistema
├── components/
│   ├── charts/           # Gráficos (Recharts)
│   ├── layout/           # Sidebar e Header
│   └── ...               # Componentes reutilizáveis
├── lib/
│   ├── supabase/         # Clientes Supabase
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Helpers (formatação, etc)
└── supabase/
    └── migrations/       # SQL migrations
```

## Licença

Proprietary - DEB Construtora
