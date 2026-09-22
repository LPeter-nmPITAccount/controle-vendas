import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackBannerProps {
  type: "success" | "error";
  message: string;
}

// Banner simples pra mostrar o resultado de uma ação (ex: "cliente criado com sucesso"
// ou o erro que veio do banco, como o aviso do trigger de conta em aberto).
export function FeedbackBanner({ type, message }: FeedbackBannerProps) {
  const isError = type === "error";
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
        isError
          ? "border-danger/30 bg-danger/10 text-danger"
          : "border-success/30 bg-success/10 text-success"
      )}
    >
      {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      {message}
    </div>
  );
}
