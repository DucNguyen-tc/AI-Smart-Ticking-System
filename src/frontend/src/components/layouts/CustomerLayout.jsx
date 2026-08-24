import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ticket, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/custom/ThemeToggle'
import { Button } from '@/components/ui/button'

import { useAuthStore } from '@/stores/useAuthStore'

export function CustomerLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Ticket className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block">Smart Ticketing</span>
          </Link>
          
          <nav className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block">
              FAQ
            </Link>
            <ThemeToggle />
            <div className="flex items-center gap-2 border-l pl-3 sm:pl-4 border-border ml-1">
              {isAuthenticated ? (
                <>
                  <span className="text-sm font-medium hidden sm:inline-block mr-2 text-primary">
                    Xin chào, {user?.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline-block">Đăng xuất</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                    <Link to="/login">Đăng nhập</Link>
                  </Button>
                  <Button size="sm" asChild className="btn-lift">
                    <Link to="/register">Đăng ký</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 md:py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Smart Ticketing System. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
