import { createClient } from "@/lib/supabase/server";
import { ClientesManager } from "./clientes-manager";

export default async function ClientesPage() {
  const supabase = await createClient();

  // Busca inicial: só clientes ativos, ordenados por nome — o resto (busca,
  // mostrar inativos) acontece depois, direto no navegador, via ClientesManager
  const { data: clientes } = await supabase
    .from("clients")
    .select("id, name, matricula, is_active")
    .eq("is_active", true)
    .order("name");

  return <ClientesManager initialClientes={clientes ?? []} />;
}
