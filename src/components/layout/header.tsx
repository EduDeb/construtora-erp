"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Bell } from "lucide-react"
import { useEffect, useState } from "react"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [alertCount, setAlertCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch('/api/audit/alerts?status=pending&count_only=true')
      .then(r => r.json())
      .then(d => setAlertCount(d.count || 0))
      .catch(() => {})
  }, [])

  return (
    <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          <h2 className="text-lg font-semibold">DEB Construtora</h2>
        </div>

        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </header>
  )
}
