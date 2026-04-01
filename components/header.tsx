"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Store, BarChart3, Megaphone, Target, ImageIcon, Menu, X } from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: "/", label: "四件套首页", icon: Target, color: "text-brand" },
  { href: "/market", label: "商圈调研", icon: Store, color: "text-market" },
  { href: "/activity", label: "活动方案", icon: Megaphone, color: "text-activity" },
  { href: "/statistics", label: "数据统计", icon: BarChart3, color: "text-statistics" },
  { href: "/image-merger", label: "图片拼接", icon: ImageIcon, color: "text-muted-foreground" },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-serif font-bold text-lg">
            呈
          </div>
          <div className="hidden sm:block">
            <div className="font-serif font-semibold text-lg leading-tight">呈尚策划</div>
            <div className="text-xs text-muted-foreground">外卖店铺四件套</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 transition-all",
                    isActive && "bg-secondary font-medium"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? item.color : "text-muted-foreground")} />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t bg-background p-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-secondary font-medium"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive ? item.color : "text-muted-foreground")} />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
