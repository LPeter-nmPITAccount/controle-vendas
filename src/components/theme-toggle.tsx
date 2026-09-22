"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Truque necessário com next-themes: no servidor, ele ainda não sabe qual tema
  // está ativo (isso só existe no navegador, via localStorage). Então esperamos
  // o componente "montar" no navegador antes de mostrar o ícone certo, evitando
  // um piscar de ícone errado logo que a página abre.
  const [mounted, setMounted] = useState(false);
  // Padrão oficial do next-themes pra evitar hydration mismatch (o servidor não
  // sabe qual tema está salvo no navegador); o "render extra" abaixo é intencional.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    // Espaço reservado do mesmo tamanho do botão, pra não "pular" o layout
    return <div className="h-9 w-9" />;
  }

  const isDark = theme === "dark";

  return (
    <Tooltip label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"} side="bottom">
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border
                   bg-surface text-foreground transition-colors hover:bg-surface-hover
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {/* Mostra o ícone do que a pessoa VAI ativar ao clicar, não do que está ativo agora
            (é a convenção mais comum: o sol aparece quando está escuro, prometendo "luz") */}
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </Tooltip>
  );
}
