import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/Surface";
import { useAppStore } from "@/store/appStore";
import { TimelineGantt } from "@/components/charts/TimelineGantt";
import { ProrrogacaoFunnel } from "@/components/charts/ProrrogacaoFunnel";
import { ContratosTable } from "@/components/ContratosTable";

export const Route = createFileRoute("/empresas/$id")({
  head: () => ({
    meta: [
      { title: "Contratos da empresa — Experiência" },
      { name: "description", content: "Linha do tempo e funil de prorrogações da empresa." },
    ],
  }),
  component: EmpresaDetail,
  notFoundComponent: () => (
    <div className="text-center py-16">
      <h2 className="text-lg font-semibold">Empresa não encontrada</h2>
      <Link to="/empresas" className="text-[13px]" style={{ color: "#4f8ef7" }}>Voltar para empresas</Link>
    </div>
  ),
});

function EmpresaDetail() {
  const { id } = Route.useParams();
  const empresa = useAppStore((s) => s.empresas.find((e) => e.id === id));
  const contratos = useAppStore((s) => s.contratos.filter((c) => c.empresaId === id));

  if (!empresa) throw notFound();

  return (
    <div>
      <div className="text-[12px] mb-2" style={{ color: "#64748b" }}>
        <Link to="/empresas" style={{ color: "#4f8ef7" }}>Empresas</Link>
        <span className="mx-1.5">/</span>
        <span>{empresa.nomeFantasia}</span>
      </div>
      <PageHeader
        title={empresa.razaoSocial}
        subtitle={`${contratos.filter((c) => !c.encerrado).length} contratos ativos · ${empresa.cnpj}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Surface title="Linha do tempo de contratos">
          <TimelineGantt contratos={contratos} />
        </Surface>
        <Surface title="Funil de prorrogação">
          <ProrrogacaoFunnel contratos={contratos} />
        </Surface>
      </div>

      <Surface title="Contratos">
        <ContratosTable contratos={contratos} />
      </Surface>
    </div>
  );
}
