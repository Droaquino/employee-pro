import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { addWeeks, endOfWeek, format, isWithinInterval, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { COLORS } from "@/constants/colors";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useContratos } from "@/hooks/useContratos";

type Cell = { empresaId: string; weekIdx: number; count: number; weekStart: Date; weekEnd: Date; empresaNome: string };

function cellColor(n: number) {
  if (n === 0) return { bg: "#f0f4ff", fg: "#94a3b8" };
  if (n <= 2) return { bg: "#bfdbfe", fg: "#1e3a8a" };
  if (n <= 4) return { bg: "#f59e0b", fg: "#ffffff" };
  return { bg: "#ef4444", fg: "#ffffff" };
}

export function HeatmapVencimentos() {
  const { data: empresas = [] } = useEmpresas();
  const { data: contratos = [] } = useContratos();
  const navigate = useNavigate();

  const { weeks, rows } = useMemo(() => {
    const WEEKS_N = 12; // ~3 meses
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weeks = Array.from({ length: WEEKS_N }, (_, i) => {
      const start = addWeeks(base, i);
      return { idx: i, start, end: endOfWeek(start, { weekStartsOn: 1 }) };
    });

    const empresasComContratos = empresas.filter((e) =>
      contratos.some((c) => c.empresaId === e.id && !c.encerrado),
    );

    const rows = empresasComContratos.map((e) => {
      const cells: Cell[] = weeks.map((w) => {
        const count = contratos.filter((c) => {
          if (c.encerrado || c.empresaId !== e.id) return false;
          const v = parseISO(c.vencimentoSegundo);
          return isWithinInterval(v, { start: w.start, end: w.end });
        }).length;
        return {
          empresaId: e.id,
          empresaNome: e.nomeFantasia,
          weekIdx: w.idx,
          count,
          weekStart: w.start,
          weekEnd: w.end,
        };
      });
      const total = cells.reduce((s, c) => s + c.count, 0);
      return { empresa: e, cells, total };
    });

    return { weeks, rows: rows.filter((r) => r.total > 0).sort((a, b) => b.total - a.total) };
  }, [empresas, contratos]);

  if (rows.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-[12px]" style={{ color: COLORS.textMuted }}>
        Nenhum vencimento nos próximos 3 meses.
      </div>
    );
  }

  const handleCellClick = (cell: Cell) => {
    if (cell.count === 0) return;
    navigate({ to: "/empresas/$id", params: { id: cell.empresaId } });
  };

  // Group weeks by month for header
  const monthHeaders: { label: string; span: number }[] = [];
  weeks.forEach((w) => {
    const label = format(w.start, "MMM/yy", { locale: ptBR });
    const last = monthHeaders[monthHeaders.length - 1];
    if (last && last.label === label) last.span++;
    else monthHeaders.push({ label, span: 1 });
  });

  const NAME_COL = "minmax(140px, 180px)";
  const WEEK_COL = "minmax(28px, 1fr)";

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        {/* Month header */}
        <div
          className="grid text-[11px] font-medium mb-1"
          style={{
            gridTemplateColumns: `${NAME_COL} repeat(${weeks.length}, ${WEEK_COL})`,
            color: COLORS.textMuted,
          }}
        >
          <div />
          {monthHeaders.map((m, i) => (
            <div
              key={`${m.label}-${i}`}
              className="text-center capitalize border-b pb-0.5"
              style={{ gridColumn: `span ${m.span}`, borderColor: COLORS.borderSoft }}
            >
              {m.label}
            </div>
          ))}
        </div>

        {/* Week numbers */}
        <div
          className="grid text-[10px] mb-1"
          style={{
            gridTemplateColumns: `${NAME_COL} repeat(${weeks.length}, ${WEEK_COL})`,
            color: COLORS.textMuted,
          }}
        >
          <div />
          {weeks.map((w) => (
            <div key={w.idx} className="text-center">
              S{w.idx + 1}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.map((row) => (
          <div
            key={row.empresa.id}
            className="grid items-center gap-[2px] mb-[2px]"
            style={{ gridTemplateColumns: `${NAME_COL} repeat(${weeks.length}, ${WEEK_COL})` }}
          >
            <div
              className="text-[12px] pr-2 truncate"
              style={{ color: COLORS.textPrimary }}
              title={row.empresa.nomeFantasia}
            >
              {row.empresa.nomeFantasia}
            </div>
            {row.cells.map((cell) => {
              const { bg, fg } = cellColor(cell.count);
              const tip =
                cell.count > 0
                  ? `${cell.count} contrato(s) da ${cell.empresaNome} vencem na semana de ${format(cell.weekStart, "dd/MM")}`
                  : `Sem vencimentos · semana de ${format(cell.weekStart, "dd/MM")}`;
              return (
                <button
                  key={cell.weekIdx}
                  type="button"
                  onClick={() => handleCellClick(cell)}
                  disabled={cell.count === 0}
                  title={tip}
                  aria-label={tip}
                  className="h-7 rounded-sm flex items-center justify-center text-[11px] font-semibold transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
                  style={{ background: bg, color: fg, cursor: cell.count > 0 ? "pointer" : "default" }}
                >
                  {cell.count > 0 ? cell.count : ""}
                </button>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 text-[11px]" style={{ color: COLORS.textMuted }}>
          <span>Intensidade:</span>
          {[
            { label: "0", bg: "#f0f4ff" },
            { label: "1–2", bg: "#bfdbfe" },
            { label: "3–4", bg: "#f59e0b" },
            { label: "5+", bg: "#ef4444" },
          ].map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: l.bg }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
