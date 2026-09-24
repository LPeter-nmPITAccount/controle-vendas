"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/status-badge";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));

interface ItemRow {
  id: string;
  amount: number;
  unit_price: number;
  products: { name: string; flavor: string | null } | { name: string; flavor: string | null }[] | null;
}

interface MovementQuickViewProps {
  movementId: string;
  clientName: string;
  type: string;
  status: string;
  priceTotal: number;
  createdAt: string;
}

// Modal "só de leitura" — de propósito NÃO tem nenhuma ação aqui dentro (editar
// status, editar itens, excluir). É exatamente por isso que ele pode ser um
// modal sem problema: ele nunca precisa abrir OUTRO modal por dentro dele.
// Quem quiser fazer alguma alteração é direcionado pra página completa.
export function MovementQuickView({
  movementId,
  clientName,
  type,
  status,
  priceTotal,
  createdAt,
}: MovementQuickViewProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // null = "ainda não buscou". Isso permite buscar os itens só na PRIMEIRA vez
  // que o modal abre, e reaproveitar depois, sem pedir de novo ao banco.
  const [items, setItems] = useState<ItemRow[] | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (items !== null) return; // já buscamos antes, não precisa de novo

    setLoading(true);
    const { data } = await supabase
      .from("movement_products")
      .select("id, amount, unit_price, products(name, flavor)")
      .eq("movement_id", movementId);
    setItems(data ?? []);
    setLoading(false);
  }

  return (
    <>
      <Tooltip label="Visualização rápida">
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Visualização rápida"
          className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
        >
          <Zap size={16} />
        </button>
      </Tooltip>

      <Modal open={open} onClose={() => setOpen(false)} title={`Movimentação de ${clientName}`}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              {type} · {formatDate(createdAt)}
            </p>
            <StatusBadge status={status} />
          </div>

          {loading && <p className="text-sm text-muted">Carregando itens...</p>}

          {!loading && items && items.length === 0 && (
            <p className="text-sm text-muted">Nenhum item nessa movimentação.</p>
          )}

          {!loading && items && items.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              {items.map((item) => {
                // Mesma situação de tipagem do supabase-js que já vimos na página
                // de detalhe: a relação vem como objeto único, mas o tipo inferido
                // não sabe disso — o cast documenta o formato real.
                const produto = item.products as unknown as { name: string; flavor: string | null } | null;
                return (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">
                      {produto?.name ?? "—"}
                      {produto?.flavor && <span className="text-muted"> ({produto.flavor})</span>}
                      <span className="text-muted"> × {item.amount}</span>
                    </span>
                    <span className="text-muted">{formatBRL(item.amount * item.unit_price)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="text-base font-semibold text-foreground">{formatBRL(priceTotal)}</span>
          </div>

          <Link
            href={`/movimentacoes/${movementId}`}
            onClick={() => setOpen(false)}
            className="text-center text-sm font-medium text-accent hover:underline"
          >
            Ver página completa →
          </Link>
        </div>
      </Modal>
    </>
  );
}
