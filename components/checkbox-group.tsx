"use client"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface CheckboxGroupProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  className?: string
}

export function CheckboxGroup({
  options,
  value,
  onChange,
  className,
}: CheckboxGroupProps) {
  const handleChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...value, option])
    } else {
      onChange(value.filter((v) => v !== option))
    }
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", className)}>
      {options.map((option) => (
        <label
          key={option}
          className={cn(
            "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all",
            "hover:bg-accent/50",
            value.includes(option) && "bg-primary/5 border-primary/30"
          )}
        >
          <Checkbox
            checked={value.includes(option)}
            onCheckedChange={(checked) => handleChange(option, checked as boolean)}
          />
          <span className="text-sm">{option}</span>
        </label>
      ))}
    </div>
  )
}
