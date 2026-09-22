import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn = "class names". Combina várias classes condicionais (clsx) e depois remove
// conflitos do Tailwind (twMerge) — ex: se dois lugares passarem "p-2" e "p-4"
// juntos, twMerge garante que só a última prevalece, em vez de aplicar as duas.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
