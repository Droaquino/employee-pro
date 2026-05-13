import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { useAppStore } from "@/store/appStore";
import { COLORS } from "@/constants/colors";

const SESSION_KEY = "arbrent_banner_dismissed";

type Variant = "vermelho" | "laranja" | null;

export function BannerAlerta() {
  const contratos = useAppStore((s) => s.contratos);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(SESSION_KEY) === "1"); } catch { /* ignore */ }
  }, []);

  const { vencidos, semana } = useMemo(() => {
    const hoje = startOfDay(new Date());
    let vencidos = 0, semana = 0;
    for (const c of contratos) {
      if (c.encerrado) continue;
      const dias = differenceInCalendarDays(startOfDay(parseISO(c.vencimentoSegundo)), hoje);
      if (dias < 0) vencidos++;
      else if (dias <= 7) semana++;
    }
    return { vencidos, semana };
  }, [contratos]);

  const variant: Variant = vencidos > 0 ? "vermelho" : semana >= 3 ? "laranja" : null;
  if (!variant || dismissed) return null;

  const dispensar = () => {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  if (variant === "vermelho") {
    return (
      <div
        className="mb-4 flex items-start gap-3 rounded-lg"
        style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderLeft: `4px solid ${COLORS.risco}`,
          padding: "12px 16px",
        }}
        role="alert"
      >
        <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
        <div className="flex-1 text-[13px]" style={{ color: "#7f1d1d" }}>
          <strong>{vencidos} contrato(s) vencidos não regularizados</strong>
          <div style={{ color: "#991b1b" }}>
            Ação imediata necessária para evitar passivo trabalhista.
          </div>
        </div>
        <Link
          to="/em-risco"
          className="text-[13px] font-bold whitespace-nowrap hover:underline"
          style={{ color: "#dc2626" }}
        >
          Ver contratos →
        </Link>
        <button onClick={dispensar} aria-label="Dispensar alerta" className="text-[18px] leading-none px-1" style={{ color: "#7f1d1d" }}>×</button>
      </div>
    );
  }

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-lg"
      style={{
        background: "#fffbeb",
        border: "1px solid #fde68a",
        borderLeft: `4px solid ${COLORS.proximo}`,
        padding: "12px 16px",
      }}
      role="alert"
    >
      <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
      <div className="flex-1 text-[13px]" style={{ color: "#78350f" }}>
        <strong>{semana} contrato(s) vencem nos próximos 7 dias</strong>
        <div style={{ color: "#92400e" }}>
          Priorize avaliações para evitar urgências.
        </div>
      </div>
      <Link
        to="/em-risco"
        className="text-[13px] font-bold whitespace-nowrap hover:underline"
        style={{ color: "#b45309" }}
      >
        Ver contratos →
      </Link>
      <button onClick={dispensar} aria-label="Dispensar alerta" className="text-[18px] leading-none px-1" style={{ color: "#78350f" }}>×</button>
    </div>
  );
}
