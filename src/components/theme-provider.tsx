"use client"; // precisa rodar no navegador, porque lida com localStorage e cliques

// next-themes é a biblioteca que gerencia qual tema está ativo, salva a escolha
// da pessoa (pra lembrar na próxima visita) e evita o "flash" de tema errado
// no primeiro carregamento da página.
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
