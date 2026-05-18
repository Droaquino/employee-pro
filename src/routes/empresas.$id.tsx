import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAppStore } from "@/store/appStore";
import { ContratosTable } from "@/components/ContratosTable";
import { ContratosFilters, applyFilters, initialFilters, type FiltersState } from "@/components/ContratosFilters";
import { CargosPieChart } from "@/components/charts/CargosPieChart";
import { StatusEmpresaBarChart } from "@/components/charts/StatusEmpresaBarChart";
import { responsaveis } from "@/data/mock";

export const Route = createFileRoute("/empresas/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da empresa — Arbrent" },
      { name: "description", content: "Detalhe e contratos da empresa." },
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
  const encerrarContratos = useAppStore((s) => s.encerrarContratos);

  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [selected, setSelected] = useState<string[]>([]);

  if (!empresa) throw notFound();

  const respNome = responsaveis.find((r) => r.id === empresa.responsavelId)?.nome ?? "—";
  const ativos = contratos.filter((c) => !c.encerrado);
  const filtered = useMemo(() => applyFilters(contratos, filters), [contratos, filters]);

  const handleEncerrar = () => {
    if (selected.length === 0) return;
    encerrarContratos(selected, "Encerrado em lote");
    setSelected([]);
  };

  return (
    <div>
      <Breadcrumb items={[
        { label: "Gestão" },
        { label: "Empresas", to: "/empresas" },
        { label: empresa.nomeFantasia },
      ]} />

      <PageHeader title={empresa.razaoSocial} subtitle={`${empresa.nomeFantasia} · ${empresa.cnpj}`} />

      <Surface className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
          <Field label="Responsável" value={respNome} />
          <Field label="E-mail" value={empresa.email} />
          <Field label="Telefone" value={empresa.telefone} />
          <Field label="Status" value={empresa.ativo ? "Ativa" : "Inativa"} color={empresa.ativo ? "#16a34a" : "#475569"} />
        </div>
      </Surface>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Surface title="Distribuição por status">
          <StatusEmpresaBarChart contratos={ativos} />
        </Surface>
        <Surface title="Distribuição por cargo">
          <CargosPieChart contratos={ativos} />
        </Surface>
      </div>

      <Surface title="Contratos">
        <ContratosFilters
          contratos={contratos}
          total={contratos.length}
          filtered={filtered.length}
          value={filters}
          onChange={setFilters}
        />
        {selected.length > 0 && (
          <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-md" style={{ background: "#f0f5ff", border: "1px solid #c7d2fe" }}>
            <span className="text-[12px]" style={{ color: "#071040" }}>{selected.length} selecionado(s)</span>
            <button onClick={handleEncerrar} className="text-[12px] px-3 py-1 rounded text-white" style={{ background: "#071040" }}>
              Marcar como encerrado
            </button>
            <button onClick={() => setSelected([])} className="text-[12px]" style={{ color: "#64748b" }}>Limpar seleção</button>
          </div>
        )}
        <ContratosTable
          contratos={filtered}
          selectable
          selected={selected}
          onSelectionChange={setSelected}
          onClearFilters={() => setFilters(initialFilters)}
          caption={`Contratos da empresa ${empresa.nomeFantasia}`}
        />
      </Surface>
    </div>
  );
}

function Field({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="uppercase text-[10px] tracking-wider" style={{ color: "#64748b" }}>{label}</div>
      <div className="mt-1 text-[13px] font-medium" style={{ color: color ?? "#0f172a" }}>{value}</div>
    </div>
  );
}
