"use client"; // formulário interativo: precisa rodar no navegador

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

// Formata um horário (ex: "14:35") pra mostrar até quando o login fica bloqueado
const formatTime = (iso: string) => new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(iso));

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // impede o navegador de recarregar a página ao enviar o form
    setLoading(true);
    setErrorMessage(null);

    const supabase = createClient();

    // 1) ANTES de tentar autenticar de verdade, confere se esse e-mail já está
    // bloqueado por excesso de tentativas erradas recentes
    const { data: lockData } = await supabase.rpc("check_login_lockout", { p_email: email });
    const lockInfo = lockData?.[0];

    if (lockInfo?.locked) {
      setErrorMessage(`Muitas tentativas erradas. Tente novamente às ${formatTime(lockInfo.locked_until)}.`);
      setLoading(false);
      return;
    }

    // Chama o Supabase Auth: valida e-mail + senha e, se estiver certo,
    // já salva a sessão sozinho nos cookies do navegador
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // 2) Login falhou: registra mais uma tentativa errada pra esse e-mail.
      // A função devolve se isso foi o suficiente pra bloquear agora mesmo.
      const { data: attemptData } = await supabase.rpc("register_failed_login", { p_email: email });
      const attemptInfo = attemptData?.[0];

      if (attemptInfo?.locked) {
        setErrorMessage(
          `Muitas tentativas erradas. Login bloqueado até ${formatTime(attemptInfo.locked_until)}.`
        );
      } else {
        // Mensagem genérica de propósito: nunca dizer "senha errada" vs "e-mail não existe"
        // separadamente, porque isso ajuda alguém mal-intencionado a descobrir e-mails válidos
        setErrorMessage("E-mail ou senha incorretos.");
      }
      setLoading(false);
      return;
    }

    // 3) Login deu certo: zera o contador de tentativas erradas desse e-mail
    await supabase.rpc("register_successful_login", { p_email: email });

    router.push("/"); // login deu certo: manda pra tela de Movimentações
    router.refresh(); // atualiza o estado de autenticação do lado do servidor
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Botão de tema disponível mesmo antes de logar, no canto superior direito */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Store size={28} className="text-accent" />
          <h1 className="text-xl font-bold text-foreground">Controle de Vendas</h1>
          <p className="text-sm text-muted">Entre com sua conta pra continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {/* Só mostra a mensagem de erro se realmente existir uma */}
          {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
