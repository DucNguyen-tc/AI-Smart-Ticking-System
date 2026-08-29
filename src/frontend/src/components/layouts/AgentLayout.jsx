import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Ticket, HelpCircle, LogOut, Settings, Bell, Menu, X, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/custom/ThemeToggle'
import { Sidebar } from '@/components/custom/Sidebar'
import { cn } from '@/lib/utils'

import { useAuthStore } from '@/stores/useAuthStore'

const SIDEBAR_ITEMS_TOP = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/agent/dashboard' },
  { icon: Ticket,          label: 'Tickets',   href: '/agent/dashboard' },
  { icon: Users,           label: 'Users',     href: '/agent/users' },
  { icon: HelpCircle,      label: 'FAQs',      href: '/agent/faqs' },
]

const SIDEBAR_ITEMS_BOTTOM = [
  { icon: LogOut, label: 'Đăng xuất', href: '/login' },
]

export function AgentLayout({ children }) {
  const { logout, user } = useAuthStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = (e) => {
    e.preventDefault()
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <Link to="/agent/dashboard" className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <span className="font-bold text-base hidden sm:inline-block">Smart Ticketing Dashboard</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-danger text-white">3</Badge>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user?.name?.substring(0, 2).toUpperCase() || 'AG'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline-block">
              {user?.name || 'Agent A'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "z-40 flex-shrink-0 border-r border-border bg-card transition-all duration-300",
          // Desktop
          "hidden md:flex md:flex-col",
          sidebarCollapsed ? "md:w-16" : "md:w-60",
          // Mobile
          mobileMenuOpen && "!flex !fixed inset-y-14 left-0 w-60"
        )}>
          <div className="flex flex-col flex-1 py-4">
            <nav className="flex-1 space-y-1 px-2">
              {SIDEBAR_ITEMS_TOP.map((item, i) => {
                const Icon = item.icon
                return (
                  <Link
                    key={i}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", !sidebarCollapsed && "mr-3")} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </nav>

            <Separator className="my-2 mx-2" />

            <nav className="space-y-1 px-2">
              {SIDEBAR_ITEMS_BOTTOM.map((item, i) => {
                const Icon = item.icon
                return (
                  <Link
                    key={i}
                    to={item.href}
                    onClick={(e) => {
                      if (item.label === 'Đăng xuất') {
                        handleLogout(e)
                      } else {
                        setMobileMenuOpen(false)
                      }
                    }}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", !sidebarCollapsed && "mr-3")} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Collapse Toggle (desktop only) */}
          <div className="hidden md:flex border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn("w-full", sidebarCollapsed && "px-0")}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4 mr-2" /><span>Thu gọn</span></>}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
