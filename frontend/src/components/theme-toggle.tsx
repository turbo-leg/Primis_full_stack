'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'
import { Button } from './ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    console.log('ThemeToggle mounted, theme:', theme)
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    console.log('Toggling theme from', theme, 'to', newTheme)
    setTheme(newTheme)
  }

  // Always render the button, just disable it when not mounted
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      disabled={!mounted}
      className="text-white hover:text-white hover:bg-white/20 transition-all border-2 border-white/50 hover:border-white bg-white/10 shadow-lg"
      aria-label="Toggle theme"
      title={mounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Loading...'}
    >
      {mounted && theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  )
}
