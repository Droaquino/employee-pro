import { useEffect, useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, X } from "lucide-react";
import { COLORS } from "@/constants/colors";

/**
 * Calculadora de prazo flutuante — funciona offline (não depende do mock).
 * Regra: contrato de experiência = 1ª prorrogação (90 dias) + 2ª prorrogação (mais 90 dias = 180 dias totais).
 */
export function CalculadoraPrazo() {
  const [open, setOpen] = useState(false);
  const [admissao, setAdmissao] = useState("");
  const [prazo1, setPrazo1] = useState(90);
  const [prazo2, setPrazo2] = useState(90);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const result = useMemo(() => {
    if (!admissao) return null;
    const d = parseISO(admissao);
    if (!isValid(d)) return null;
    const venc1 = addDays(d, prazo1);
    const venc2 = addDays(venc1, prazo2);
    const hoje = new Date();
    const diasAteVenc1 = differenceInCalendarDays(venc1, hoje);
    const diasAteVenc2 = differenceInCalendarDays(venc2, hoje);
    const alertaAvaliacao = addDays(venc1, -15); // 15 dias antes do 1º vencimento
    const alertaDecisao = addDays(venc2, -15); // 15 dias antes do 2º vencimento (efetivação)
    return { d, venc1, venc2, diasAteVenc1, diasAteVenc2, alertaAvaliacao, alertaDecisao };
  }, [admissao, prazo1, prazo2]);

  const fmt = (date: Date) => format(date, "dd/MM/yyyy (EEEE)", { locale: ptBR });
  const fmtCurto = (date: Date) => format(date, "dd/MM/yyyy", { locale: ptBR });

  const labelDias = (n: number) => {
    if (n === 0) return "hoje";
    if (n > 0) return `em ${n} dia${n === 1 ? "" : "s"}`;
    return `há ${Math.abs(n)} dia${Math.abs(n) === 1 ? "" : "s"}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir calculadora de prazo"
        title="Calculadora de prazo"
        className="fixed z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-transform hover:scale-105"
        style={{ right: 20, bottom: 20, background: COLORS.brand, color: "#fff" }}
      >
        <Calculator size={18} />
        <span className="text-[13px] font-medium">Calcular prazo</span>
      </button>

      {open && (
        <div
          className="fixed z-50 w-[360px] max-w-[calc(100vw-32px)] rounded-lg shadow-2xl animate-scale-in"
          style={{
            right: 20,
            bottom: 76,
            background: COLORS.surface,
            border: `1px solid ${COLORS.borderSoft}`,
          }}
          role="dialog"
          aria-label="Calculadora de prazo de contrato de experiência"
        >
          <div
            className="flex items-center justify-between px-4 py-3 rounded-t-lg"
            style={{ background: COLORS.brand, color: "#fff" }}
          >
            <div className="flex items-center gap-2">
              <Calculator size={16} />
              <span className="text-[13px] font-semibold">Calculadora de prazo</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar calculadora"
              className="rounded p-1 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-4 py-4 space-y-3">
            <div>
              <label
                htmlFor="calc-admissao"
                className="block text-[11px] font-medium mb-1"
                style={{ color: COLORS.textMuted }}
              >
                Data de admissão
              </label>
              <input
                id="calc-admissao"
                type="date"
                value={admissao}
                onChange={(e) => setAdmissao(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-[13px]"
                style={{ border: `1px solid ${COLORS.borderSoft}`, color: COLORS.textPrimary }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="calc-p1"
                  className="block text-[11px] font-medium mb-1"
                  style={{ color: COLORS.textMuted }}
                >
                  1ª prorrogação (dias)
                </label>
                <input
                  id="calc-p1"
                  type="number"
                  min={1}
                  max={90}
                  value={prazo1}
                  onChange={(e) => setPrazo1(Math.max(1, Math.min(90, Number(e.target.value) || 0)))}
                  className="w-full rounded-md px-3 py-2 text-[13px]"
                  style={{ border: `1px solid ${COLORS.borderSoft}`, color: COLORS.textPrimary }}
                />
              </div>
              <div>
                <label
                  htmlFor="calc-p2"
                  className="block text-[11px] font-medium mb-1"
                  style={{ color: COLORS.textMuted }}
                >
                  2ª prorrogação (dias)
                </label>
                <input
                  id="calc-p2"
                  type="number"
                  min={1}
                  max={90}
                  value={prazo2}
                  onChange={(e) => setPrazo2(Math.max(1, Math.min(90, Number(e.target.value) || 0)))}
                  className="w-full rounded-md px-3 py-2 text-[13px]"
                  style={{ border: `1px solid ${COLORS.borderSoft}`, color: COLORS.textPrimary }}
                />
              </div>
            </div>

            <p className="text-[10.5px]" style={{ color: COLORS.textMuted }}>
              Limite legal: até 90 dias por prorrogação. Total não pode exceder 90+90=180 dias.
            </p>

            {result && (
              <div
                className="rounded-md p-3 space-y-2 mt-2"
                style={{ background: "#f8fafc", border: `1px solid ${COLORS.borderSoft}` }}
              >
                <Linha
                  label="1º vencimento"
                  valor={fmt(result.venc1)}
                  hint={labelDias(result.diasAteVenc1)}
                  tone={result.diasAteVenc1 < 0 ? "critico" : result.diasAteVenc1 <= 15 ? "atencao" : "ok"}
                />
                <Linha
                  label="2º vencimento (efetivação)"
                  valor={fmt(result.venc2)}
                  hint={labelDias(result.diasAteVenc2)}
                  tone={result.diasAteVenc2 < 0 ? "critico" : result.diasAteVenc2 <= 15 ? "atencao" : "ok"}
                />
                <div
                  className="pt-2 mt-2 text-[11px] leading-snug"
                  style={{ borderTop: `1px dashed ${COLORS.borderSoft}`, color: COLORS.textMuted }}
                >
                  <div>
                    Alerta avaliação <strong style={{ color: COLORS.textPrimary }}>{fmtCurto(result.alertaAvaliacao)}</strong>
                    {" "}— 15 dias antes do 1º vencimento.
                  </div>
                  <div className="mt-1">
                    Alerta decisão <strong style={{ color: COLORS.textPrimary }}>{fmtCurto(result.alertaDecisao)}</strong>
                    {" "}— 15 dias antes da efetivação.
                  </div>
                </div>
              </div>
            )}

            {!result && admissao && (
              <p className="text-[12px]" style={{ color: COLORS.risco }}>
                Data inválida.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Linha({
  label,
  valor,
  hint,
  tone,
}: {
  label: string;
  valor: string;
  hint: string;
  tone: "ok" | "atencao" | "critico";
}) {
  const color = tone === "critico" ? COLORS.risco : tone === "atencao" ? COLORS.proximo : COLORS.vigente;
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[11px]" style={{ color: COLORS.textMuted }}>{label}</div>
        <div className="text-[12.5px] font-medium" style={{ color: COLORS.textPrimary }}>{valor}</div>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-white"
        style={{ background: color }}
      >
        {hint}
      </span>
    </div>
  );
}
