// Este arquivo cria o "cliente" do Supabase que roda NO SERVIDOR do Next.js
// (usado em Server Components — arquivos SEM "use client" no topo).
// A diferença principal pro client.ts: aqui a sessão do usuário é lida dos
// cookies da requisição HTTP, não do navegador diretamente.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // cookies() nos dá acesso de leitura/escrita aos cookies dessa requisição específica
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // getAll: o Supabase usa isso pra saber qual sessão já está ativa
        getAll() {
          return cookieStore.getAll();
        },
        // setAll: o Supabase usa isso pra renovar o token de sessão quando necessário
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Isso pode ser chamado de um Server Component, que não tem permissão
            // de escrever cookies diretamente — tudo bem ignorar aqui, porque o
            // middleware.ts (que criamos a seguir) já cuida de renovar a sessão.
          }
        },
      },
    }
  );
}
