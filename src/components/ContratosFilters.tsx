import { useMemo } from "react";
import { calcStatus } from "@/hooks/useStatusContrato";
import { STATUS_COLOR, STATUS_LABEL } from "@/constants/colors";
import type { Contrato } from "@/data/mock";

export type StatusFilter = "TODOS" | "VIGENTE" | "PROXIMO" | "RISCO" | "VENCIDO";

export type FiltersState = {
  query: string;
  status: StatusFilter;
  cargo: string;
};

export const initialFilters: FiltersState = { query: "", status: "TODOS", cargo: "" };

export function applyFilters(contratos: Contrato[], f: FiltersState): Contrato[] {
  const q = f.query.toLowerCase().trim();
  return contratos.filter((c) => {
    if (q && !c.funcionarioNome.toLowerCase().includes(q)) return false;
    if (f.cargo && c.cargo !== f.cargo) return false;
    if (f.status !== "TODOS") {
      if (c.encerrado) return false;
      if (calcStatus(c).status !== f.status) return false;
    }
    return true;
  });
}

export function hasActiveFilters(f: FiltersState): boolean {
  return f.query !== "" || f.status !== "TODOS" || f.cargo !== "";
}

type Props = {
  contratos: Contrato[];
  total: number;
  filtered: number;
  value: FiltersState;
  onChange: (next: FiltersState) => void;
};

export function ContratosFilters({ contratos, total, filtered, value, onChange }: Props) {
  const cargos = useMemo(() => Array.from(new Set(contratos.map((c) => c.cargo))).sort(), [contratos]);
  const active = hasActiveFilters(value);
  const statusOpts: StatusFilter[] = ["TODOS", "VIGENTE", "PROXIMO", "RISCO", "VENCIDO"];

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          aria-label="Buscar funcionário"
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Buscar funcionário…"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-md text-[13px] outline-none"
          style={{ border: "1px solid #e2e5f0", background: "#f0f2f8" }}
        />
        <select
          aria-label="Filtrar por cargo"
          value={value.cargo}
          onChange={(e) => onChange({ ...value, cargo: e.target.value })}
          className="px-3 py-2 rounded-md text-[13px] outline-none"
          style={{ border: "1px solid #e2e5f0", background: "#fff" }}
        >
          <option value="">Todos os cargos</option>
          {cargos.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-[12px]" style={{ color: "#64748b" }}>
          Exibindo <strong style={{ color: "#0f172a" }}>{filtered}</strong> de {total} contratos
        </span>
        {active && (
          <button
            onClick={() => onChange(initialFilters)}
            className="text-[12px] px-2 py-1 rounded"
            style={{ color: "#ef4444", border: "1px solid #fecaca" }}
          >
            Limpar filtros
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {statusOpts.map((s) => {
          const selected = value.status === s;
          const color = s === "TODOS" ? "#071040" : STATUS_COLOR[s];
          return (
            <button
              key={s}
              onClick={() => onChange({ ...value, status: s })}
              className="text-[11px] px-2.5 py-1 rounded-full transition-colors"
              style={{
                background: selected ? color : "transparent",
                color: selected ? "#fff" : color,
                border: `1px solid ${color}`,
              }}
            >
              {s === "TODOS" ? "Todos" : STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
