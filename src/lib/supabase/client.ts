// Este arquivo cria o "cliente" do Supabase que roda DENTRO do navegador da pessoa
// (usado em Client Components, ou seja, arquivos com "use client" no topo).
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // createBrowserClient já sabe ler/escrever os cookies de sessão sozinho no navegador,
  // então não precisamos passar nada além da URL e da chave pública (publishable key).
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // "!" diz ao TypeScript "eu garanto que isso existe"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
