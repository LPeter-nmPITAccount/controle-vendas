"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

interface Produto {
  id: string;
  name: string;
  flavor: string | null;
  price: number;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function ProdutosManager({ initialProdutos }: { initialProdutos: Produto[] }) {
  const supabase = createClient();

  const [produtos, setProdutos] = useState(initialProdutos);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [formName, setFormName] = useState("");
  const [formFlavor, setFormFlavor] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function reload(term: string) {
    let query = supabase.from("products").select("id, name, flavor, price").order("name");
    if (term) {
      query = query.ilike("name", `%${term}%`);
    }
    const { data } = await query;
    setProdutos(data ?? []);
  }

  function openCreateModal() {
    setEditing(null);
    setFormName("");
    setFormFlavor("");
    setFormPrice("");
    setModalOpen(true);
  }

  function openEditModal(produto: Produto) {
    setEditing(produto);
    setFormName(produto.name);
    setFormFlavor(produto.flavor ?? "");
    setFormPrice(String(produto.price));
    setModalOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    const payload = {
      name: formName,
      flavor: formFlavor || null,
      price: Number(formPrice.replace(",", ".")), // aceita tanto "5,50" quanto "5.50"
    };

    if (Number.isNaN(payload.price) || payload.price <= 0) {
      setFeedback({ type: "error", message: "Informe um preço válido, maior que zero." });
      setSaving(false);
      return;
    }

    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }

    setModalOpen(false);
    setFeedback({ type: "success", message: editing ? "Produto atualizado." : "Produto cadastrado." });
    reload(search);
  }

  async function handleDelete(produto: Produto) {
    setFeedback(null);
    const { error } = await supabase.from("products").delete().eq("id", produto.id);

    if (error) {
      // Código 23503 = violação de chave estrangeira: esse produto já foi
      // vendido em alguma movimentação, então o banco recusa apagar de verdade
      // (senão o histórico de vendas antigo ficaria com um "buraco").
      const message = error.code === "23503"
        ? "Esse produto já foi usado em vendas e não pode ser removido."
        : error.message;
      setFeedback({ type: "error", message });
      return;
    }

    setFeedback({ type: "success", message: "Produto removido." });
    reload(search);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted">Catálogo de produtos disponíveis para venda</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} /> Novo produto
        </Button>
      </div>

      {feedback && <FeedbackBanner type={feedback.type} message={feedback.message} />}

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Buscar produto..."
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reload(e.target.value);
          }}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Sabor</th>
              <th className="px-4 py-3 font-medium">Preço</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            )}
            {produtos.map((produto) => (
              <tr key={produto.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                <td className="px-4 py-3 text-foreground">{produto.name}</td>
                <td className="px-4 py-3 text-muted">{produto.flavor ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-foreground">{formatBRL(produto.price)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Tooltip label="Editar produto">
                      <button
                        type="button"
                        onClick={() => openEditModal(produto)}
                        aria-label="Editar"
                        className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
                      >
                        <Pencil size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip label="Remover produto">
                      <button
                        type="button"
                        onClick={() => handleDelete(produto)}
                        aria-label="Remover"
                        className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar produto" : "Novo produto"}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Nome
            </label>
            <Input id="name" required value={formName} onChange={(e) => setFormName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="flavor" className="text-sm font-medium text-foreground">
              Sabor (opcional)
            </label>
            <Input id="flavor" value={formFlavor} onChange={(e) => setFormFlavor(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="price" className="text-sm font-medium text-foreground">
              Preço
            </label>
            <Input
              id="price"
              inputMode="decimal"
              placeholder="0,00"
              required
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving} className="mt-2">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
