import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
}

// Tooltip simples, feito só com CSS (sem nenhuma biblioteca nem JavaScript):
// o truque é o "group" do Tailwind — quando o mouse passa por cima do elemento
// pai (o botão), a classe group-hover é aplicada no filho (o balãozinho de texto),
// tornando ele visível através da opacidade.
export function Tooltip({ label, children, side = "top" }: TooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md",
          "bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0",
          "transition-opacity duration-150 group-hover/tooltip:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2"
        )}
      >
        {label}
      </span>
    </span>
  );
}
