import { NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'
import { createServerClient, COMPANY_ID } from '@/lib/supabase/server'

type WritePermissionResult =
  | { allowed: true; userId: string }
  | { allowed: false; response: NextResponse }

/**
 * Verifica se o usuário tem permissão de escrita (POST/PUT/DELETE).
 * Viewers recebem 403. Sem user_id retorna 401.
 */
export async function checkWritePermission(
  req: { headers: { get(name: string): string | null } }
): Promise<WritePermissionResult> {
  const userId = req.headers.get('x-user-id')

  if (!userId) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      ),
    }
  }

  const supabase = createServerClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .eq('company_id', COMPANY_ID)
    .single()

  if (profile?.role === 'viewer') {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Sem permissão para esta ação' },
        { status: 403 }
      ),
    }
  }

  return { allowed: true, userId }
}

/**
 * Sanitiza erros do Supabase para não expor detalhes internos ao cliente.
 * Loga o erro completo no servidor.
 */
export function handleDbError(error: { message: string; code?: string }, context?: string) {
  console.error(`[DB Error]${context ? ` ${context}:` : ''}`, error.message, error.code || '')

  // Mapear erros conhecidos do Postgres para mensagens amigáveis
  if (error.code === '23505') {
    return NextResponse.json(
      { error: 'Registro duplicado. Este item já existe.' },
      { status: 409 }
    )
  }
  if (error.code === '23503') {
    return NextResponse.json(
      { error: 'Referência inválida. Um dos campos relacionados não existe.' },
      { status: 400 }
    )
  }
  if (error.code === '23502') {
    return NextResponse.json(
      { error: 'Campo obrigatório não preenchido.' },
      { status: 400 }
    )
  }
  if (error.message?.includes('not found') || error.message?.includes('No rows')) {
    return NextResponse.json(
      { error: 'Registro não encontrado.' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { error: 'Erro interno do servidor. Tente novamente.' },
    { status: 500 }
  )
}

/**
 * Valida o body da request com um schema Zod.
 * Retorna os dados parseados ou uma NextResponse com erro 400.
 */
export function validateBody<T>(body: unknown, schema: ZodSchema<T>):
  { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const data = schema.parse(body)
    return { success: true, data }
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map(e => {
        const path = e.path.join('.')
        return path ? `${path}: ${e.message}` : e.message
      })
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Dados inválidos', details: messages },
          { status: 400 }
        ),
      }
    }
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Erro ao processar dados enviados.' },
        { status: 400 }
      ),
    }
  }
}
