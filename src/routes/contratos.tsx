import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAppStore } from "@/store/appStore";
import { ContratosTable } from "@/components/ContratosTable";
import { ContratosFilters, applyFilters, hasActiveFilters, initialFilters, type FiltersState } from "@/components/ContratosFilters";
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

const SESSION_KEY = "contratos_page_filters";

function loadSession(): { empresaId: string; filters: FiltersState } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as { empresaId: string; filters: FiltersState };
  } catch {}
  return { empresaId: "", filters: initialFilters };
}

function ContratosPage() {
  const empresas = useAppStore((s) => s.empresas);
  const contratos = useAppStore((s) => s.contratos);

  const saved = useMemo(loadSession, []);
  const [empresaId, setEmpresaId] = useState<string>(saved.empresaId);
  const [filters, setFilters] = useState<FiltersState>(saved.filters);

  const persist = (nextEmpresaId: string, nextFilters: FiltersState) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ empresaId: nextEmpresaId, filters: nextFilters }));
    } catch {}
  };

  const handleEmpresaChange = (id: string) => {
    setEmpresaId(id);
    persist(id, filters);
  };

  const handleFiltersChange = (next: FiltersState) => {
    setFilters(next);
    persist(empresaId, next);
  };

  const handleClearAll = () => {
    setFilters(initialFilters);
    setEmpresaId("");
    persist("", initialFilters);
  };

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

  const anyFilter = empresaId !== "" || hasActiveFilters(filters);

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
            onChange={(e) => handleEmpresaChange(e.target.value)}
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
          onChange={handleFiltersChange}
        />

        {/* Contador dinâmico + Limpar filtros */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[12px]" style={{ color: "#64748b" }}>
            Exibindo <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> de {base.length} contratos
          </span>
          {anyFilter && (
            <button
              onClick={handleClearAll}
              className="text-[12px] px-2 py-0.5 rounded"
              style={{ color: "#ef4444", border: "1px solid #fecaca" }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        <ContratosTable
          contratos={filtered}
          expandable
          onClearFilters={handleClearAll}
          caption="Contratos filtrados"
        />
      </Surface>
    </div>
  );
}
