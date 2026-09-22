"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export interface SearchableOption {
  id: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
}

// Campo de busca com sugestões (um "combobox" simples, sem depender de nenhuma
// biblioteca externa) — a pessoa digita, filtra a lista, clica pra escolher.
// Usado tanto pra escolher um cliente existente quanto um produto num item.
export function SearchableSelect({ options, value, onChange, placeholder }: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.id === value);

  // Enquanto a lista está aberta, filtra pelo que foi digitado.
  // Fechada, não importa (mostramos o rótulo do item escolhido, não a lista).
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="relative">
      <Input
        // Enquanto aberto, mostra o que a pessoa está digitando; fechado, mostra
        // o nome do item já selecionado (ou vazio, se nada foi escolhido ainda)
        value={open ? query : (selected?.label ?? "")}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => {
          // pequeno atraso: dá tempo do clique numa opção (abaixo) registrar
          // ANTES da lista fechar — sem isso, o clique nunca chegaria a disparar
          setTimeout(() => setOpen(false), 120);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">Nenhum resultado</li>
          )}
          {filtered.map((option) => (
            <li
              key={option.id}
              // onMouseDown (não onClick!): dispara ANTES do onBlur do input acima,
              // garantindo que a seleção aconteça antes da lista fechar
              onMouseDown={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className="cursor-pointer px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
