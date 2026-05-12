import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import { COLORS, STATUS_COLOR } from "@/constants/colors";
import type { Contrato } from "@/data/mock";
import { calcStatus } from "@/hooks/useStatusContrato";

export function TimelineGantt({ contratos }: { contratos: Contrato[] }) {
  const today = startOfDay(new Date());
  const data = contratos
    .filter((c) => !c.encerrado)
    .map((c) => {
      const adm = parseISO(c.dataAdmissao);
      const venc = parseISO(c.vencimentoSegundo);
      const start = differenceInCalendarDays(adm, today);
      const length = differenceInCalendarDays(venc, adm);
      const info = calcStatus(c);
      return {
        nome: c.funcionarioNome.length > 18 ? c.funcionarioNome.slice(0, 17) + "…" : c.funcionarioNome,
        offset: start,
        length,
        cargo: c.cargo,
        admissao: format(adm, "dd/MM/yyyy"),
        vencimento: format(venc, "dd/MM/yyyy"),
        diasRestantes: info.diasRestantes,
        status: info.status,
      };
    })
    .sort((a, b) => a.offset - b.offset);

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 26)}>
      <ComposedChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 4, left: 10 }}>
        <CartesianGrid stroke={COLORS.borderSoft} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.textMuted }} domain={["dataMin", "dataMax"]} tickFormatter={(v) => `${v}d`} />
        <YAxis dataKey="nome" type="category" width={130} tick={{ fontSize: 11, fill: COLORS.textPrimary }} />
        <Tooltip
          contentStyle={{ background: "#fff", border: `1px solid ${COLORS.borderSoft}`, borderRadius: 6, fontSize: 12 }}
          formatter={(_v: any, _n: any, p: any) => [`${p.payload.cargo} · ${p.payload.admissao} → ${p.payload.vencimento} (${p.payload.diasRestantes}d)`, "Contrato"]}
        />
        <ReferenceLine x={0} stroke={COLORS.brand} strokeDasharray="3 3" />
        <Bar dataKey="offset" stackId="t" fill="transparent" />
        <Bar dataKey="length" stackId="t" radius={[3, 3, 3, 3]}>
          {data.map((d, i) => <Cell key={i} fill={STATUS_COLOR[d.status]} />)}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
