import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { DeleteMovementButton } from "@/components/delete-movement-button";
import { MovementQuickView } from "@/components/movement-quick-view";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { buttonVariants } from "@/components/ui/button";

// Formata número pra Real brasileiro (R$ 1.234,56), sem precisar de biblioteca externa
const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Formata data ISO pro padrão brasileiro (dd/mm/aaaa). O timeZone é dito
// EXPLICITAMENTE aqui porque essa formatação roda no servidor (Server Component),
// e servidores normalmente rodam em UTC — sem isso, a data/hora aparece errada
// pra quem está no Brasil (UTC é 3h à frente do horário de Brasília).
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));

interface MovimentacoesPageProps {
  // No Next.js atual, searchParams chega como uma Promise (precisa de "await")
  searchParams: Promise<{ created?: string }>;
}

export default async function MovimentacoesPage({ searchParams }: MovimentacoesPageProps) {
  const { created } = await searchParams;
  const supabase = await createClient();

  // select com join: o supabase-js entende a relação de chave estrangeira e
  // já traz o nome do cliente (clients(name)) numa consulta só, sem N+1 queries
  const { data: movements, error } = await supabase
    .from("movements")
    .select("id, type, status, price_total, created_at, clients(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movimentações</h1>
          <p className="text-sm text-muted">Últimas vendas e contas em aberto</p>
        </div>
        {/* buttonVariants() gera a MESMA classe CSS que o <Button>, mas aqui aplicada
            direto num <Link> — assim ele parece um botão mas continua sendo,
            de verdade, um link de navegação (importante pra acessibilidade) */}
        <Link href="/nova" className={buttonVariants({ variant: "primary" })}>
          <Plus size={16} /> Nova movimentação
        </Link>
      </div>

      {/* "created=1" na URL é o sinal que a página de Nova Movimentação manda
          depois de um cadastro bem-sucedido — só um jeito simples de mostrar
          uma mensagem de sucesso depois de um redirect, sem precisar de estado
          global nem de bibliotecas extras */}
      {created && <FeedbackBanner type="success" message="Movimentação registrada com sucesso." />}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium text-right">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {/* Estado vazio: em vez de mostrar uma tabela em branco sem explicação,
                dizemos claramente o que fazer a seguir */}
            {(!movements || movements.length === 0) && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Nenhuma movimentação registrada ainda.
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-danger">
                  Não foi possível carregar as movimentações. Tente novamente.
                </td>
              </tr>
            )}

            {movements?.map((m) => {
              // Mesmo cast explícito usado na página de detalhe: o supabase-js
              // tipa essa relação como lista, mas ela sempre vem como 1 objeto só.
              const cliente = m.clients as unknown as { name: string } | null;
              return (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="px-4 py-3 text-foreground">{cliente?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{m.type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatBRL(m.price_total)}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(m.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <MovementQuickView
                        movementId={m.id}
                        clientName={cliente?.name ?? "—"}
                        type={m.type}
                        status={m.status}
                        priceTotal={m.price_total}
                        createdAt={m.created_at}
                      />
                      <Tooltip label="Ver detalhes da movimentação">
                        <Link
                          href={`/movimentacoes/${m.id}`}
                          aria-label="Ver detalhes"
                          className="inline-flex rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
                        >
                          <Eye size={16} />
                        </Link>
                      </Tooltip>
                      <DeleteMovementButton movementId={m.id} />
                    </div>
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
