"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";

interface Produto {
  id: string;
  name: string;
  flavor: string | null;
  price: number;
}

// Uma linha de item no formulário de edição — mesmo formato usado na Nova Movimentação
interface ItemForm {
  localId: string;
  productId: string | null;
  amount: string;
  unitPrice: string;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const newLocalId = () => Math.random().toString(36).slice(2);

interface EditItemsButtonProps {
  movementId: string;
  produtos: Produto[];
  // Itens já salvos, no formato que veio do banco — usados pra "pré-popular"
  // o formulário quando o modal abre
  initialItems: { productId: string; amount: number; unitPrice: number }[];
  // Só permitimos editar enquanto a movimentação ainda não foi repassada
  // (a mesma regra que já existe no banco, dentro de update_movement_products)
  disabled: boolean;
}

export function EditItemsButton({ movementId, produtos, initialItems, disabled }: EditItemsButtonProps) {
  const supabase = createClient();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<ItemForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const produtoOptions: SearchableOption[] = produtos.map((p) => ({
    id: p.id,
    label: p.flavor ? `${p.name} (${p.flavor})` : p.name,
  }));

  function openModal() {
    // Toda vez que abre, recomeça a partir dos itens que estão salvos AGORA
    // (evita mostrar uma edição antiga se a pessoa abrir o modal de novo depois)
    setItems(
      initialItems.map((item) => ({
        localId: newLocalId(),
        productId: item.productId,
        amount: String(item.amount),
        unitPrice: String(item.unitPrice),
      }))
    );
    setFeedback(null);
    setModalOpen(true);
  }

  function updateItem(localId: string, patch: Partial<ItemForm>) {
    setItems((current) => current.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));
  }

  function handleSelectProduct(localId: string, productId: string) {
    const produto = produtos.find((p) => p.id === productId);
    updateItem(localId, { productId, unitPrice: produto ? String(produto.price) : "" });
  }

  function addItem() {
    setItems((current) => [...current, { localId: newLocalId(), productId: null, amount: "1", unitPrice: "" }]);
  }

  function removeItem(localId: string) {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.localId !== localId) : current));
  }

  const total = items.reduce((sum, item) => {
    const amount = Number(item.amount) || 0;
    const unitPrice = Number(item.unitPrice.replace(",", ".")) || 0;
    return sum + amount * unitPrice;
  }, 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const itemsValidos = items.filter((item) => item.productId && Number(item.amount) > 0);
    if (itemsValidos.length === 0) {
      setFeedback({ type: "error", message: "Adicione ao menos um item com produto e quantidade válidos." });
      return;
    }

    setSaving(true);

    const payloadItems = itemsValidos.map((item) => ({
      product_id: item.productId,
      amount: Number(item.amount),
      unit_price: Number(item.unitPrice.replace(",", ".")) || 0,
    }));

    // update_movement_products SUBSTITUI a lista de itens inteira — não é um
    // "adicionar mais um item", é "esses aqui são os itens corretos agora".
    // O próprio banco recusa essa chamada se a movimentação já estiver "Anotado"
    // (já vimos isso lá na function, checando status <> 'Anotado').
    const { error } = await supabase.rpc("update_movement_products", {
      p_movement_id: movementId,
      p_items: payloadItems,
    });

    setSaving(false);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }

    setModalOpen(false);
    // Recarrega a página (tabela de itens, total, etc.) com o que já foi salvo
    router.refresh();
  }

  return (
    <>
      <Tooltip label={disabled ? "Já foi anotado, não dá mais pra editar os itens" : "Editar itens"}>
        <button
          type="button"
          onClick={openModal}
          disabled={disabled}
          aria-label="Editar itens"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium
                     text-foreground hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pencil size={14} /> Editar itens
        </button>
      </Tooltip>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar itens da movimentação">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {feedback && <FeedbackBanner type={feedback.type} message={feedback.message} />}

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Itens</p>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus size={14} /> Adicionar item
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.localId} className="flex flex-wrap items-end gap-2">
                <div className="w-full">
                  <label className="mb-1 block text-xs text-muted">Produto</label>
                  <SearchableSelect
                    options={produtoOptions}
                    value={item.productId}
                    onChange={(id) => handleSelectProduct(item.localId, id)}
                    placeholder="Buscar produto..."
                  />
                </div>
                <div className="w-20">
                  <label className="mb-1 block text-xs text-muted">Qtd.</label>
                  <Input
                    type="number"
                    min={1}
                    value={item.amount}
                    onChange={(e) => updateItem(item.localId, { amount: e.target.value })}
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs text-muted">Preço un.</label>
                  <Input
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.localId, { unitPrice: e.target.value })}
                  />
                </div>
                <Tooltip label={items.length === 1 ? "É preciso ao menos 1 item" : "Remover item"}>
                  <button
                    type="button"
                    onClick={() => removeItem(item.localId)}
                    disabled={items.length === 1}
                    aria-label="Remover item"
                    className="mb-0.5 rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </Tooltip>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-border pt-3">
            <span className="text-sm text-muted">
              Total: <span className="text-base font-semibold text-foreground">{formatBRL(total)}</span>
            </span>
          </div>

          <Button type="submit" disabled={saving} className="mt-2">
            {saving ? "Salvando..." : "Salvar itens"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
