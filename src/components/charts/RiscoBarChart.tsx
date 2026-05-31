import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { COLORS, STATUS_COLOR } from "@/constants/colors";
import type { Contrato, Empresa } from "@/data/mock";
import { calcStatus } from "@/hooks/useStatusContrato";

export function RiscoBarChart({
  contratos,
  empresas,
}: {
  contratos: Contrato[];
  empresas: Empresa[];
}) {
  const empMap = new Map(empresas.map((e) => [e.id, e.nomeFantasia]));
  const data = contratos
    .filter((c) => !c.encerrado)
    .map((c) => {
      const info = calcStatus(c);
      return {
        c,
        info,
        label: `${c.funcionarioNome.split(" ")[0]} · ${empMap.get(c.empresaId) ?? ""}`,
        dias: info.diasRestantes,
      };
    })
    .filter((x) => x.info.status === "RISCO" || x.info.status === "VENCIDO")
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 20);

  return (
    <ResponsiveContainer width="100%" height={Math.max(320, data.length * 24)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 4, left: 10 }}>
        <CartesianGrid stroke={COLORS.borderSoft} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: COLORS.textMuted }}
          tickFormatter={(v) => `${v}d`}
        />
        <YAxis
          dataKey="label"
          type="category"
          width={180}
          tick={{ fontSize: 11, fill: COLORS.textPrimary }}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: `1px solid ${COLORS.borderSoft}`,
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <ReferenceLine x={0} stroke={COLORS.brand} />
        <Bar dataKey="dias" radius={[3, 3, 3, 3]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.dias < 0 ? STATUS_COLOR.VENCIDO : STATUS_COLOR.RISCO} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
