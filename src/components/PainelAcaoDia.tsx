import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppStore } from "@/store/appStore";
import { calcStatus } from "@/hooks/useStatusContrato";

export function PainelAcaoDia() {
  const contratos = useAppStore((s) => s.contratos);

  const counts = useMemo(() => {
    let urgente = 0; // vence em <= 7 dias (não vencidos)
    let agendar = 0; // vence em 8-30 dias
    let vencidos = 0; // já vencidos
    for (const c of contratos) {
      if (c.encerrado) continue;
      const { diasRestantes } = calcStatus(c);
      if (diasRestantes < 0) vencidos++;
      else if (diasRestantes <= 7) urgente++;
      else if (diasRestantes <= 30) agendar++;
    }
    return { urgente, agendar, vencidos };
  }, [contratos]);

  const hoje = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  const total = counts.urgente + counts.agendar + counts.vencidos;

  if (total === 0) {
    return (
      <section
        aria-label="Painel de ação do dia"
        className="mb-4 px-5 py-4 rounded-md flex items-center justify-between"
        style={{ background: "#0a1550", minHeight: 80 }}
      >
        <div className="text-[12px] uppercase tracking-wider" style={{ color: "#a8c7ff" }}>
          Hoje, {hoje}
        </div>
        <div className="font-semibold text-[18px]" style={{ color: "#22c55e" }}>
          ✓ Carteira em dia — nenhuma ação necessária hoje
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Painel de ação do dia"
      className="mb-4 px-5 py-3 rounded-md"
      style={{ background: "#0a1550", minHeight: 80 }}
    >
      <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "#a8c7ff" }}>
        Hoje, {hoje}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
        <Item
          dot="#ef4444"
          number={counts.urgente}
          label="contratos vencem em menos de 7 dias"
          ctaLabel="Resolver agora"
          to="/em-risco"
        />
        <Item
          dot="#f59e0b"
          number={counts.agendar}
          label="contratos vencem em até 30 dias"
          ctaLabel="Agendar avaliações"
          to="/proximos-vencimentos"
        />
        <Item
          dot="#cbd5e1"
          number={counts.vencidos}
          label="contratos vencidos sem ação"
          ctaLabel="Ver pendências"
          to="/em-risco"
        />
      </div>
    </section>
  );
}

function Item({
  dot,
  number,
  label,
  ctaLabel,
  to,
}: {
  dot: string;
  number: number;
  label: string;
  ctaLabel: string;
  to: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="inline-block rounded-full shrink-0"
        style={{ background: dot, width: 10, height: 10 }}
      />
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-bold text-white" style={{ fontSize: 28, lineHeight: 1 }}>
          {number}
        </span>
        <span style={{ fontSize: 13, color: "#a8c7ff" }}>{label}</span>
        <Link
          to={to}
          aria-label={ctaLabel}
          className="hover:underline"
          style={{ fontSize: 13, color: "#4f8ef7" }}
        >
          → {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
