"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, UserCheck, UserX } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

// Formato de um cliente, do jeito que vem da tabela "clients"
interface Cliente {
  id: string;
  name: string;
  matricula: string | null;
  is_active: boolean;
}

// initialClientes vem do Server Component (page.tsx), pra tela já nascer com
// dado na tela sem esperar uma segunda consulta — depois disso, este componente
// assume o controle e recarrega sozinho a cada ação (criar/editar/desativar).
export function ClientesManager({ initialClientes }: { initialClientes: Cliente[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [clientes, setClientes] = useState(initialClientes);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null); // null = criando um cliente novo
  const [formName, setFormName] = useState("");
  const [formMatricula, setFormMatricula] = useState("");
  const [saving, setSaving] = useState(false);

  // feedback: mensagem de sucesso/erro mostrada no topo da tela, some sozinha
  // quando uma nova ação começa
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Busca a lista de clientes de novo no banco, já aplicando o filtro de texto
  // e o filtro de "mostrar inativos" que estiverem ativos no momento da chamada
  async function reload(term: string, includeInactive: boolean) {
    let query = supabase
      .from("clients")
      .select("id, name, matricula, is_active")
      .order("name");

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }
    if (term) {
      // ilike: busca "contém", sem diferenciar maiúscula/minúscula.
      // O "or" deixa buscar tanto pelo nome quanto pela matrícula com o mesmo termo.
      query = query.or(`name.ilike.%${term}%,matricula.ilike.%${term}%`);
    }

    const { data } = await query;
    setClientes(data ?? []);
  }

  function openCreateModal() {
    setEditing(null);
    setFormName("");
    setFormMatricula("");
    setModalOpen(true);
  }

  function openEditModal(cliente: Cliente) {
    setEditing(cliente);
    setFormName(cliente.name);
    setFormMatricula(cliente.matricula ?? "");
    setModalOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    // matricula é opcional: se a pessoa deixou vazio, salvamos null em vez de ""
    const payload = { name: formName, matricula: formMatricula || null };

    const { error } = editing
      ? await supabase.from("clients").update(payload).eq("id", editing.id)
      : await supabase.from("clients").insert(payload);

    setSaving(false);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }

    setModalOpen(false);
    setFeedback({ type: "success", message: editing ? "Cliente atualizado." : "Cliente cadastrado." });
    reload(search, showInactive);
  }

  // Ativa ou desativa um cliente. Se ele tiver conta em aberto, o TRIGGER que
  // criamos no banco bloqueia a operação e devolve uma mensagem de erro — que a
  // gente simplesmente repassa pra tela, porque ela já vem pronta e amigável.
  async function handleToggleActive(cliente: Cliente) {
    setFeedback(null);
    const { error } = await supabase
      .from("clients")
      .update({ is_active: !cliente.is_active })
      .eq("id", cliente.id);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }

    setFeedback({
      type: "success",
      message: cliente.is_active ? "Cliente desativado." : "Cliente reativado.",
    });
    reload(search, showInactive);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted">Cadastro de clientes e controle de contas</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} /> Novo cliente
        </Button>
      </div>

      {feedback && <FeedbackBanner type={feedback.type} message={feedback.message} />}

      {/* Barra de busca + filtro de inativos */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Buscar por nome ou matrícula..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              reload(e.target.value, showInactive);
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => {
              setShowInactive(e.target.checked);
              reload(search, e.target.checked);
            }}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Mostrar inativos
        </label>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Matrícula</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {clientes.map((cliente) => (
              <tr
                key={cliente.id}
                // A linha inteira vira clicável, como um botão — role="button" +
                // tabIndex avisam leitores de tela / navegação por teclado que
                // isso é interativo, e o onKeyDown trata Enter/Espaço (do jeito
                // que um <button> nativo já faria sozinho)
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/clientes/${cliente.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/clientes/${cliente.id}`);
                  }
                }}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-hover"
              >
                <td className="px-4 py-3 text-foreground">{cliente.name}</td>
                <td className="px-4 py-3 text-muted">{cliente.matricula ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      cliente.is_active
                        ? "rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
                        : "rounded-full bg-muted/15 px-2.5 py-1 text-xs font-medium text-muted"
                    }
                  >
                    {cliente.is_active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                {/* onClick + stopPropagation: impede que um clique AQUI DENTRO
                    "vaze" pro onClick da linha inteira (que navegaria pro cliente) */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Tooltip label="Editar cliente">
                      <button
                        type="button"
                        onClick={() => openEditModal(cliente)}
                        aria-label="Editar"
                        className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
                      >
                        <Pencil size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip label={cliente.is_active ? "Desativar cliente" : "Reativar cliente"}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(cliente)}
                        aria-label={cliente.is_active ? "Desativar" : "Reativar"}
                        className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
                      >
                        {cliente.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar cliente" : "Novo cliente"}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Nome
            </label>
            <Input id="name" required value={formName} onChange={(e) => setFormName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="matricula" className="text-sm font-medium text-foreground">
              Matrícula (opcional)
            </label>
            <Input id="matricula" value={formMatricula} onChange={(e) => setFormMatricula(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving} className="mt-2">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
