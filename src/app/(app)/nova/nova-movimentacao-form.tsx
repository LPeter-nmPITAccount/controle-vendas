"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Tooltip } from "@/components/ui/tooltip";

interface Cliente {
  id: string;
  name: string;
}

interface Produto {
  id: string;
  name: string;
  flavor: string | null;
  price: number;
}

// Formato de UMA linha de item no formulário. localId existe só pro React
// conseguir identificar cada linha na tela (não tem nenhuma relação com o banco).
interface ItemForm {
  localId: string;
  productId: string | null;
  amount: string; // fica como texto enquanto a pessoa digita, vira número só no envio
  unitPrice: string;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Gera um id só pra usar como "key" das linhas — não precisa ser um UUID de
// verdade, só precisa ser único aqui na tela
const newLocalId = () => Math.random().toString(36).slice(2);

function emptyItem(): ItemForm {
  return { localId: newLocalId(), productId: null, amount: "1", unitPrice: "" };
}

interface NovaMovimentacaoFormProps {
  clientes: Cliente[];
  produtos: Produto[];
}

export function NovaMovimentacaoForm({ clientes, produtos }: NovaMovimentacaoFormProps) {
  const supabase = createClient();
  const router = useRouter();

  // "existing" = escolher um cliente já cadastrado; "new" = digitar o nome de um cliente novo
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState("");

  const [type, setType] = useState<"Normal" | "Conta">("Normal");

  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const clienteOptions: SearchableOption[] = clientes.map((c) => ({ id: c.id, label: c.name }));
  const produtoOptions: SearchableOption[] = produtos.map((p) => ({
    id: p.id,
    label: p.flavor ? `${p.name} (${p.flavor})` : p.name,
  }));

  // Total calculado NA TELA, só pra dar uma prévia — o valor que realmente vale
  // é o price_total que o banco calcula sozinho depois (via trigger), então uma
  // pequena diferença de arredondamento aqui não é um problema real.
  const total = items.reduce((sum, item) => {
    const amount = Number(item.amount) || 0;
    const unitPrice = Number(item.unitPrice.replace(",", ".")) || 0;
    return sum + amount * unitPrice;
  }, 0);

  function updateItem(localId: string, patch: Partial<ItemForm>) {
    setItems((current) => current.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));
  }

  // Quando a pessoa escolhe um produto na linha, já preenche o preço unitário
  // sozinho (com o preço cadastrado) — ela ainda pode editar depois, se o preço
  // praticado naquela venda for diferente do preço "de tabela"
  function handleSelectProduct(localId: string, productId: string) {
    const produto = produtos.find((p) => p.id === productId);
    updateItem(localId, {
      productId,
      unitPrice: produto ? String(produto.price) : "",
    });
  }

  function addItem() {
    setItems((current) => [...current, emptyItem()]);
  }

  function removeItem(localId: string) {
    // nunca deixa a lista ficar vazia — sempre sobra pelo menos 1 linha
    setItems((current) => (current.length > 1 ? current.filter((item) => item.localId !== localId) : current));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    // Validações do lado do front-end, ANTES de gastar uma chamada ao banco —
    // a mesma validação também existe dentro da function (defesa em profundidade),
    // mas aqui damos um feedback mais rápido e específico pra pessoa.
    if (clientMode === "existing" && !selectedClientId) {
      setFeedback({ type: "error", message: "Selecione um cliente." });
      return;
    }
    if (clientMode === "new" && !newClientName.trim()) {
      setFeedback({ type: "error", message: "Informe o nome do cliente novo." });
      return;
    }
    const itemsValidos = items.filter((item) => item.productId && Number(item.amount) > 0);
    if (itemsValidos.length === 0) {
      setFeedback({ type: "error", message: "Adicione ao menos um item com produto e quantidade válidos." });
      return;
    }

    setSaving(true);

    // Monta o array de itens no formato exato que a function create_movement espera
    const payloadItems = itemsValidos.map((item) => ({
      product_id: item.productId,
      amount: Number(item.amount),
      unit_price: Number(item.unitPrice.replace(",", ".")) || 0,
    }));

    const { error } = await supabase.rpc("create_movement", {
      p_client_id: clientMode === "existing" ? selectedClientId : null,
      p_client_name: clientMode === "new" ? newClientName.trim() : null,
      p_type: type,
      p_items: payloadItems,
    });

    setSaving(false);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }

    // Sucesso: volta pra lista de movimentações, já avisando que deu certo
    // (o "?created=1" é lido pela página de destino pra mostrar o banner)
    router.push("/?created=1");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {feedback && <FeedbackBanner type={feedback.type} message={feedback.message} />}

      {/* Bloco: quem é o cliente */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Cliente</h2>

        <div className="mb-3 flex gap-4 text-sm">
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="radio"
              checked={clientMode === "existing"}
              onChange={() => setClientMode("existing")}
              className="accent-accent"
            />
            Cliente já cadastrado
          </label>
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="radio"
              checked={clientMode === "new"}
              onChange={() => setClientMode("new")}
              className="accent-accent"
            />
            Cliente novo
          </label>
        </div>

        {clientMode === "existing" ? (
          <SearchableSelect
            options={clienteOptions}
            value={selectedClientId}
            onChange={setSelectedClientId}
            placeholder="Buscar cliente pelo nome..."
          />
        ) : (
          <Input
            placeholder="Nome do novo cliente"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
          />
        )}
      </div>

      {/* Bloco: tipo da movimentação */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <label className="text-sm font-medium text-foreground">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "Normal" | "Conta")}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="Normal">Normal (compra avulsa)</option>
            <option value="Conta">Conta (fiado)</option>
          </select>
        </div>
      </div>

      {/* Bloco: itens da venda */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Itens</h2>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus size={14} /> Adicionar item
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.localId} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
              <div className="w-full sm:flex-1">
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

        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <span className="text-sm text-muted">
            Total: <span className="text-base font-semibold text-foreground">{formatBRL(total)}</span>
          </span>
        </div>
      </div>

      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "Registrando..." : "Registrar movimentação"}
      </Button>
    </form>
  );
}
