import { createClient } from "@/lib/supabase/server";
import { ProdutosManager } from "./produtos-manager";

export default async function ProdutosPage() {
  const supabase = await createClient();

  const { data: produtos } = await supabase
    .from("products")
    .select("id, name, flavor, price")
    .order("name");

  return <ProdutosManager initialProdutos={produtos ?? []} />;
}
