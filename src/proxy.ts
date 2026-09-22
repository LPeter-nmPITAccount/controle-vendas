// O middleware roda ANTES de qualquer página, em toda requisição que bate no servidor.
// Ele tem duas responsabilidades aqui:
// 1) Renovar a sessão do Supabase sozinho, nos bastidores, quando o token estiver
//    perto de expirar (sem isso, a pessoa seria "deslogada" sem motivo aparente);
// 2) Gerar um "nonce" novo a cada requisição, usado no Content-Security-Policy
//    (veja next.config.ts) pra permitir SÓ os scripts que o próprio Next.js
//    gerou nesta requisição — qualquer script injetado por um invasor (que não
//    conhece esse número aleatório) é bloqueado pelo navegador.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Endereço do seu projeto Supabase — precisa estar liberado no CSP pra o
// front-end conseguir "conversar" com o banco (fetch/websocket)
const SUPABASE_URL = "https://iwxxstxfpzwkkcdxvfqr.supabase.co";

// Só é 'true' quando você roda "npm run dev" — no build de produção
// (o que sobe pro ar de verdade), isso é sempre 'false'.
const isDev = process.env.NODE_ENV === "development";

function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    // 'strict-dynamic' + nonce é a combinação recomendada oficialmente pelo
    // Next.js: só executa script que tenha o nonce certo (ou que tenha sido
    // carregado por um script que já tinha o nonce certo).
    // 'unsafe-eval' só entra em desenvolvimento: o React usa eval() internamente
    // pra recursos de debug (Fast Refresh, pilha de erros) nesse modo — em
    // produção o React nunca usa eval(), então não precisamos liberar isso lá,
    // e é melhor mesmo não liberar (eval é uma porta perigosa se não for necessária).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'", // necessário pro CSS que o Next.js/Tailwind injeta
    "img-src 'self' data:",
    `connect-src 'self' ${SUPABASE_URL}`,
    "frame-ancestors 'none'", // bloqueia o site de ser carregado num <iframe> de fora
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  // crypto.randomUUID() gera um valor imprevisível — convertido pra base64 só
  // pra ficar num formato compacto, comum em nonces de CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  // Repassa o nonce como cabeçalho da PRÓPRIA requisição, pra o Next.js conseguir
  // ler esse valor mais adiante (no layout raiz) e carimbar ele nos scripts que gera
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  // Começa assumindo que vai deixar a requisição passar normalmente, já com os
  // cabeçalhos acima disponíveis pro resto da aplicação
  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
  supabaseResponse.headers.set("Content-Security-Policy", csp);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Atualiza os cookies tanto na requisição atual quanto na resposta,
          // pra garantir que a sessão renovada realmente "pegue" no navegador
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          supabaseResponse.headers.set("Content-Security-Policy", csp);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Só de chamar getUser(), o Supabase já verifica e renova o token se precisar
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  // Roda em toda rota, EXCETO arquivos estáticos (imagens, favicon, etc.) —
  // não faz sentido gastar tempo renovando sessão pra pedir uma imagem.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
