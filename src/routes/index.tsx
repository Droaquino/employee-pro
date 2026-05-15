import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/Surface";
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import { EmpresasBarChart } from "@/components/charts/EmpresasBarChart";
import { VencimentosBarChart } from "@/components/charts/VencimentosBarChart";
import { EvolucaoLineChart } from "@/components/charts/EvolucaoLineChart";
import { useAppStore } from "@/store/appStore";
import { PainelAcaoDia } from "@/components/PainelAcaoDia";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Experiência" },
      { name: "description", content: "Visão consolidada dos contratos de experiência da carteira." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const empresas = useAppStore((s) => s.empresas);
  const contratos = useAppStore((s) => s.contratos);

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
        </Surface>
        <Surface title="Contratos por empresa">
          <EmpresasBarChart empresas={empresas} contratos={contratos} />
        </Surface>
        <Surface title="Vencimentos por mês">
          <VencimentosBarChart contratos={contratos} />
        </Surface>
        <Surface title="Evolução da carteira">
          <EvolucaoLineChart contratos={contratos} />
        </Surface>
      </div>
    </div>
  );
}
