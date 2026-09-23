"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface DeleteMovementButtonProps {
  movementId: string;
  // "icon": só o ícone da lixeira, usado dentro de linhas de tabela
  // "button": botão completo com texto, usado na tela de detalhe
  variant?: "icon" | "button";
  // Se informado, navega pra essa rota depois de excluir (usado na tela de
  // detalhe, já que a movimentação deixou de existir — não faz sentido continuar
  // nela). Se não informado, só atualiza a lista onde o botão está.
  redirectTo?: string;
}

export function DeleteMovementButton({ movementId, variant = "icon", redirectTo }: DeleteMovementButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    // confirm() é simples e nativo do navegador — suficiente aqui porque é uma
    // ação destrutiva e permanente (sem "lixeira" pra recuperar depois)
    const confirmado = window.confirm(
      "Tem certeza que quer excluir essa movimentação? Essa ação não pode ser desfeita."
    );
    if (!confirmado) return;

    setDeleting(true);
    const { error } = await supabase.from("movements").delete().eq("id", movementId);
    setDeleting(false);

    if (error) {
      window.alert(error.message);
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  if (variant === "icon") {
    return (
      <Tooltip label="Excluir movimentação">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Excluir"
          className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={16} />
        </button>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDelete}
      disabled={deleting}
      className="border-danger/40 text-danger hover:bg-danger/10"
    >
      <Trash2 size={16} /> {deleting ? "Excluindo..." : "Excluir movimentação"}
    </Button>
  );
}
