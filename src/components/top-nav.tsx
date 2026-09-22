"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Store, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Cada item do menu: o texto mostrado, o caminho da página, e se ele deve
// aparecer só pra admin ou pra qualquer usuário logado.
const NAV_ITEMS = [
  { label: "Movimentações", href: "/", adminOnly: false },
  { label: "Clientes", href: "/clientes", adminOnly: false },
  { label: "Produtos", href: "/produtos", adminOnly: false },
  { label: "Usuários", href: "/usuarios", adminOnly: true },
];

interface TopNavProps {
  userName: string;
  userType: "admin" | "user";
}

export function TopNav({ userName, userType }: TopNavProps) {
  const pathname = usePathname(); // caminho atual, usado pra destacar o link ativo
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false); // menu "hambúrguer" no celular

  // Filtra os itens do menu: some com "Usuários" se a pessoa logada não for admin
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || userType === "admin");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut(); // encerra a sessão no Supabase Auth
    router.push("/login"); // manda a pessoa de volta pra tela de login
    router.refresh(); // força o Next.js a recarregar o estado de autenticação
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Marca do sistema, à esquerda */}
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Store size={20} className="text-accent" />
          <span className="hidden sm:inline">Controle de Vendas</span>
        </div>

        {/* Links de navegação — escondidos no celular, aparecem a partir do tablet (md) */}
        <nav className="hidden items-center gap-1 md:flex">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground" // link da página atual, destacado
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Lado direito: nome de quem está logado, tema e logout */}
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted lg:inline">{userName}</span>
          <ThemeToggle />
          <Tooltip label="Sair da conta" side="bottom">
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border
                         text-foreground transition-colors hover:bg-surface-hover"
            >
              <LogOut size={18} />
            </button>
          </Tooltip>
          {/* Botão hambúrguer, só aparece no celular */}
          <Tooltip label={mobileOpen ? "Fechar menu" : "Abrir menu"} side="bottom">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Abrir menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border
                         text-foreground md:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Versão do menu pra celular: some/aparece com o botão hambúrguer acima */}
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-2 md:hidden">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
