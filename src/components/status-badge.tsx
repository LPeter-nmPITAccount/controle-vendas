import { cn } from "@/lib/utils";

// Mapa: pra cada valor possível do enum movement_status, qual cor de fundo/texto usar.
// Centralizar isso aqui evita ficar repetindo "if status === ..." em cada tela.
const STATUS_STYLES: Record<string, string> = {
  "Para Anotar": "bg-warning/15 text-warning", // ainda precisa ser repassado
  Anotado: "bg-success/15 text-success", // já foi repassado/registrado
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-muted/15 text-muted"
      )}
    >
      {status}
    </span>
  );
}
