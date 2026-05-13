import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAppStore } from "@/store/appStore";
import { ContratosTable } from "@/components/ContratosTable";
import { ContratosFilters, applyFilters, initialFilters, type FiltersState } from "@/components/ContratosFilters";
import { calcStatus } from "@/hooks/useStatusContrato";
import { STATUS_LABEL } from "@/constants/colors";
import { csvDateStamp, downloadCsv, toCsv } from "@/lib/csv";

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
  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e.nomeFantasia])), [empresas]);

  const handleExport = () => {
    if (filtered.length === 0) { toast.error("Nada para exportar"); return; }
    const rows = filtered.map((c) => {
      const info = calcStatus(c);
      return {
        Empresa: empresaMap.get(c.empresaId) ?? "",
        Funcionario: c.funcionarioNome,
        CPF: c.funcionarioCpf,
        Cargo: c.cargo,
        Admissao: format(parseISO(c.dataAdmissao), "dd/MM/yyyy"),
        "Vencimento 2a": format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy"),
        Status: STATUS_LABEL[info.status],
        "Dias restantes": info.diasRestantes,
        Encerrado: c.encerrado ? "Sim" : "Não",
      };
    });
    downloadCsv(`contratos_${csvDateStamp()}.csv`, toCsv(rows));
    toast.success(`${rows.length} contrato(s) exportado(s)`);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Gestão" }, { label: "Contratos" }]} />
      <PageHeader
        title="Contratos"
        subtitle="Todos os contratos de experiência da carteira."
        right={
          <button onClick={handleExport} className="px-4 py-2 rounded-md text-[13px] font-medium text-white" style={{ background: "#071040" }}>
            Exportar CSV
          </button>
        }
      />
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
