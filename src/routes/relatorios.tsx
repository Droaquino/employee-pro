import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO, startOfDay, startOfMonth, addMonths, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore } from "@/store/appStore";
import { toCsv, downloadCsv, csvDateStamp } from "@/lib/csv";
import { calcStatus } from "@/hooks/useStatusContrato";
import { STATUS_LABEL, STATUS_COLOR } from "@/constants/colors";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Arbrent" },
      { name: "description", content: "Relatórios consolidados da carteira." },
    ],
  }),
  component: Relatorios,
});

type Aba = "vencimentos" | "empresas" | "encerrados";

function Relatorios() {
  const empresas = useAppStore((s) => s.empresas);
  const contratos = useAppStore((s) => s.contratos);
  const [aba, setAba] = useState<Aba>("vencimentos");

  const empresaNome = (id: string) => empresas.find((e) => e.id === id)?.nomeFantasia ?? "—";

  // ===== Rel 1: próximos 4 meses, agrupado por mês =====
  const rel1 = useMemo(() => {
    const hoje = startOfDay(new Date());
    const limite = endOfMonth(addMonths(hoje, 3)); // próximos 4 meses
    const filtered = contratos
      .filter((c) => !c.encerrado)
      .filter((c) => {
        const v = parseISO(c.vencimentoSegundo);
        return v >= hoje && v <= limite;
      });
    const grupos = new Map<string, typeof filtered>();
    for (const c of filtered) {
      const key = format(parseISO(c.vencimentoSegundo), "yyyy-MM");
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(c);
    }
    return Array.from(grupos.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [contratos]);

  const exportRel1 = () => {
    const rows = rel1.flatMap(([mes, list]) =>
      list.map((c) => ({
        Mês: format(parseISO(mes + "-01"), "MMMM/yyyy", { locale: ptBR }),
        Empresa: empresaNome(c.empresaId),
        Funcionário: c.funcionarioNome,
        Cargo: c.cargo,
        "Data vencimento": format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy"),
        Status: STATUS_LABEL[calcStatus(c).status],
      })),
    );
    downloadCsv(`contratos_vencimento_${csvDateStamp()}.csv`, toCsv(rows));
  };

  // ===== Rel 2: resumo por empresa =====
  const rel2 = useMemo(
    () =>
      empresas.map((e) => {
        const lista = contratos.filter((c) => c.empresaId === e.id && !c.encerrado);
        const totals = { total: lista.length, VIGENTE: 0, PROXIMO: 0, RISCO: 0, VENCIDO: 0 };
        for (const c of lista) totals[calcStatus(c).status]++;
        const risco = totals.RISCO + totals.VENCIDO;
        const propRisco = totals.total > 0 ? risco / totals.total : 0;
        const sit: "verde" | "amarelo" | "vermelho" =
          propRisco >= 0.3 ? "vermelho" : propRisco > 0 || totals.PROXIMO / Math.max(totals.total, 1) >= 0.3 ? "amarelo" : "verde";
        return { empresa: e, ...totals, situacao: sit };
      }),
    [empresas, contratos],
  );

  const exportRel2 = () => {
    const rows = rel2.map((r) => ({
      Empresa: r.empresa.nomeFantasia,
      CNPJ: r.empresa.cnpj,
      "Total contratos": r.total,
      Vigentes: r.VIGENTE,
      Próximos: r.PROXIMO,
      "Em risco": r.RISCO,
      Vencidos: r.VENCIDO,
      Situação: r.situacao === "verde" ? "Saudável" : r.situacao === "amarelo" ? "Atenção" : "Crítico",
    }));
    downloadCsv(`resumo_empresas_${csvDateStamp()}.csv`, toCsv(rows));
  };

  // ===== Rel 3: encerrados com filtro mês/ano =====
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const rel3 = useMemo(() => {
    const start = inicio ? startOfMonth(parseISO(inicio + "-01")) : null;
    const end = fim ? endOfMonth(parseISO(fim + "-01")) : null;
    return contratos.filter((c) => {
      if (!c.encerrado) return false;
      if (!start && !end) return true;
      const d = parseISO(c.vencimentoSegundo);
      if (start && end) return isWithinInterval(d, { start, end });
      if (start) return d >= start;
      if (end) return d <= end;
      return true;
    });
  }, [contratos, inicio, fim]);

  const exportRel3 = () => {
    const rows = rel3.map((c) => ({
      Funcionário: c.funcionarioNome,
      Empresa: empresaNome(c.empresaId),
      Cargo: c.cargo,
      Admissão: format(parseISO(c.dataAdmissao), "dd/MM/yyyy"),
      Encerramento: format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy"),
      Motivo: c.motivoEncerramento ?? "—",
    }));
    downloadCsv(`contratos_encerrados_${csvDateStamp()}.csv`, toCsv(rows));
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Operacional" }, { label: "Relatórios" }]} />
      <PageHeader title="Relatórios" subtitle="Visões consolidadas e exportáveis para análise estratégica." />

      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "#e2e5f0" }}>
        <TabBtn label="Vencimentos" active={aba === "vencimentos"} onClick={() => setAba("vencimentos")} />
        <TabBtn label="Por empresa" active={aba === "empresas"} onClick={() => setAba("empresas")} />
        <TabBtn label="Encerrados" active={aba === "encerrados"} onClick={() => setAba("encerrados")} />
      </div>

      {aba === "vencimentos" && (
        <Surface title="Contratos a vencer nos próximos 4 meses">
          <div className="flex justify-end mb-2"><ExportBtn onClick={exportRel1} /></div>
          {rel1.length === 0 ? (
            <EmptyState icon="inbox" title="Sem contratos a vencer nos próximos 4 meses" />
          ) : (
            <table className="text-[12px] w-full table-fixed" aria-label="Contratos por vencimento">
              <thead><tr style={{ color: "#64748b", textAlign: "left" }}>
                <Th>Mês</Th><Th>Empresa</Th><Th>Funcionário</Th><Th>Cargo</Th><Th>Vencimento</Th><Th>Status</Th>
              </tr></thead>
              <tbody>
                {rel1.flatMap(([mes, list]) =>
                  list.map((c, i) => {
                    const st = calcStatus(c).status;
                    return (
                      <tr key={c.id} style={{ borderTop: "1px solid #e2e5f0" }}>
                        <Td>{i === 0 ? <strong>{format(parseISO(mes + "-01"), "MMM/yyyy", { locale: ptBR })}</strong> : ""}</Td>
                        <Td className="truncate">{empresaNome(c.empresaId)}</Td>
                        <Td className="truncate">{c.funcionarioNome}</Td>
                        <Td className="truncate">{c.cargo}</Td>
                        <Td>{format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy")}</Td>
                        <Td>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: STATUS_COLOR[st] + "22", color: STATUS_COLOR[st] }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[st] }} />
                            {STATUS_LABEL[st]}
                          </span>
                        </Td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          )}
        </Surface>
      )}

      {aba === "empresas" && (
        <Surface title="Resumo por empresa">
          <div className="flex justify-end mb-2"><ExportBtn onClick={exportRel2} /></div>
          <table className="text-[12px] w-full table-fixed" aria-label="Resumo por empresa">
            <thead><tr style={{ color: "#64748b", textAlign: "left" }}>
              <Th>Empresa</Th><Th>Total</Th><Th>Vigentes</Th><Th>Próximos</Th><Th>Em risco</Th><Th>Vencidos</Th><Th>Situação</Th>
            </tr></thead>
            <tbody>
              {rel2.map((r) => {
                const cor = r.situacao === "verde" ? "#22c55e" : r.situacao === "amarelo" ? "#f59e0b" : "#ef4444";
                const lbl = r.situacao === "verde" ? "Saudável" : r.situacao === "amarelo" ? "Atenção" : "Crítico";
                return (
                  <tr key={r.empresa.id} style={{ borderTop: "1px solid #e2e5f0" }}>
                    <Td className="truncate">{r.empresa.nomeFantasia}</Td>
                    <Td>{r.total}</Td>
                    <Td>{r.VIGENTE}</Td>
                    <Td>{r.PROXIMO}</Td>
                    <Td>{r.RISCO}</Td>
                    <Td>{r.VENCIDO}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: cor + "22", color: cor }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: cor }} />
                        {lbl}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Surface>
      )}

      {aba === "encerrados" && (
        <Surface title="Contratos encerrados">
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <label className="text-[12px]" style={{ color: "#0f172a" }}>
              Início
              <input type="month" value={inicio} onChange={(e) => setInicio(e.target.value)} className="ml-2 px-2 py-1.5 rounded text-[12px]" style={{ border: "1px solid #e2e5f0" }} />
            </label>
            <label className="text-[12px]" style={{ color: "#0f172a" }}>
              Fim
              <input type="month" value={fim} onChange={(e) => setFim(e.target.value)} className="ml-2 px-2 py-1.5 rounded text-[12px]" style={{ border: "1px solid #e2e5f0" }} />
            </label>
            {(inicio || fim) && (
              <button onClick={() => { setInicio(""); setFim(""); }} className="text-[12px]" style={{ color: "#ef4444" }}>Limpar período</button>
            )}
            <div className="ml-auto"><ExportBtn onClick={exportRel3} /></div>
          </div>
          {rel3.length === 0 ? (
            <EmptyState icon="inbox" title="Nenhum contrato encerrado no período" />
          ) : (
            <table className="text-[12px] w-full table-fixed" aria-label="Contratos encerrados">
              <thead><tr style={{ color: "#64748b", textAlign: "left" }}>
                <Th>Funcionário</Th><Th>Empresa</Th><Th>Cargo</Th><Th>Admissão</Th><Th>Encerramento</Th><Th>Motivo</Th>
              </tr></thead>
              <tbody>
                {rel3.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #e2e5f0" }}>
                    <Td className="truncate">{c.funcionarioNome}</Td>
                    <Td className="truncate">{empresaNome(c.empresaId)}</Td>
                    <Td className="truncate">{c.cargo}</Td>
                    <Td>{format(parseISO(c.dataAdmissao), "dd/MM/yyyy")}</Td>
                    <Td>{format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy")}</Td>
                    <Td className="truncate">{c.motivoEncerramento ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Surface>
      )}
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-[13px] font-medium transition-colors"
      style={{
        color: active ? "#071040" : "#64748b",
        borderBottom: active ? "2px solid #071040" : "2px solid transparent",
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  );
}

function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-[12px] px-3 py-1.5 rounded-md text-white inline-flex items-center gap-1.5" style={{ background: "#071040" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
      Exportar CSV
    </button>
  );
}
function Th({ children }: { children: React.ReactNode }) { return <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">{children}</th>; }
function Td({ children, className }: { children: React.ReactNode; className?: string }) { return <td className={`py-2.5 px-3 align-middle ${className ?? ""}`}>{children}</td>; }
