import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, STATUS_COLOR, STATUS_LABEL } from "@/constants/colors";
import type { Contrato } from "@/data/mock";
import { calcStatus } from "@/hooks/useStatusContrato";

export function StatusPieChart({ contratos }: { contratos: Contrato[] }) {
  const counts: Record<string, number> = { VIGENTE: 0, PROXIMO: 0, RISCO: 0, VENCIDO: 0 };
  for (const c of contratos) {
    if (c.encerrado) continue;
    counts[calcStatus(c).status]++;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_LABEL[k], value: v, key: k }));

  if (data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-[12px]" style={{ color: COLORS.textMuted }}>Sem dados para exibir</div>;
  }
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={60} outerRadius={100} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.key} fill={STATUS_COLOR[d.key]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
            contentStyle={{ background: "#fff", border: `1px solid ${COLORS.borderSoft}`, borderRadius: 6, fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-2 text-[12px]" style={{ color: COLORS.textPrimary }}>
            <span className="w-3 h-3 rounded-sm" style={{ background: STATUS_COLOR[d.key] }} />
            <span>{d.name}</span>
            <span style={{ color: COLORS.textMuted }}>· {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
