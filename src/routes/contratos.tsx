import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAppStore } from "@/store/appStore";
import { ContratosTable } from "@/components/ContratosTable";
import { ContratosFilters, applyFilters, initialFilters, type FiltersState } from "@/components/ContratosFilters";

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos — Arbrent" },
      { name: "description", content: "Listagem completa de contratos de experiência." },
    ],
  }),
  component: ContratosPage,
});

function ContratosPage() {
  const empresas = useAppStore((s) => s.empresas);
  const contratos = useAppStore((s) => s.contratos);
  const [empresaId, setEmpresaId] = useState<string>("");
  const [filters, setFilters] = useState<FiltersState>(initialFilters);

  const base = useMemo(() => empresaId ? contratos.filter((c) => c.empresaId === empresaId) : contratos, [contratos, empresaId]);
  const filtered = useMemo(() => applyFilters(base, filters), [base, filters]);

  return (
    <div>
      <Breadcrumb items={[{ label: "Gestão" }, { label: "Contratos" }]} />
      <PageHeader title="Contratos" subtitle="Todos os contratos de experiência da carteira." />
      <Surface>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <select
            aria-label="Filtrar por empresa"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            className="px-3 py-2 rounded-md text-[13px] outline-none"
            style={{ border: "1px solid #e2e5f0", background: "#fff" }}
          >
            <option value="">Todas as empresas</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nomeFantasia}</option>)}
          </select>
        </div>
        <ContratosFilters
          contratos={base}
          total={base.length}
          filtered={filtered.length}
          value={filters}
          onChange={setFilters}
        />
        <ContratosTable
          contratos={filtered}
          onClearFilters={() => { setFilters(initialFilters); setEmpresaId(""); }}
          caption="Contratos filtrados"
        />
      </Surface>
    </div>
  );
}
