import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAppStore } from "@/store/appStore";
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import { ProrrogacaoFunnel } from "@/components/charts/ProrrogacaoFunnel";
import { EvolucaoLineChart } from "@/components/charts/EvolucaoLineChart";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Experiência" },
      { name: "description", content: "Relatórios consolidados da carteira de contratos." },
    ],
  }),
  component: Relatorios,
});

function Relatorios() {
  const contratos = useAppStore((s) => s.contratos);
  return (
    <div>
      <Breadcrumb items={[{ label: "Operacional" }, { label: "Relatórios" }]} />
      <PageHeader title="Relatórios" subtitle="Visões consolidadas para análise estratégica." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Surface title="Distribuição por status"><StatusPieChart contratos={contratos} /></Surface>
        <Surface title="Funil de prorrogação"><ProrrogacaoFunnel contratos={contratos} /></Surface>
        <Surface title="Evolução da carteira" className="lg:col-span-2"><EvolucaoLineChart contratos={contratos} /></Surface>
      </div>
    </div>
  );
}
