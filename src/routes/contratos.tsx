import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import { toast } from "sonner";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useContratos } from "@/hooks/useContratos";
import { ContratosTable } from "@/components/ContratosTable";
import {
  ContratosFilters,
  applyFilters,
  hasActiveFilters,
  initialFilters,
  type FiltersState,
} from "@/components/ContratosFilters";
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
  const { data: empresas = [] } = useEmpresas();
  const { data: contratos = [] } = useContratos();

  const saved = useMemo(loadSession, []);
  const [empresaId, setEmpresaId] = useState<string>(saved.empresaId);
  const [filters, setFilters] = useState<FiltersState>(saved.filters);

  const persist = (nextEmpresaId: string, nextFilters: FiltersState) => {
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ empresaId: nextEmpresaId, filters: nextFilters }),
      );
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

  const base = useMemo(
    () => (empresaId ? contratos.filter((c) => c.empresaId === empresaId) : contratos),
    [contratos, empresaId],
  );
  const filtered = useMemo(() => applyFilters(base, filters), [base, filters]);
  const empresaMap = useMemo(
    () => new Map(empresas.map((e) => [e.id, e.nomeFantasia])),
    [empresas],
  );

  // Contagens para chips de filtro rápido
  const chipCounts = useMemo(() => {
    const hoje = startOfDay(new Date());
    let hoje_ = 0,
      semana = 0,
      risco = 0;
    for (const c of base) {
      if (c.encerrado) continue;
      const dias = differenceInCalendarDays(startOfDay(parseISO(c.vencimentoSegundo)), hoje);
      if (dias === 0) hoje_++;
      if (dias >= 0 && dias <= 7) semana++;
      if (dias < 0 || dias <= 15) risco++;
    }
    return { hoje: hoje_, semana, risco };
  }, [base]);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error("Nada para exportar");
      return;
    }
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

  // Aplicar chip de filtro rápido
  const applyChip = (chip: "hoje" | "semana" | "risco") => {
    const hoje = startOfDay(new Date());
    if (chip === "hoje") handleFiltersChange({ ...initialFilters, query: "" });
    if (chip === "semana") handleFiltersChange({ ...initialFilters, status: "RISCO" });
    if (chip === "risco") handleFiltersChange({ ...initialFilters, status: "RISCO" });
    // Scroll suave para a tabela
    setTimeout(
      () =>
        document
          .getElementById("contratos-table")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  };

  const chips = [
    {
      key: "hoje" as const,
      label: "Vence hoje",
      count: chipCounts.hoje,
      color: "#7f1d1d",
      bg: "#fef2f2",
    },
    {
      key: "semana" as const,
      label: "Esta semana",
      count: chipCounts.semana,
      color: "#dc2626",
      bg: "#fef2f2",
    },
    {
      key: "risco" as const,
      label: "Em risco",
      count: chipCounts.risco,
      color: "#d97706",
      bg: "#fffbeb",
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: "Gestão" }, { label: "Contratos" }]} />
      <PageHeader
        title="Contratos"
        subtitle="Todos os contratos de experiência da carteira."
        right={
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-md text-[13px] font-medium text-white"
            style={{ background: "#071040" }}
          >
            Exportar CSV
          </button>
        }
      />

      {/* Chips de filtro rápido */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {chips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => applyChip(chip.key)}
            disabled={chip.count === 0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all hover:shadow-sm active:scale-95"
            style={{
              background: chip.count > 0 ? chip.bg : "#f8fafc",
              color: chip.count > 0 ? chip.color : "#94a3b8",
              border: `1px solid ${chip.count > 0 ? chip.color + "40" : "#e2e5f0"}`,
              cursor: chip.count > 0 ? "pointer" : "default",
            }}
          >
            <span
              className="inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{
                width: 18,
                height: 18,
                background: chip.count > 0 ? chip.color : "#cbd5e1",
                minWidth: 18,
              }}
            >
              {chip.count}
            </span>
            {chip.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[11px]" style={{ color: "#94a3b8" }}>
          Ctrl+K para busca global
        </span>
      </div>

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
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nomeFantasia}
              </option>
            ))}
          </select>
        </div>

        <ContratosFilters
          contratos={base}
          total={base.length}
          filtered={filtered.length}
          value={filters}
          onChange={handleFiltersChange}
        />

        <div className="flex items-center gap-3 mb-2">
          <span className="text-[12px]" style={{ color: "#64748b" }}>
            Exibindo <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> de{" "}
            {base.length} contratos
          </span>
          {anyFilter && (
            <button
              onClick={handleClearAll}
              className="text-[12px] px-2 py-0.5 rounded transition-colors hover:bg-red-50"
              style={{ color: "#ef4444", border: "1px solid #fecaca" }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div id="contratos-table">
          <ContratosTable
            contratos={filtered}
            expandable
            onClearFilters={handleClearAll}
            caption="Contratos filtrados"
          />
        </div>
      </Surface>
    </div>
  );
}
