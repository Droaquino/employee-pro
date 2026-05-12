import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { addMonths, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { COLORS } from "@/constants/colors";
import type { Contrato } from "@/data/mock";

export function VencimentosBarChart({ contratos }: { contratos: Contrato[] }) {
  const now = startOfMonth(new Date());
  const months = Array.from({ length: 4 }, (_, i) => addMonths(now, i));
  const data = months.map((m) => {
    const key = format(m, "yyyy-MM");
    let prim = 0;
    let seg = 0;
    for (const c of contratos) {
      if (c.encerrado) continue;
      if (format(parseISO(c.vencimentoPrimeiro), "yyyy-MM") === key && c.prorrogacaoAtual === 1) prim++;
      if (format(parseISO(c.vencimentoSegundo), "yyyy-MM") === key) seg++;
    }
    return { mes: format(m, "MMM/yy", { locale: ptBR }), key, prim, seg };
  });

  const currentKey = format(now, "yyyy-MM");

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: COLORS.textMuted }} />
        <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${COLORS.borderSoft}`, borderRadius: 6, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine x={data.find((d) => d.key === currentKey)?.mes} stroke={COLORS.brandAccent} strokeDasharray="3 3" />
        <Bar dataKey="prim" name="1ª prorrogação" fill={COLORS.brandAccent} radius={[4, 4, 0, 0]} />
        <Bar dataKey="seg" name="2ª prorrogação" fill={COLORS.brand} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
