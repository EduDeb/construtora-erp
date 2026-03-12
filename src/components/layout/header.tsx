"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Bell, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [alertCount, setAlertCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  useEffect(() => {
    fetch('/api/audit/alerts?status=pending&count_only=true')
      .then(r => r.json())
      .then(d => setAlertCount(d.count || 0))
      .catch(() => setAlertCount(0))
  }, [])

  return (
    <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - spacer for mobile hamburger */}
        <div className="md:block">
          <h2 className="text-lg font-semibold hidden md:block">DEB Construtora</h2>
          <div className="w-10 md:hidden" />
        </div>

        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-sm text-muted-foreground hidden md:inline">
              {userEmail}
            </span>
          )}
          <a href="/auditoria" className="relative p-2 rounded-lg hover:bg-accent">
            <Bell size={20} />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </a>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-accent"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
              router.refresh()
            }}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
