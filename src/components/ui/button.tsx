import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

// cva define as "variantes" possíveis do botão de uma vez só, em vez de escrever
// um monte de "if" pra decidir a classe certa toda vez que usar o botão.
// Exportado também, pra dar pra aplicar essas mesmas classes num elemento que
// NÃO é um <button> de verdade — como um <Link>, que precisa parecer um botão
// mas continuar sendo um link de navegação de verdade (bom pra acessibilidade
// e pro clique-direito "abrir em nova aba" funcionar)
export const buttonVariants = cva(
  // classes que TODO botão tem, não importa a variante
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium " +
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // botão principal: fundo dourado sólido, usado pra ação primária da tela
        primary: "bg-accent text-accent-foreground hover:opacity-90",
        // botão secundário: só contorno, usado pra ações menos importantes
        outline: "border border-border bg-transparent text-foreground hover:bg-surface-hover",
        // botão "fantasma": sem fundo nem borda, usado dentro de listas/menus
        ghost: "bg-transparent text-foreground hover:bg-surface-hover",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
      },
    },
    // se ninguém especificar, usa essas variantes
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

// Junta os atributos normais de um <button> HTML com as variantes que criamos acima
interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

// forwardRef permite que quem usar <Button /> também consiga pegar uma referência
// direta ao elemento <button> real, se precisar (comum em formulários)
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
