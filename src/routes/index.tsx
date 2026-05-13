import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { PageHeader, Surface } from "@/components/Surface";
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import { EmpresasBarChart } from "@/components/charts/EmpresasBarChart";
import { VencimentosBarChart } from "@/components/charts/VencimentosBarChart";
import { EvolucaoLineChart } from "@/components/charts/EvolucaoLineChart";
import { useAppStore } from "@/store/appStore";
import { calcStatus } from "@/hooks/useStatusContrato";
import { BannerAlerta } from "@/components/BannerAlerta";

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

  const counts = useMemo(() => {
    let risco = 0, vencido = 0;
    for (const c of contratos) {
      if (c.encerrado) continue;
      const { status } = calcStatus(c);
      if (status === "RISCO") risco++;
      else if (status === "VENCIDO") vencido++;
    }
    return { risco, vencido };
  }, [contratos]);

  useEffect(() => {
    const total = counts.risco + counts.vencido;
    if (total === 0) return;
    toast.warning(`${total} contrato(s) precisam de atenção`, {
      description: `${counts.vencido} vencido(s) · ${counts.risco} em risco (≤ 15 dias).`,
      duration: 6000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard geral"
        subtitle="Visão consolidada da carteira de contratos de experiência."
      />
      <BannerAlerta />
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
