import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { StatusEditor } from "./status-editor";
import { EditItemsButton } from "./edit-items-button";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatDateTime = (iso: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

interface MovimentacaoDetalhePageProps {
  params: Promise<{ id: string }>;
}

export default async function MovimentacaoDetalhePage({ params }: MovimentacaoDetalhePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: movimentacao }, { data: itens }, { data: produtos }] = await Promise.all([
    supabase
      .from("movements")
      .select("id, type, status, price_total, description, created_at, date_anotado, client_id, clients(name)")
      .eq("id", id)
      .single(),
    supabase
      .from("movement_products")
      .select("id, product_id, amount, unit_price, products(name, flavor)")
      .eq("movement_id", id),
    // Lista completa de produtos, usada pelo formulário de edição de itens
    supabase.from("products").select("id, name, flavor, price").order("name"),
  ]);

  if (!movimentacao) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={16} /> Voltar para Movimentações
        </Link>
        <p className="text-muted">Movimentação não encontrada.</p>
      </div>
    );
  }

  // @ts-expect-error -- o supabase-js tipa a relação como array, mas com FK única vem sempre 1 objeto
  const clienteNome: string = movimentacao.clients?.name ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/clientes/${movimentacao.client_id}`}
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Voltar para {clienteNome}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movimentação de {clienteNome}</h1>
          <p className="text-sm text-muted">
            {movimentacao.type} · registrada em {formatDateTime(movimentacao.created_at)}
            {movimentacao.date_anotado && <> · anotado em {formatDateTime(movimentacao.date_anotado)}</>}
          </p>
          {movimentacao.description && <p className="mt-1 text-sm text-muted">{movimentacao.description}</p>}
        </div>
        <StatusBadge status={movimentacao.status} />
      </div>

      {/* Editor de status: isolado num Client Component, o resto da página
          continua renderizada no servidor */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-2 text-sm font-medium text-foreground">Alterar status</p>
        <StatusEditor movementId={movimentacao.id} currentStatus={movimentacao.status} />
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">Itens</p>
          <EditItemsButton
            movementId={movimentacao.id}
            produtos={produtos ?? []}
            initialItems={(itens ?? []).map((item) => ({
              productId: item.product_id,
              amount: item.amount,
              unitPrice: item.unit_price,
            }))}
            disabled={movimentacao.status === "Anotado"}
          />
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Quantidade</th>
              <th className="px-4 py-3 font-medium">Preço unitário</th>
              <th className="px-4 py-3 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens?.map((item) => {
              // O supabase-js tipa essa relação como array (mesmo sendo 1 produto por item),
              // então pegamos sempre a primeira posição
              const produto = item.products as unknown as { name: string; flavor: string | null } | null;
              return (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">
                    {produto?.name ?? "—"}
                    {produto?.flavor && <span className="text-muted"> ({produto.flavor})</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{item.amount}</td>
                  <td className="px-4 py-3 text-muted">{formatBRL(item.unit_price)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatBRL(item.amount * item.unit_price)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-muted">
                Total
              </td>
              <td className="px-4 py-3 text-base font-semibold text-foreground">
                {formatBRL(movimentacao.price_total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
