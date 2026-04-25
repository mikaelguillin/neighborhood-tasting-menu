import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] transition-all duration-200 ease-out active:scale-[0.95] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border border-primary hover:bg-primary/90",
        outline: "bg-transparent text-primary border border-primary hover:bg-primary/5",
        black: "bg-foreground text-card border border-foreground hover:bg-foreground/90",
        dark: "bg-transparent text-foreground border border-foreground hover:bg-foreground/5",
        inverted: "bg-card text-primary border border-card hover:bg-card/90",
        ghostDark: "bg-transparent text-card border border-card hover:bg-card/10",
        ghost: "hover:bg-foreground/5 text-foreground border border-transparent",
        link: "text-primary underline-offset-4 hover:underline border border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary hover:bg-secondary/80",
      },
      size: {
        default: "h-10 px-5 py-1.5 text-sm rounded-pill",
        sm: "h-9 px-4 text-xs rounded-pill",
        lg: "h-12 px-8 text-base rounded-pill",
        xl: "h-14 px-10 text-base rounded-pill",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
