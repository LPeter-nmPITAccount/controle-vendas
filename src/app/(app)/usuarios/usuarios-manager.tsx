"use client";

import { useState } from "react";
import { Info, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

interface Perfil {
  id: string;
  name: string;
  type: "admin" | "user";
  is_active: boolean;
  is_superadmin: boolean;
}

interface UsuariosManagerProps {
  initialPerfis: Perfil[];
  currentUserId: string; // usado pra impedir a pessoa de mexer no próprio acesso
  currentUserIsSuperadmin: boolean; // só o superadmin pode trocar o "tipo" de alguém
}

export function UsuariosManager({
  initialPerfis,
  currentUserId,
  currentUserIsSuperadmin,
}: UsuariosManagerProps) {
  const supabase = createClient();
  const [perfis, setPerfis] = useState(initialPerfis);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function reload() {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, type, is_active, is_superadmin")
      .order("name");
    setPerfis((data as Perfil[]) ?? []);
  }

  async function handleToggleActive(perfil: Perfil) {
    setFeedback(null);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !perfil.is_active })
      .eq("id", perfil.id);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }
    setFeedback({ type: "success", message: perfil.is_active ? "Usuário desativado." : "Usuário reativado." });
    reload();
  }

  async function handleChangeType(perfil: Perfil, novoTipo: "admin" | "user") {
    setFeedback(null);
    // Mesmo com o <select> desabilitado pra quem não é superadmin, o banco
    // também recusa essa troca sozinho (é o trigger que realmente garante a
    // regra) — esse handler só roda quando o controle já está habilitado.
    const { error } = await supabase.from("profiles").update({ type: novoTipo }).eq("id", perfil.id);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }
    setFeedback({ type: "success", message: "Tipo de usuário atualizado." });
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted">Gerenciamento de usuários administradores e auxiliares</p>
      </div>

      {/* Aviso explicando por que não existe um botão "novo usuário" aqui */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>
          Novos logins são criados diretamente pelo painel do Supabase (Authentication → Users),
          por segurança — senhas nunca devem passar por este sistema. Depois de criado, o usuário
          aparece automaticamente aqui.
        </span>
      </div>

      {!currentUserIsSuperadmin && (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          <span>Somente o superadmin pode promover ou rebaixar usuários entre Admin e Usuário.</span>
        </div>
      )}

      {feedback && <FeedbackBanner type={feedback.type} message={feedback.message} />}

      <div className="rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {perfis.map((perfil) => {
              const isSelf = perfil.id === currentUserId; // é o próprio usuário logado?
              // O controle de tipo fica travado pra qualquer um que não seja o
              // superadmin, e também travado no próprio usuário (evita auto-promoção)
              const typeLocked = !currentUserIsSuperadmin || isSelf;

              return (
                <tr key={perfil.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="px-4 py-3 text-foreground">
                    {perfil.name}
                    {isSelf && <span className="ml-2 text-xs text-muted">(você)</span>}
                    {perfil.is_superadmin && (
                      <span
                        title="Superadmin: único com poder de promover/rebaixar outros usuários"
                        className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"
                      >
                        <ShieldCheck size={12} /> Superadmin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={perfil.type}
                      disabled={typeLocked}
                      onChange={(e) => handleChangeType(perfil, e.target.value as "admin" | "user")}
                      title={
                        !currentUserIsSuperadmin
                          ? "Somente o superadmin pode alterar o tipo de usuário"
                          : isSelf
                            ? "Você não pode alterar o próprio tipo"
                            : "Alterar entre Admin e Usuário"
                      }
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground
                                 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        perfil.is_active
                          ? "rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
                          : "rounded-full bg-muted/15 px-2.5 py-1 text-xs font-medium text-muted"
                      }
                    >
                      {perfil.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => handleToggleActive(perfil)}
                      title={isSelf ? "Você não pode alterar o próprio acesso" : perfil.is_active ? "Desativar acesso deste usuário" : "Reativar acesso deste usuário"}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground
                                 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {perfil.is_active ? "Desativar" : "Reativar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
