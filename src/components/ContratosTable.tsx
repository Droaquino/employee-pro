import React, { useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
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

// Cores do semáforo conforme spec (distintas das badges)
const SEMAFORO: Record<string, string> = {
  VIGENTE: "#16a34a",
  PROXIMO: "#d97706",
  RISCO:   "#dc2626",
  VENCIDO: "#7f1d1d",
};

export function ContratosTable({ contratos, selectable, selected = [], onSelectionChange, onClearFilters, caption, expandable }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("diasRestantes");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [feedbackRow, setFeedbackRow] = useState<string | null>(null);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleAction = (id: string, label: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFeedbackRow(id);
    toast.success(`Decisão registrada: ${label}`);
    timerRef.current = setTimeout(() => {
      setFeedbackRow(null);
      setExpanded(null);
    }, 1000);
  };

  const totalCols = 9 + (selectable ? 1 : 0);

  return (
    <div className="overflow-x-auto">
      <table className="text-[12px] w-full" aria-label={caption ?? "Lista de contratos"}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr style={{ color: "#64748b", textAlign: "left" }}>
            {/* Coluna semáforo — sem header, 6px */}
            <th style={{ width: 6, padding: 0 }} aria-hidden />
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
          {rows.map(({ c, info }) => {
            const isExpanded = expandable && expanded === c.id;
            const isFeedback = feedbackRow === c.id;
            const semaforoColor = SEMAFORO[info.status];

            return (
              <React.Fragment key={c.id}>
                <tr
                  onClick={expandable ? () => { if (!isFeedback) setExpanded(expanded === c.id ? null : c.id); } : undefined}
                  style={{
                    borderTop: "1px solid #e2e5f0",
                    background: isFeedback ? "#dcfce7" : selected.includes(c.id) ? "#f0f5ff" : undefined,
                    cursor: expandable ? "pointer" : undefined,
                    transition: "background 0.4s",
                  }}
                >
                  {/* Barra semáforo vertical */}
                  <td
                    style={{ width: 6, padding: 0, background: semaforoColor }}
                    className={info.status === "VENCIDO" ? "animate-pulse" : undefined}
                    aria-hidden
                  />
                  {selectable && (
                    <Td>
                      <input type="checkbox" aria-label={`Selecionar ${c.funcionarioNome}`} checked={selected.includes(c.id)} onChange={(e) => { e.stopPropagation(); toggleOne(c.id); }} />
                    </Td>
                  )}
                  <Td>
                    <div className="flex items-center gap-2">
                      {isFeedback && <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>}
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

                {/* Painel expansível */}
                {isExpanded && (
                  <tr style={{ background: "#f8fafc" }}>
                    <td colSpan={totalCols} className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-3 max-w-2xl">
                        {/* Linha do tempo */}
                        <div className="flex items-center gap-1.5 text-[12px] flex-wrap" style={{ color: "#64748b" }}>
                          <span>Admissão <strong style={{ color: "#0f172a" }}>{format(parseISO(c.dataAdmissao), "dd/MM/yyyy")}</strong></span>
                          <span style={{ color: "#cbd5e1" }}>→</span>
                          <span>1ª Prorr. <strong style={{ color: "#0f172a" }}>{format(parseISO(c.vencimentoPrimeiro), "dd/MM/yyyy")}</strong></span>
                          <span style={{ color: "#cbd5e1" }}>→</span>
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-white" style={{ background: "#071040" }}>HOJE</span>
                          <span style={{ color: "#cbd5e1" }}>→</span>
                          <span>2ª Prorr. <strong style={{ color: info.status === "VENCIDO" ? "#dc2626" : "#0f172a" }}>{format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy")}</strong></span>
                        </div>

                        {/* Textarea observação */}
                        <textarea
                          rows={2}
                          placeholder="Registrar observação..."
                          value={observations[c.id] ?? ""}
                          onChange={(e) => setObservations((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 rounded-md text-[12px] resize-none outline-none"
                          style={{ border: "1px solid #e2e5f0", background: "#fff" }}
                        />

                        {/* Botões de ação */}
                        <div className="flex items-center gap-2">
                          {(
                            [
                              { label: "Efetivar", bg: "#16a34a" },
                              { label: "Não renovar", bg: "#dc2626" },
                              { label: "Aguardar", bg: "#d97706" },
                            ] as const
                          ).map(({ label, bg }) => (
                            <button
                              key={label}
                              onClick={(e) => { e.stopPropagation(); handleAction(c.id, label); }}
                              className="px-3 py-1.5 rounded-md text-[12px] font-medium text-white hover:opacity-90 transition-opacity"
                              style={{ background: bg }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
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
