import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { COLORS } from "@/constants/colors";
import type { Contrato } from "@/data/mock";

export function Vencimentos30DiasChart({ contratos }: { contratos: Contrato[] }) {
  const hoje = startOfDay(new Date());
  const data = Array.from({ length: 30 }, (_, i) => {
    const dia = addDays(hoje, i);
    const key = format(dia, "yyyy-MM-dd");
    let qt = 0;
    for (const c of contratos) {
      if (c.encerrado) continue;
      if (format(parseISO(c.vencimentoSegundo), "yyyy-MM-dd") === key) qt++;
    }
    return { dia: format(dia, "dd/MM"), qt };
  });

  if (data.every((d) => d.qt === 0)) {
    return <div className="h-[220px] flex items-center justify-center text-[12px]" style={{ color: COLORS.textMuted }}>Sem vencimentos nos próximos 30 dias</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
        <XAxis dataKey="dia" tick={{ fontSize: 10, fill: COLORS.textMuted }} interval={1} />
        <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${COLORS.borderSoft}`, borderRadius: 6, fontSize: 12 }} />
        <Bar dataKey="qt" name="Vencimentos" fill={COLORS.brandAccent} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
