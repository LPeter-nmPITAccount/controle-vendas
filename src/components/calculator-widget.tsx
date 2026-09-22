"use client";

import { useState } from "react";
import { Calculator, X } from "lucide-react";

// Botões da calculadora, na ordem em que aparecem na tela (esquerda pra direita,
// linha por linha) — manter num array facilita gerar o grid sem repetir JSX
const BUTTONS = [
  "7", "8", "9", "/",
  "4", "5", "6", "*",
  "1", "2", "3", "-",
  "0", ".", "=", "+",
] as const;

// Faz a conta de verdade entre dois números e um operador.
// Nunca usamos eval() aqui — eval roda qualquer código JavaScript que vier na
// string, o que é uma porta aberta pra injeção de código; uma calculadora não
// precisa disso, então fazemos a conta "na mão", com um switch simples.
function calculate(a: number, b: number, operator: string): number {
  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}

export function CalculatorWidget() {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState("0"); // o que aparece na telinha
  const [storedValue, setStoredValue] = useState<number | null>(null); // primeiro número da conta
  const [pendingOperator, setPendingOperator] = useState<string | null>(null); // operador escolhido
  // waitingForNewValue: true logo depois de escolher um operador — o próximo
  // dígito digitado deve começar um número novo, não continuar o que já tinha
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  function handleDigit(digit: string) {
    if (waitingForNewValue) {
      setDisplay(digit);
      setWaitingForNewValue(false);
      return;
    }
    // Evita várias casas de zero à esquerda (ex: "007") e permite só um ponto decimal
    if (digit === "." && display.includes(".")) return;
    setDisplay(display === "0" && digit !== "." ? digit : display + digit);
  }

  function handleOperator(operator: string) {
    const current = Number(display);

    if (operator === "=") {
      if (pendingOperator && storedValue !== null) {
        setDisplay(String(calculate(storedValue, current, pendingOperator)));
        setStoredValue(null);
        setPendingOperator(null);
        setWaitingForNewValue(true);
      }
      return;
    }

    // Se já existe uma conta pendente (ex: já apertou "+"), resolve ela antes
    // de guardar o novo operador — permite encadear contas (2 + 3 + 4)
    if (pendingOperator && storedValue !== null && !waitingForNewValue) {
      setStoredValue(calculate(storedValue, current, pendingOperator));
    } else {
      setStoredValue(current);
    }
    setPendingOperator(operator);
    setWaitingForNewValue(true);
  }

  function handleClear() {
    setDisplay("0");
    setStoredValue(null);
    setPendingOperator(null);
    setWaitingForNewValue(false);
  }

  return (
    <>
      {/* Botão flutuante — fixo no canto inferior direito, por cima de tudo (z-50) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar calculadora" : "Abrir calculadora"}
        title={open ? "Fechar calculadora" : "Abrir calculadora"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full
                   bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X size={22} /> : <Calculator size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-64 rounded-xl border border-border bg-surface p-4 shadow-xl">
          {/* Telinha: mostra o valor atual, alinhado à direita como calculadora de verdade */}
          <div className="mb-3 rounded-lg bg-background px-3 py-4 text-right text-2xl font-semibold text-foreground">
            {display}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Botão "C" ocupa a primeira linha inteira, sozinho, pra ficar em destaque */}
            <button
              type="button"
              onClick={handleClear}
              title="Limpar tudo"
              className="col-span-4 rounded-lg bg-danger/15 py-2 text-sm font-medium text-danger hover:bg-danger/25"
            >
              C
            </button>

            {BUTTONS.map((btn) => {
              const isOperator = ["/", "*", "-", "+", "="].includes(btn);
              return (
                <button
                  key={btn}
                  type="button"
                  onClick={() => (isOperator ? handleOperator(btn) : handleDigit(btn))}
                  className={
                    isOperator
                      ? "rounded-lg bg-accent py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
                      : "rounded-lg bg-surface-hover py-2 text-sm font-medium text-foreground hover:opacity-80"
                  }
                >
                  {btn}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
