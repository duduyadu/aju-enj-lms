import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-botanical/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Museum Editorial Primary - Botanical Green
        default:
          "bg-botanical text-porcelain rounded-full shadow-museum hover:shadow-museum-hover hover:scale-[1.02]",
        // Museum Gold Accent
        gold:
          "bg-museum-gold text-espresso rounded-full shadow-museum hover:shadow-museum-hover hover:scale-[1.02]",
        // Outline - Subtle border
        outline:
          "border border-museum-border bg-porcelain text-espresso rounded-full hover:bg-museum-border/30 hover:border-taupe",
        // Ghost - Minimal
        ghost:
          "text-espresso hover:bg-museum-border/50 rounded-full",
        // Secondary - Taupe
        secondary:
          "bg-taupe/20 text-espresso rounded-full hover:bg-taupe/30",
        // Destructive
        destructive:
          "bg-red-500/90 text-white rounded-full shadow-sm hover:bg-red-600",
        // Link style
        link:
          "text-botanical underline-offset-4 hover:underline",
        // Legacy variants (kept for compatibility)
        navy:
          "bg-aju-navy text-white rounded-full shadow hover:bg-aju-navy/90",
        sky:
          "bg-aju-sky text-white rounded-full shadow hover:bg-aju-sky/90",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 py-1.5 text-[10px]",
        lg: "h-12 px-8 py-3",
        xl: "h-14 px-10 py-4 text-xs",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }