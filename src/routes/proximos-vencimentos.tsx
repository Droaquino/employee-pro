import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/Surface";
import { useAppStore } from "@/store/appStore";
import { calcStatus } from "@/hooks/useStatusContrato";
import { ContratosTable } from "@/components/ContratosTable";
import { VencimentosBarChart } from "@/components/charts/VencimentosBarChart";

export const Route = createFileRoute("/proximos-vencimentos")({
  head: () => ({
    meta: [
      { title: "Próximos vencimentos — Experiência" },
      { name: "description", content: "Contratos com vencimento entre 15 e 30 dias." },
    ],
  }),
  component: Proximos,
});

function Proximos() {
  const contratos = useAppStore((s) => s.contratos).filter((c) => !c.encerrado && calcStatus(c).status === "PROXIMO");
  const todos = useAppStore((s) => s.contratos);

  return (
    <div>
      <PageHeader
        title="Próximos vencimentos"
        subtitle={`${contratos.length} contrato(s) entre 16 e 30 dias do vencimento final.`}
      />
      <Surface title="Vencimentos por mês" className="mb-4">
        <VencimentosBarChart contratos={todos} />
      </Surface>
      <Surface title="Detalhamento">
        <ContratosTable contratos={contratos} />
      </Surface>
    </div>
  );
}
