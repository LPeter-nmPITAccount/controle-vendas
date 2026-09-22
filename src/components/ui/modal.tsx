"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Tooltip } from "@/components/ui/tooltip";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// Modal genérico e reaproveitável: qualquer tela que precisar de um formulário
// "flutuante" (criar/editar) usa este mesmo componente, só trocando o conteúdo.
export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null; // não renderiza nada enquanto estiver fechado

  return (
    // Camada escura por trás do modal — clicar nela fecha o modal (comportamento esperado)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        // stopPropagation: impede que um clique DENTRO do modal feche ele por engano
        // (senão, o clique "vazaria" pro fundo escuro e disparia o onClose de cima)
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <Tooltip label="Fechar">
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-lg p-1 text-muted hover:bg-surface-hover hover:text-foreground"
            >
              <X size={18} />
            </button>
          </Tooltip>
        </div>
        {children}
      </div>
    </div>
  );
}
