import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from "recharts";
import { addMonths, format, isAfter, isBefore, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { COLORS } from "@/constants/colors";
import type { Contrato } from "@/data/mock";

export function EvolucaoLineChart({ contratos }: { contratos: Contrato[] }) {
  const now = startOfMonth(new Date());
  const months = Array.from({ length: 8 }, (_, i) => addMonths(now, -5 + i));

  const data = months.map((m, i) => {
    const ref = startOfMonth(m);
    let ativos = 0;
    for (const c of contratos) {
      const adm = parseISO(c.dataAdmissao);
      const venc = parseISO(c.vencimentoSegundo);
      if (!isAfter(adm, ref) && isAfter(venc, ref)) ativos++;
    }
    const isFuture = isBefore(now, ref);
    return {
      mes: format(m, "MMM/yy", { locale: ptBR }),
      ativos: isFuture ? null : ativos,
      projecao: i >= 5 ? Math.round(ativos * (1 + (i - 5) * 0.04)) : null,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: COLORS.textMuted }} />
        <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${COLORS.borderSoft}`, borderRadius: 6, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine x={format(now, "MMM/yy", { locale: ptBR })} stroke={COLORS.brandAccent} strokeDasharray="3 3" />
        <Line type="monotone" dataKey="ativos" name="Contratos ativos" stroke={COLORS.brand} strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="projecao" name="Projeção" stroke={COLORS.brandAccent} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
