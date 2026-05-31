import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useContratos } from "@/hooks/useContratos";
import { calcStatus, maskCpf } from "@/hooks/useStatusContrato";
import { Vencimentos30DiasChart } from "@/components/charts/Vencimentos30DiasChart";
import { formatDiasRestantes } from "@/lib/format";
import type { Contrato } from "@/data/mock";

export const Route = createFileRoute("/proximos-vencimentos")({
  head: () => ({
    meta: [
      { title: "Próximos vencimentos — Arbrent" },
      { name: "description", content: "Contratos com vencimento nos próximos 30 dias agrupados por semana." },
    ],
  }),
  component: Proximos,
});

type Decisao = "EFETIVAR" | "NAO_RENOVAR" | "AGUARDAR";
type Avaliacao = { obs: string; decisao: Decisao; data: string };

function bucketLabel(dias: number): string {
  if (dias <= 7) return "Esta semana";
  if (dias <= 14) return "Próxima semana";
  if (dias <= 21) return "Em 2 semanas";
  return "Em 3–4 semanas";
}
const BUCKETS = ["Esta semana", "Próxima semana", "Em 2 semanas", "Em 3–4 semanas"];

function Proximos() {
  const { data: empresas = [] } = useEmpresas();
  const { data: contratos = [] } = useContratos();
  const [avaliacoes, setAvaliacoes] = useState<Record<string, Avaliacao>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const lista = useMemo(() => {
    const hoje = startOfDay(new Date());
    return contratos
      .filter((c) => !c.encerrado)
      .map((c) => ({ c, dias: differenceInCalendarDays(startOfDay(parseISO(c.vencimentoSegundo)), hoje) }))
      .filter(({ dias }) => dias >= 0 && dias <= 30)
      .sort((a, b) => a.dias - b.dias);
  }, [contratos]);

  const grupos = useMemo(() => {
    const m = new Map<string, typeof lista>();
    for (const b of BUCKETS) m.set(b, []);
    for (const item of lista) m.get(bucketLabel(item.dias))!.push(item);
    return Array.from(m.entries()).filter(([, v]) => v.length > 0);
  }, [lista]);

  const empresaNome = (id: string) => empresas.find((e) => e.id === id)?.nomeFantasia ?? "—";

  useEffect(() => {
    document.title = lista.length > 0 ? `${lista.length} próximos · Arbrent` : "Próximos vencimentos · Arbrent";
  }, [lista.length]);

  return (
    <div>
      <Breadcrumb items={[{ label: "Alertas" }, { label: "Próximos vencimentos" }]} />
      <PageHeader title="Próximos vencimentos" subtitle={`${lista.length} contrato(s) com vencimento nos próximos 30 dias.`} />

      <Surface title="Distribuição dos vencimentos (próximos 30 dias)" className="mb-4">
        <Vencimentos30DiasChart contratos={contratos} />
      </Surface>

      {grupos.length === 0 ? (
        <Surface><EmptyState icon="inbox" title="Nenhum vencimento próximo" subtitle="Não há contratos vencendo nos próximos 30 dias." /></Surface>
      ) : (
        grupos.map(([label, items]) => (
          <Surface key={label} title={`${label} · ${items.length}`} className="mb-4">
            <table className="text-[12px] w-full" aria-label={`Vencimentos ${label}`}>
              <thead><tr style={{ color: "#64748b", textAlign: "left" }}>
                <Th>Funcionário</Th><Th>CPF</Th><Th>Empresa</Th><Th>Vencimento</Th><Th>Restantes</Th><Th>Avaliação</Th>
              </tr></thead>
              <tbody>
                {items.map(({ c, dias }) => {
                  const f = formatDiasRestantes(dias);
                  const av = avaliacoes[c.id];
                  const isOpen = openId === c.id;
                  return (
                    <RowAvaliacao
                      key={c.id}
                      c={c}
                      dias={dias}
                      formatStr={f}
                      empresaNome={empresaNome(c.empresaId)}
                      avaliacao={av}
                      isOpen={isOpen}
                      onToggle={() => setOpenId(isOpen ? null : c.id)}
                      onSave={(novoAv) => { setAvaliacoes((prev) => ({ ...prev, [c.id]: novoAv })); setOpenId(null); }}
                    />
                  );
                })}
              </tbody>
            </table>
          </Surface>
        ))
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">{children}</th>; }
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) { return <td colSpan={colSpan} className="py-2.5 px-3 align-middle">{children}</td>; }

function RowAvaliacao({
  c, dias, formatStr, empresaNome, avaliacao, isOpen, onToggle, onSave,
}: {
  c: Contrato;
  dias: number;
  formatStr: { texto: string; cor: string; bold: boolean };
  empresaNome: string;
  avaliacao?: Avaliacao;
  isOpen: boolean;
  onToggle: () => void;
  onSave: (a: Avaliacao) => void;
}) {
  const [obs, setObs] = useState(avaliacao?.obs ?? "");
  const [decisao, setDecisao] = useState<Decisao>(avaliacao?.decisao ?? "AGUARDAR");
  const _status = calcStatus(c).status; // calcula em runtime

  return (
    <>
      <tr style={{ borderTop: "1px solid #e2e5f0" }}>
        <Td>{c.funcionarioNome}</Td>
        <Td>{maskCpf(c.funcionarioCpf)}</Td>
        <Td>{empresaNome}</Td>
        <Td>{format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy")}</Td>
        <Td><span style={{ color: formatStr.cor, fontWeight: formatStr.bold ? 600 : 400 }}>{formatStr.texto}</span></Td>
        <Td>
          {avaliacao ? (
            <span className="inline-flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "#f0f5ff", color: "#071040" }}>{decisaoLabel(avaliacao.decisao)}</span>
              <button onClick={onToggle} className="text-[11px]" style={{ color: "#4f8ef7" }}>Editar</button>
            </span>
          ) : (
            <button onClick={onToggle} className="text-[11px] px-2 py-1 rounded text-white" style={{ background: "#071040" }}>Registrar avaliação</button>
          )}
        </Td>
      </tr>
      {isOpen && (
        <tr style={{ background: "#f7f8fc" }}>
          <Td colSpan={6}>
            <div className="flex flex-col gap-2 py-2">
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Observação livre sobre o desempenho/decisão…"
                rows={2}
                className="px-2 py-1.5 text-[12px] rounded outline-none"
                style={{ border: "1px solid #e2e5f0", background: "#fff" }}
              />
              <div className="flex items-center gap-2 flex-wrap">
                {(["EFETIVAR", "NAO_RENOVAR", "AGUARDAR"] as Decisao[]).map((d) => (
                  <button key={d} onClick={() => setDecisao(d)}
                    className="text-[11px] px-2.5 py-1 rounded-full"
                    style={{
                      background: decisao === d ? "#071040" : "transparent",
                      color: decisao === d ? "#fff" : "#071040",
                      border: "1px solid #071040",
                    }}>
                    {decisaoLabel(d)}
                  </button>
                ))}
                <div className="flex-1" />
                <button onClick={onToggle} className="text-[11px]" style={{ color: "#64748b" }}>Cancelar</button>
                <button
                  disabled={!obs.trim()}
                  onClick={() => onSave({ obs: obs.trim(), decisao, data: format(new Date(), "yyyy-MM-dd") })}
                  className="text-[11px] px-3 py-1 rounded text-white"
                  style={{ background: obs.trim() ? "#071040" : "#94a3b8" }}>
                  Salvar
                </button>
              </div>
              {avaliacao && <div className="text-[11px]" style={{ color: "#64748b" }}>Última avaliação: {avaliacao.data}</div>}
            </div>
          </Td>
        </tr>
      )}
    </>
  );
}

function decisaoLabel(d: Decisao) {
  return d === "EFETIVAR" ? "Efetivar" : d === "NAO_RENOVAR" ? "Não renovar" : "Aguardar";
}
