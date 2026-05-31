import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";
import { COLORS } from "@/constants/colors";
import type { Contrato } from "@/data/mock";

export function ProrrogacaoFunnel({ contratos }: { contratos: Contrato[] }) {
  const primeira = contratos.filter((c) => !c.encerrado && c.prorrogacaoAtual === 1).length;
  const segunda = contratos.filter((c) => !c.encerrado && c.prorrogacaoAtual === 2).length;
  const efetivados = contratos.filter(
    (c) => c.encerrado && c.motivoEncerramento === "Efetivado",
  ).length;
  const encerrados = contratos.filter(
    (c) => c.encerrado && c.motivoEncerramento !== "Efetivado",
  ).length;

  const data = [
    { name: "1ª prorrogação", value: primeira, fill: COLORS.brandAccent },
    { name: "2ª prorrogação", value: segunda, fill: COLORS.brand },
    { name: "Efetivados", value: efetivados || 1, fill: COLORS.vigente },
    { name: "Encerrados", value: encerrados || 1, fill: COLORS.textMuted },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <FunnelChart>
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: `1px solid ${COLORS.borderSoft}`,
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <Funnel dataKey="value" data={data} isAnimationActive>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill} />
          ))}
          <LabelList
            position="right"
            fill={COLORS.textPrimary}
            stroke="none"
            dataKey="name"
            style={{ fontSize: 12 }}
          />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
