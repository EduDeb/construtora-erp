export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'
import { handleDbError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const userId = req.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', COMPANY_ID)
    .single()

  if (error) {
    // If profile doesn't exist, create one as admin (first user) or viewer
    const { count } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', COMPANY_ID)

    const role = (count || 0) === 0 ? 'admin' : 'viewer'
    const email = req.headers.get('x-user-email') || ''

    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        company_id: COMPANY_ID,
        email,
        name: email.split('@')[0],
        role,
      })
      .select()
      .single()

    if (createError) return handleDbError(createError, 'POST user-profile')
    return NextResponse.json(newProfile)
  }

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const supabase = createServerClient()
  const userId = req.headers.get('x-user-id')
  const body = await req.json()

  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Only admins can change roles
  if (body.target_user_id && body.role) {
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', COMPANY_ID)
      .single()

    if (currentProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem alterar permissões' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role: body.role })
      .eq('user_id', body.target_user_id)
      .eq('company_id', COMPANY_ID)
      .select()
      .single()

    if (error) return handleDbError(error, 'PUT user-profile role')
    return NextResponse.json(data)
  }

  // Update own profile name
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ name: body.name })
    .eq('user_id', userId)
    .eq('company_id', COMPANY_ID)
    .select()
    .single()

  if (error) return handleDbError(error, 'PUT user-profile')
  return NextResponse.json(data)
}
