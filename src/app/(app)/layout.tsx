// Este layout é um Server Component (roda no servidor, antes de mandar HTML pro
// navegador). Ele protege TODAS as páginas dentro da pasta (app) — o nome entre
// parênteses é um "route group" do Next.js: organiza rotas sem virar parte da URL.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/top-nav";
import { CalculatorWidget } from "@/components/calculator-widget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // getUser() confere a sessão direto com o servidor do Supabase (mais seguro
  // que só ler o cookie, que poderia ter sido falsificado)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem usuário logado? Manda pra tela de login antes de renderizar qualquer coisa.
  if (!user) {
    redirect("/login");
  }

  // Busca a "ficha" (profile) do usuário logado, pra saber o nome e se é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, type")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        userName={profile?.name ?? user.email ?? "Usuário"}
        userType={(profile?.type as "admin" | "user") ?? "user"}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
