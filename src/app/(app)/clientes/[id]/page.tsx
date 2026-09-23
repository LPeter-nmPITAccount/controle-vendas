import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { DeleteMovementButton } from "@/components/delete-movement-button";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));

interface ClienteDetalhePageProps {
  // rota dinâmica: params também chega como Promise nessa versão do Next.js
  params: Promise<{ id: string }>;
}

export default async function ClienteDetalhePage({ params }: ClienteDetalhePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Busca o cliente e as movimentações dele em paralelo — são duas consultas
  // independentes, então não faz sentido esperar uma pra só depois pedir a outra
  const [{ data: cliente }, { data: movimentacoes }] = await Promise.all([
    supabase.from("clients").select("id, name, matricula, is_active").eq("id", id).single(),
    supabase
      .from("movements")
      .select("id, type, status, price_total, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!cliente) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/clientes" className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={16} /> Voltar para Clientes
        </Link>
        <p className="text-muted">Cliente não encontrado.</p>
      </div>
    );
  }

  // Soma tudo que ainda não foi repassado (status "Para Anotar") — é o número
  // que mais importa aqui: "quanto ainda falta eu passar pra frente?"
  const totalParaAnotar = (movimentacoes ?? [])
    .filter((m) => m.status === "Para Anotar")
    .reduce((sum, m) => sum + m.price_total, 0);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/clientes" className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Voltar para Clientes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{cliente.name}</h1>
          <p className="text-sm text-muted">
            {cliente.matricula ? `Matrícula: ${cliente.matricula}` : "Sem matrícula cadastrada"}
            {!cliente.is_active && " · Cliente inativo"}
          </p>
        </div>
        {totalParaAnotar > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-right">
            <p className="text-xs text-muted">Total ainda para anotar</p>
            <p className="text-lg font-semibold text-warning">{formatBRL(totalParaAnotar)}</p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium text-right">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {(!movimentacoes || movimentacoes.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Esse cliente ainda não tem movimentações.
                </td>
              </tr>
            )}
            {movimentacoes?.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                <td className="px-4 py-3 text-muted">{m.type}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{formatBRL(m.price_total)}</td>
                <td className="px-4 py-3 text-muted">{formatDate(m.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
