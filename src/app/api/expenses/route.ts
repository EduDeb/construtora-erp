import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const supplierId = searchParams.get('supplier_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('expenses')
    .select('*, project:projects(id,name), category:cost_categories(id,name), supplier:suppliers(id,name)')
    .eq('company_id', COMPANY_ID)
    .order('date', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)
  if (supplierId) query = query.eq('supplier_id', supplierId)
  if (status) query = query.eq('payment_status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...body, company_id: COMPANY_ID })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
