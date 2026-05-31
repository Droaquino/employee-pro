import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useNavigate } from "@tanstack/react-router";
import { COLORS, STATUS_COLOR } from "@/constants/colors";
import type { Contrato, Empresa } from "@/data/mock";
import { calcStatus } from "@/hooks/useStatusContrato";

export function EmpresasBarChart({
  empresas,
  contratos,
}: {
  empresas: Empresa[];
  contratos: Contrato[];
}) {
  const navigate = useNavigate();
  const data = empresas
    .map((e) => {
      const list = contratos.filter((c) => c.empresaId === e.id && !c.encerrado);
      const counts = { VIGENTE: 0, PROXIMO: 0, RISCO: 0, VENCIDO: 0 };
      for (const c of list) counts[calcStatus(c).status]++;
      return {
        empresaId: e.id,
        nome: e.nomeFantasia.length > 18 ? e.nomeFantasia.slice(0, 17) + "…" : e.nomeFantasia,
        total: list.length,
        ...counts,
      };
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);

  const visible = data.slice(0, 10);
  const extras = data.length - visible.length;
  if (extras > 0) {
    visible.push({
      empresaId: "",
      nome: `(+ ${extras})`,
      total: 0,
      VIGENTE: 0,
      PROXIMO: 0,
      RISCO: 0,
      VENCIDO: 0,
    });
  }

  if (visible.length === 0) {
    return (
      <div
        className="h-[300px] flex items-center justify-center text-[12px]"
        style={{ color: COLORS.textMuted }}
      >
        Sem dados para exibir
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={visible}
        layout="vertical"
        margin={{ left: 10, right: 16, top: 4, bottom: 4 }}
      >
        <CartesianGrid stroke={COLORS.borderSoft} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.textMuted }} />
        <YAxis
          dataKey="nome"
          type="category"
          width={120}
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
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar
          dataKey="VIGENTE"
          stackId="a"
          fill={STATUS_COLOR.VIGENTE}
          name="Vigente"
          onClick={(d: any) =>
            d.empresaId && navigate({ to: "/empresas/$id", params: { id: d.empresaId } })
          }
          cursor="pointer"
        />
        <Bar
          dataKey="PROXIMO"
          stackId="a"
          fill={STATUS_COLOR.PROXIMO}
          name="Próximo"
          onClick={(d: any) =>
            d.empresaId && navigate({ to: "/empresas/$id", params: { id: d.empresaId } })
          }
          cursor="pointer"
        />
        <Bar
          dataKey="RISCO"
          stackId="a"
          fill={STATUS_COLOR.RISCO}
          name="Em risco"
          onClick={(d: any) =>
            d.empresaId && navigate({ to: "/empresas/$id", params: { id: d.empresaId } })
          }
          cursor="pointer"
        />
        <Bar
          dataKey="VENCIDO"
          stackId="a"
          fill={STATUS_COLOR.VENCIDO}
          name="Vencido"
          onClick={(d: any) =>
            d.empresaId && navigate({ to: "/empresas/$id", params: { id: d.empresaId } })
          }
          cursor="pointer"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
