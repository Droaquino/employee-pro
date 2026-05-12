import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO, startOfDay, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore } from "@/store/appStore";
import { toCsv, downloadCsv, csvDateStamp } from "@/lib/csv";
import { calcStatus } from "@/hooks/useStatusContrato";
import { STATUS_LABEL } from "@/constants/colors";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Arbrent" },
      { name: "description", content: "Relatórios consolidados da carteira." },
    ],
  }),
  component: Relatorios,
});

function Relatorios() {
  const empresas = useAppStore((s) => s.empresas);
  const contratos = useAppStore((s) => s.contratos);

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const periodo = useMemo(() => {
    const start = inicio ? startOfDay(parseISO(inicio)) : null;
    const end = fim ? startOfDay(parseISO(fim)) : null;
    return { start, end };
  }, [inicio, fim]);

  const inPeriodo = (iso: string) => {
    if (!periodo.start && !periodo.end) return true;
    const d = startOfDay(parseISO(iso));
    if (periodo.start && periodo.end) return isWithinInterval(d, { start: periodo.start, end: periodo.end });
    if (periodo.start) return d >= periodo.start;
    if (periodo.end) return d <= periodo.end;
    return true;
  };

  const empresaNome = (id: string) => empresas.find((e) => e.id === id)?.nomeFantasia ?? "—";

  // Rel 1: contratos por mês de vencimento
  const rel1 = useMemo(() => {
    const filtered = contratos.filter((c) => !c.encerrado && inPeriodo(c.vencimentoSegundo));
    const grupos = new Map<string, typeof filtered>();
    for (const c of filtered) {
      const key = format(parseISO(c.vencimentoSegundo), "yyyy-MM");
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(c);
    }
    return Array.from(grupos.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [contratos, periodo]);

  // Rel 2: encerramentos
  const rel2 = useMemo(() => contratos.filter((c) => c.encerrado && inPeriodo(c.vencimentoSegundo)), [contratos, periodo]);

  // Rel 3: resumo por empresa
  const rel3 = useMemo(() => empresas.map((e) => {
    const lista = contratos.filter((c) => c.empresaId === e.id && inPeriodo(c.vencimentoSegundo));
    const totals = { total: lista.length, VIGENTE: 0, PROXIMO: 0, RISCO: 0, VENCIDO: 0, encerrados: 0 };
    for (const c of lista) {
      if (c.encerrado) totals.encerrados++;
      else totals[calcStatus(c).status]++;
    }
    return { empresa: e, ...totals };
  }), [empresas, contratos, periodo]);

  const exportRel1 = () => {
    const rows = rel1.flatMap(([mes, list]) => list.map((c) => ({
      Mes: format(parseISO(mes + "-01"), "MMM/yyyy", { locale: ptBR }),
      Empresa: empresaNome(c.empresaId),
      Funcionario: c.funcionarioNome,
      Cargo: c.cargo,
      Vencimento: format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy"),
      Status: STATUS_LABEL[calcStatus(c).status],
    })));
    downloadCsv(`relatorio_vencimentos_${csvDateStamp()}.csv`, toCsv(rows));
  };

  const exportRel2 = () => {
    const rows = rel2.map((c) => ({
      Empresa: empresaNome(c.empresaId),
      Funcionario: c.funcionarioNome,
      Cargo: c.cargo,
      Admissao: format(parseISO(c.dataAdmissao), "dd/MM/yyyy"),
      Vencimento: format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy"),
      Motivo: c.motivoEncerramento ?? "—",
    }));
    downloadCsv(`relatorio_encerramentos_${csvDateStamp()}.csv`, toCsv(rows));
  };

  const exportRel3 = () => {
    const rows = rel3.map((r) => ({
      Empresa: r.empresa.nomeFantasia,
      CNPJ: r.empresa.cnpj,
      Total: r.total,
      Vigente: r.VIGENTE,
      Proximo: r.PROXIMO,
      EmRisco: r.RISCO,
      Vencido: r.VENCIDO,
      Encerrados: r.encerrados,
    }));
    downloadCsv(`relatorio_empresas_${csvDateStamp()}.csv`, toCsv(rows));
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Operacional" }, { label: "Relatórios" }]} />
      <PageHeader title="Relatórios" subtitle="Visões consolidadas e exportáveis para análise estratégica." />

      <Surface className="mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-[12px]" style={{ color: "#0f172a" }}>
            Início
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="ml-2 px-2 py-1.5 rounded text-[12px]" style={{ border: "1px solid #e2e5f0" }} />
          </label>
          <label className="text-[12px]" style={{ color: "#0f172a" }}>
            Fim
            <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="ml-2 px-2 py-1.5 rounded text-[12px]" style={{ border: "1px solid #e2e5f0" }} />
          </label>
          {(inicio || fim) && (
            <button onClick={() => { setInicio(""); setFim(""); }} className="text-[12px]" style={{ color: "#ef4444" }}>Limpar período</button>
          )}
        </div>
      </Surface>

      <Surface title="Contratos por mês de vencimento" className="mb-4">
        <div className="flex justify-end mb-2">
          <ExportBtn onClick={exportRel1} />
        </div>
        {rel1.length === 0 ? (
          <EmptyState icon="inbox" title="Sem contratos no período" subtitle="Ajuste o filtro de período acima." />
        ) : (
          <table className="text-[12px] w-full" aria-label="Contratos por mês">
            <thead><tr style={{ color: "#64748b", textAlign: "left" }}>
              <Th>Mês</Th><Th>Quantidade</Th><Th>Empresas distintas</Th>
            </tr></thead>
            <tbody>
              {rel1.map(([mes, list]) => (
                <tr key={mes} style={{ borderTop: "1px solid #e2e5f0" }}>
                  <Td>{format(parseISO(mes + "-01"), "MMMM/yyyy", { locale: ptBR })}</Td>
                  <Td>{list.length}</Td>
                  <Td>{new Set(list.map((c) => c.empresaId)).size}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Surface>

      <Surface title="Efetivações e encerramentos" className="mb-4">
        <div className="flex justify-end mb-2"><ExportBtn onClick={exportRel2} /></div>
        {rel2.length === 0 ? (
          <EmptyState icon="inbox" title="Nenhum encerramento no período" />
        ) : (
          <table className="text-[12px] w-full" aria-label="Encerramentos">
            <thead><tr style={{ color: "#64748b", textAlign: "left" }}>
              <Th>Funcionário</Th><Th>Empresa</Th><Th>Vencimento</Th><Th>Motivo</Th>
            </tr></thead>
            <tbody>
              {rel2.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid #e2e5f0" }}>
                  <Td>{c.funcionarioNome}</Td>
                  <Td>{empresaNome(c.empresaId)}</Td>
                  <Td>{format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy")}</Td>
                  <Td>{c.motivoEncerramento ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Surface>

      <Surface title="Resumo por empresa">
        <div className="flex justify-end mb-2"><ExportBtn onClick={exportRel3} /></div>
        <table className="text-[12px] w-full" aria-label="Resumo por empresa">
          <thead><tr style={{ color: "#64748b", textAlign: "left" }}>
            <Th>Empresa</Th><Th>Total</Th><Th>Vigentes</Th><Th>Próximos</Th><Th>Em risco</Th><Th>Vencidos</Th><Th>Encerrados</Th>
          </tr></thead>
          <tbody>
            {rel3.map((r) => (
              <tr key={r.empresa.id} style={{ borderTop: "1px solid #e2e5f0" }}>
                <Td>{r.empresa.nomeFantasia}</Td>
                <Td>{r.total}</Td>
                <Td>{r.VIGENTE}</Td>
                <Td>{r.PROXIMO}</Td>
                <Td>{r.RISCO}</Td>
                <Td>{r.VENCIDO}</Td>
                <Td>{r.encerrados}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>
    </div>
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
function Td({ children }: { children: React.ReactNode }) { return <td className="py-2.5 px-3 align-middle">{children}</td>; }
