import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] transition-colors focus:outline-none focus:ring-2 focus:ring-botanical/30",
  {
    variants: {
      variant: {
        // Museum Editorial variants
        default:
          "border-transparent bg-botanical text-porcelain",
        secondary:
          "border-transparent bg-taupe/20 text-espresso",
        gold:
          "border-transparent bg-museum-gold text-espresso",
        outline:
          "border-museum-border bg-transparent text-espresso",
        botanical:
          "border-transparent bg-botanical/10 text-botanical",
        destructive:
          "border-transparent bg-red-100 text-red-600",
        // Legacy variants
        navy:
          "border-transparent bg-aju-navy text-white",
        sky:
          "border-transparent bg-aju-sky text-aju-navy",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }