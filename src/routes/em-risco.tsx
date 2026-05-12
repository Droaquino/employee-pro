import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAppStore } from "@/store/appStore";
import { calcStatus } from "@/hooks/useStatusContrato";
import { RiscoBarChart } from "@/components/charts/RiscoBarChart";
import { ContratosTable } from "@/components/ContratosTable";

export const Route = createFileRoute("/em-risco")({
  head: () => ({
    meta: [
      { title: "Contratos em risco — Experiência" },
      { name: "description", content: "Contratos com vencimento em até 15 dias ou já vencidos." },
    ],
  }),
  component: EmRisco,
});

function EmRisco() {
  const empresas = useAppStore((s) => s.empresas);
  const contratos = useAppStore((s) => s.contratos).filter((c) => {
    if (c.encerrado) return false;
    const s = calcStatus(c).status;
    return s === "RISCO" || s === "VENCIDO";
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Alertas" }, { label: "Em risco" }]} />
      <PageHeader
        title="Contratos em risco"
        subtitle={`${contratos.length} contrato(s) com vencimento em até 15 dias ou já vencidos.`}
      />
      <Surface title="20 contratos mais críticos" className="mb-4">
        <RiscoBarChart contratos={contratos} empresas={empresas} />
      </Surface>
      <Surface title="Detalhamento">
        <ContratosTable contratos={contratos} />
      </Surface>
    </div>
  );
}
