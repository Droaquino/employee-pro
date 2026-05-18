import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { acaoRecomendada, calcStatus, maskCpf } from "@/hooks/useStatusContrato";
import { STATUS_COLOR, STATUS_LABEL } from "@/constants/colors";
import { formatDiasRestantes } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import type { Contrato } from "@/data/mock";

type SortKey = "funcionarioNome" | "cargo" | "dataAdmissao" | "vencimentoSegundo" | "diasRestantes" | "status";
type SortDir = "asc" | "desc";

type Props = {
  contratos: Contrato[];
  selectable?: boolean;
  selected?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onClearFilters?: () => void;
  caption?: string;
  expandable?: boolean;
};

export function ContratosTable({ contratos, selectable, selected = [], onSelectionChange, onClearFilters, caption, expandable }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("diasRestantes");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const rows = useMemo(() => {
    const enriched = contratos.map((c) => ({ c, info: calcStatus(c) }));
    const dir = sortDir === "asc" ? 1 : -1;
    enriched.sort((a, b) => {
      const av: any = sortKey === "diasRestantes" ? a.info.diasRestantes : sortKey === "status" ? a.info.status : (a.c as any)[sortKey];
      const bv: any = sortKey === "diasRestantes" ? b.info.diasRestantes : sortKey === "status" ? b.info.status : (b.c as any)[sortKey];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return enriched;
  }, [contratos, sortKey, sortDir]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="Nenhum contrato encontrado"
        subtitle="Ajuste os filtros ou limpe-os para ver outros contratos."
        action={onClearFilters ? (
          <button onClick={onClearFilters} className="text-[12px] px-3 py-1.5 rounded-md text-white" style={{ background: "#071040" }}>
            Limpar filtros
          </button>
        ) : undefined}
      />
    );
  }

  const allIds = rows.map((r) => r.c.id);
  const allSelected = selectable && selected.length > 0 && selected.length === allIds.length;
  const toggleAll = () => onSelectionChange?.(allSelected ? [] : allIds);
  const toggleOne = (id: string) => onSelectionChange?.(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const headerSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div className="overflow-x-auto">
      <table className="text-[12px] w-full" aria-label={caption ?? "Lista de contratos"}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr style={{ color: "#64748b", textAlign: "left" }}>
            {selectable && (
              <Th>
                <input type="checkbox" aria-label="Selecionar todos" checked={!!allSelected} onChange={toggleAll} />
              </Th>
            )}
            <SortableTh label="Funcionário" k="funcionarioNome" sortKey={sortKey} sortDir={sortDir} onClick={headerSort} />
            <Th>CPF</Th>
            <SortableTh label="Cargo" k="cargo" sortKey={sortKey} sortDir={sortDir} onClick={headerSort} />
            <SortableTh label="Admissão" k="dataAdmissao" sortKey={sortKey} sortDir={sortDir} onClick={headerSort} />
            <SortableTh label="Vencimento 2ª" k="vencimentoSegundo" sortKey={sortKey} sortDir={sortDir} onClick={headerSort} />
            <SortableTh label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onClick={headerSort} />
            <SortableTh label="Dias restantes" k="diasRestantes" sortKey={sortKey} sortDir={sortDir} onClick={headerSort} />
            <Th>Ação recomendada</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ c, info }) => (
            <>
            <tr
              key={c.id}
              onClick={expandable ? () => setExpanded(expanded === c.id ? null : c.id) : undefined}
              style={{ borderTop: "1px solid #e2e5f0", background: selected.includes(c.id) ? "#f0f5ff" : undefined, cursor: expandable ? "pointer" : undefined }}
            >
              {selectable && (
                <Td>
                  <input type="checkbox" aria-label={`Selecionar ${c.funcionarioNome}`} checked={selected.includes(c.id)} onChange={(e) => { e.stopPropagation(); toggleOne(c.id); }} />
                </Td>
              )}
              <Td>
                <div className="flex items-center gap-2">
                  <span aria-hidden style={{ display: "inline-block", width: 6, height: 22, borderRadius: 2, background: STATUS_COLOR[info.status] }} />
                  <span>{c.funcionarioNome}</span>
                </div>
              </Td>
              <Td>{maskCpf(c.funcionarioCpf)}</Td>
              <Td>{c.cargo}</Td>
              <Td>{format(parseISO(c.dataAdmissao), "dd/MM/yyyy")}</Td>
              <Td>{format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy")}</Td>
              <Td>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: STATUS_COLOR[info.status] + "22", color: STATUS_COLOR[info.status] }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[info.status] }} />
                  {STATUS_LABEL[info.status]}
                </span>
              </Td>
              <Td>
                {(() => {
                  const f = formatDiasRestantes(info.diasRestantes);
                  return <span style={{ color: f.cor, fontWeight: f.bold ? 600 : 400 }}>{f.texto}</span>;
                })()}
              </Td>
              <Td>
                <span style={{ color: info.status === "VENCIDO" ? STATUS_COLOR.VENCIDO : info.status === "RISCO" ? STATUS_COLOR.RISCO : "#0f172a", fontWeight: info.status === "VENCIDO" || info.status === "RISCO" ? 600 : 400 }}>
                  {acaoRecomendada(info, c)}
                </span>
              </Td>
            </tr>
            {expandable && expanded === c.id && (
              <tr key={c.id + "-exp"} style={{ background: "#f8fafc" }}>
                <td colSpan={selectable ? 9 : 8} className="px-4 py-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
                    <ExpField label="1º vencimento" value={format(parseISO(c.vencimentoPrimeiro), "dd/MM/yyyy")} />
                    <ExpField label="2º vencimento" value={format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy")} />
                    <ExpField label="Salário" value={c.salario ? `R$ ${c.salario.toLocaleString("pt-BR")}` : "—"} />
                    <ExpField label="Observações" value={c.observacoes ?? "—"} />
                  </div>
                </td>
              </tr>
            )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="uppercase text-[10px] tracking-wider" style={{ color: "#64748b" }}>{label}</div>
      <div className="mt-1 text-[12px]" style={{ color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">{children}</th>;
}
function SortableTh({ label, k, sortKey, sortDir, onClick }: { label: string; k: SortKey; sortKey: SortKey; sortDir: SortDir; onClick: (k: SortKey) => void }) {
  const active = sortKey === k;
  return (
    <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">
      <button onClick={() => onClick(k)} className="inline-flex items-center gap-1 hover:underline" aria-label={`Ordenar por ${label}`}>
        {label}
        <span style={{ opacity: active ? 1 : 0.3, fontSize: 9 }}>{active && sortDir === "desc" ? "▼" : "▲"}</span>
      </button>
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-2.5 px-3 align-middle">{children}</td>;
}
