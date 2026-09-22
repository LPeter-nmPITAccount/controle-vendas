import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          // Um input com fundo próprio (surface), borda sutil, e destaque dourado
          // ao focar — consistente com o resto do sistema
          "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground",
          "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
