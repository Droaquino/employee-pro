import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS } from "@/constants/colors";
import type { Contrato } from "@/data/mock";

const PALETTE = ["#071040", "#4f8ef7", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316"];

export function CargosPieChart({ contratos }: { contratos: Contrato[] }) {
  const counts = new Map<string, number>();
  for (const c of contratos) if (!c.encerrado) counts.set(c.cargo, (counts.get(c.cargo) ?? 0) + 1);
  const data = Array.from(counts.entries()).map(([name, value], i) => ({ name, value, fill: PALETTE[i % PALETTE.length] }));

  if (data.length === 0) {
    return <div className="h-[260px] flex items-center justify-center text-[12px]" style={{ color: COLORS.textMuted }}>Sem dados para exibir</div>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={48} outerRadius={80} paddingAngle={2}>
            {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value} contrato${value !== 1 ? "s" : ""}`, name]}
            contentStyle={{ background: "#fff", border: `1px solid ${COLORS.borderSoft}`, borderRadius: 6, fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legenda com quadradinhos */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2 px-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: COLORS.textPrimary }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.fill, flexShrink: 0, display: "inline-block" }} />
            <span>{d.name}</span>
            <span style={{ color: COLORS.textMuted }}>· {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
