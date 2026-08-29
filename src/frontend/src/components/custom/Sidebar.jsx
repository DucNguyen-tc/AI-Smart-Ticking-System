import React from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Sidebar({ items = [], collapsed = false, onToggle }) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border min-h-[64px]">
        {!collapsed && <span className="font-semibold text-lg truncate">CSKH System</span>}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggle}
          className={cn("text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", collapsed && "mx-auto")}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <NavLink
                key={index}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0 py-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                {Icon && <Icon className={cn("w-5 h-5", !collapsed && "mr-3")} />}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
