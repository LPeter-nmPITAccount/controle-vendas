"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

const STATUS_OPTIONS = ["Para Anotar", "Anotado"] as const;

interface StatusEditorProps {
  movementId: string;
  currentStatus: string;
}

// Componente pequeno e focado: só sabe trocar o status de UMA movimentação.
// Fica isolado num Client Component porque precisa reagir a clique — o resto
// da página (itens, valores) continua sendo um Server Component normal.
export function StatusEditor({ movementId, currentStatus }: StatusEditorProps) {
  const supabase = createClient();
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("movements").update({ status }).eq("id", movementId);

    setSaving(false);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }

    setFeedback({ type: "success", message: "Status atualizado." });
    // Recarrega os dados vindos do servidor (price_total, date_anotado, etc.)
    // sem precisar de um reload completo da página
    router.refresh();
  }

  const changed = status !== currentStatus;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {/* Só habilita o botão quando o valor escolhido é realmente diferente
            do que já está salvo — evita uma chamada desnecessária ao banco */}
        <Button onClick={handleSave} disabled={!changed || saving} size="sm">
          {saving ? "Salvando..." : "Salvar status"}
        </Button>
      </div>
      {feedback && <FeedbackBanner type={feedback.type} message={feedback.message} />}
    </div>
  );
}
