import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/Surface";
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import { EmpresasBarChart } from "@/components/charts/EmpresasBarChart";
import { VencimentosBarChart } from "@/components/charts/VencimentosBarChart";
import { EvolucaoLineChart } from "@/components/charts/EvolucaoLineChart";
import { HeatmapVencimentos } from "@/components/charts/HeatmapVencimentos";
import { PainelAcaoDia } from "@/components/PainelAcaoDia";
import { ChartInsight } from "@/components/ChartInsight";
import {
  insightStatus,
  insightEmpresas,
  insightVencimentos,
  insightEvolucao,
  insightHeatmap,
} from "@/lib/insights";
import { useMemo } from "react";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useContratos } from "@/hooks/useContratos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Arbrent" },
      {
        name: "description",
        content: "Visão consolidada dos contratos de experiência da carteira.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: empresas = [] } = useEmpresas();
  const { data: contratos = [] } = useContratos();

  const iStatus = useMemo(() => insightStatus(contratos), [contratos]);
  const iEmpresas = useMemo(() => insightEmpresas(empresas, contratos), [empresas, contratos]);
  const iVenc = useMemo(() => insightVencimentos(contratos), [contratos]);
  const iEvol = useMemo(() => insightEvolucao(contratos), [contratos]);
  const iHeat = useMemo(() => insightHeatmap(empresas, contratos), [empresas, contratos]);

  return (
    <div>
      <PageHeader
        title="Dashboard geral"
        subtitle="Visão consolidada da carteira de contratos de experiência."
      />
      <PainelAcaoDia />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Surface title="Distribuição por status">
          <StatusPieChart contratos={contratos} />
          <ChartInsight insight={iStatus} />
        </Surface>
        <Surface title="Contratos por empresa">
          <EmpresasBarChart empresas={empresas} contratos={contratos} />
          <ChartInsight insight={iEmpresas} />
        </Surface>
        <Surface title="Vencimentos por mês">
          <VencimentosBarChart contratos={contratos} />
          <ChartInsight insight={iVenc} />
        </Surface>
        <Surface title="Evolução da carteira">
          <EvolucaoLineChart contratos={contratos} />
          <ChartInsight insight={iEvol} />
        </Surface>
        <Surface
          title="Mapa de calor — vencimentos por semana (próximos 3 meses)"
          className="lg:col-span-2"
        >
          <HeatmapVencimentos />
          <ChartInsight insight={iHeat} />
        </Surface>
      </div>
    </div>
  );
}
