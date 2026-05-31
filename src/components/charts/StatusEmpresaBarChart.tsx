import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { COLORS, STATUS_COLOR, STATUS_LABEL } from "@/constants/colors";
import { calcStatus } from "@/hooks/useStatusContrato";
import type { Contrato } from "@/data/mock";

export function StatusEmpresaBarChart({ contratos }: { contratos: Contrato[] }) {
  const counts: Record<string, number> = { VIGENTE: 0, PROXIMO: 0, RISCO: 0, VENCIDO: 0 };
  for (const c of contratos) if (!c.encerrado) counts[calcStatus(c).status]++;
  const data = Object.entries(counts).map(([k, v]) => ({
    key: k,
    label: STATUS_LABEL[k],
    value: v,
  }));

  if (data.every((d) => d.value === 0)) {
    return (
      <div
        className="h-[260px] flex items-center justify-center text-[12px]"
        style={{ color: COLORS.textMuted }}
      >
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} />
          <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} allowDecimals={false} />
          <Tooltip
            formatter={(value: number, _name: string, props: any) => [
              `${value} contrato${value !== 1 ? "s" : ""}`,
              props.payload?.label ?? "",
            ]}
            contentStyle={{
              background: "#fff",
              border: `1px solid ${COLORS.borderSoft}`,
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.key} fill={STATUS_COLOR[d.key]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legenda com quadradinhos */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
        {data.map((d) => (
          <div
            key={d.key}
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: COLORS.textPrimary }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: STATUS_COLOR[d.key],
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span>{d.label}</span>
            <span style={{ color: COLORS.textMuted }}>· {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
