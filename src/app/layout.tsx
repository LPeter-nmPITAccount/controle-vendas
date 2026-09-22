import type { Metadata } from "next";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Observação: a ideia original era usar a fonte Manrope via next/font/google,
// mas o ambiente onde este projeto foi montado não tem acesso à internet do
// Google Fonts (trava de segurança da sandbox). Por isso usamos a pilha de
// fontes do próprio sistema operacional (globals.css) — carrega instantâneo,
// sem pedido de rede nenhum. Se quiser trocar por Manrope no seu ambiente real,
// é só reinstalar o import acima; no seu computador o Google Fonts é alcançável.

export const metadata: Metadata = {
  title: "Controle de Vendas",
  description: "Sistema de controle de vendas e fiado",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Lê o nonce que o middleware (src/proxy.ts) gerou pra ESSA requisição —
  // é o mesmo valor que já foi usado no cabeçalho Content-Security-Policy.
  // Repassando ele pro ThemeProvider, o script que a next-themes injeta (pra
  // evitar o "flash" de tema errado) fica marcado como confiável pelo CSP.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // suppressHydrationWarning é necessário aqui porque o next-themes ajusta a
    // classe do <html> (dark/light) assim que a página carrega no navegador,
    // e isso é esperado — não é um erro de verdade.
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"       // controla o tema trocando a CLASSE do <html> (dark/light)
          defaultTheme="dark"     // tema escuro é o padrão, como você pediu
          enableSystem={false}    // não segue automaticamente o tema do sistema operacional
          nonce={nonce}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
