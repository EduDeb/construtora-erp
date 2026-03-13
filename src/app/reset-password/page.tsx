"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { HardHat, Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const passwordInvalid = (touched.password || submitted) && password.length < 6
  const confirmInvalid = (touched.confirm || submitted) && confirmPassword !== password

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (password.length < 6 || confirmPassword !== password) return

    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Não foi possível conectar ao servidor.")
    }

    setLoading(false)
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
          <p className="text-muted-foreground mt-2">Definir nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Nova senha</label>
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

          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium">Confirmar senha</label>
            <input
              id="confirm"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur("confirm")}
              placeholder="Repita a nova senha"
              disabled={loading}
              className={inputClass(confirmInvalid)}
            />
            {confirmInvalid && (
              <p className="text-xs text-destructive">As senhas não coincidem</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Sistema de Gestão para Construtoras
        </p>
      </div>
    </div>
  )
}
