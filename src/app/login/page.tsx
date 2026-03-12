"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) {
          setError(translateAuthError(error.message))
        } else {
          setMessage("Conta criada! Verifique seu email para confirmar o cadastro.")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          setError(translateAuthError(error.message))
        } else {
          router.push("/")
          router.refresh()
        }
      }
    } catch (err) {
      setError("Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Construtora ERP</h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? "Criar nova conta" : "Faça login para acessar o sistema"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4">
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
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Aguarde..." : isSignUp ? "Criar Conta" : "Entrar"}
          </button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage("") }}
              className="text-primary hover:underline"
            >
              {isSignUp ? "Já tenho conta — fazer login" : "Não tenho conta — criar agora"}
            </button>
          </div>
        </form>

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
  if (message.includes("already registered")) return "Este email já está cadastrado. Tente fazer login."
  if (message.includes("Password should be")) return "A senha deve ter no mínimo 6 caracteres."
  if (message.includes("rate limit") || message.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos."
  if (message.includes("Failed to fetch") || message.includes("fetch")) return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente."
  if (message.includes("network") || message.includes("Network")) return "Erro de rede. Verifique sua conexão."
  return message
}
