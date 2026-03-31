import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface ModuleCardProps {
  title: string
  description: string
  tag: string
  icon: LucideIcon
  accentColor: string
  gradientClass: string
  children: React.ReactNode
}

export function ModuleCard({
  title,
  description,
  tag,
  icon: Icon,
  accentColor,
  gradientClass,
  children,
}: ModuleCardProps) {
  return (
    <Card className="relative overflow-hidden border-none shadow-lg">
      {/* Accent border on left */}
      <div className={cn("absolute left-0 top-0 h-full w-1.5", gradientClass)} />
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", gradientClass)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="font-serif text-xl">{title}</CardTitle>
            </div>
          </div>
          <span className={cn(
            "rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm",
            gradientClass
          )}>
            {tag}
          </span>
        </div>
        <CardDescription className="mt-2 pl-[52px]">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  )
}
