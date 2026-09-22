import { createClient } from "@/lib/supabase/server";
import { NovaMovimentacaoForm } from "./nova-movimentacao-form";

export default async function NovaMovimentacaoPage() {
  const supabase = await createClient();

  // Busca, em paralelo, os clientes ativos e todos os produtos — os dois
  // conjuntos de dados que o formulário precisa pra montar os campos de busca
  const [{ data: clientes }, { data: produtos }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("is_active", true).order("name"),
    supabase.from("products").select("id, name, flavor, price").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova movimentação</h1>
        <p className="text-sm text-muted">Registre uma venda à vista ou a abertura de uma conta (fiado)</p>
      </div>
      <NovaMovimentacaoForm clientes={clientes ?? []} produtos={produtos ?? []} />
    </div>
  );
}
