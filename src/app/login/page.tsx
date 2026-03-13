"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { HardHat, Loader2 } from "lucide-react"

type View = "login" | "forgot"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [view, setView] = useState<View>("login")
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const emailInvalid = (touched.email || submitted) && (!email || !/\S+@\S+\.\S+/.test(email))
  const passwordInvalid = (touched.password || submitted) && (!password || password.length < 6)

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!email || !password) return

    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(translateAuthError(error.message))
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.")
    }

    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!email) return

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) {
        setError(translateAuthError(error.message))
      } else {
        setMessage("Email de recuperação enviado! Verifique sua caixa de entrada.")
      }
    } catch {
      setError("Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.")
    }

    setLoading(false)
  }

  const switchView = (newView: View) => {
    setView(newView)
    setError("")
    setMessage("")
    setSubmitted(false)
    setTouched({})
  }

  const inputClass = (invalid: boolean) =>
    `w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
      invalid ? "border-destructive focus:ring-destructive" : ""
    }`

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <HardHat className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Construtora ERP</h1>
          <p className="text-sm text-muted-foreground">DEB Construtora</p>
          <p className="text-muted-foreground mt-2">
            {view === "forgot" ? "Recuperar senha" : "Faça login para acessar o sistema"}
          </p>
        </div>

        {view === "login" ? (
          <form onSubmit={handleLogin} className="rounded-xl border bg-card p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="seu@email.com"
                disabled={loading}
                className={inputClass(emailInvalid)}
              />
              {emailInvalid && (
                <p className="text-xs text-destructive">Informe um email válido</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Senha</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                className={inputClass(passwordInvalid)}
              />
              {passwordInvalid && (
                <p className="text-xs text-destructive">A senha deve ter no mínimo 6 caracteres</p>
              )}
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => switchView("forgot")}
                className="text-sm text-primary hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Aguarde..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="rounded-xl border bg-card p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 rounded-lg bg-green-500/10 text-green-500 text-sm">
                {message}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="forgot-email" className="text-sm font-medium">Email</label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="seu@email.com"
                disabled={loading}
                className={inputClass(emailInvalid)}
              />
              {emailInvalid && (
                <p className="text-xs text-destructive">Informe um email válido</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Enviando..." : "Enviar email de recuperação"}
            </button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => switchView("login")}
                className="text-primary hover:underline"
              >
                Voltar para o login
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Sistema de Gestão para Construtoras
        </p>
      </div>
    </div>
  )
}

function translateAuthError(message: string): string {
  if (message === "Invalid login credentials") return "Email ou senha incorretos"
  if (message.includes("Email not confirmed")) return "Email não confirmado. Verifique sua caixa de entrada."
  if (message.includes("already registered")) return "Este email já está cadastrado."
  if (message.includes("Password should be")) return "A senha deve ter no mínimo 6 caracteres."
  if (message.includes("rate limit") || message.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos."
  if (message.includes("Failed to fetch") || message.includes("fetch")) return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente."
  if (message.includes("network") || message.includes("Network")) return "Erro de rede. Verifique sua conexão."
  return message
}
