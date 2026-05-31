import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useContratos } from "@/hooks/useContratos";
import { calcStatus } from "@/hooks/useStatusContrato";
import { STATUS_COLOR } from "@/constants/colors";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";

const SEMAFORO: Record<string, string> = {
  VIGENTE: "#16a34a",
  PROXIMO: "#d97706",
  RISCO: "#dc2626",
  VENCIDO: "#7f1d1d",
};

export const Route = createFileRoute("/cliente/$id/painel")({
  head: () => ({ meta: [{ title: "Painel do cliente — Arbrent" }] }),
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: PainelCliente,
});

function PainelCliente() {
  const { id } = Route.useParams();
  const { data: empresas = [] } = useEmpresas();
  const empresa = empresas.find((e) => e.id === id);
  const { data: allContratos = [] } = useContratos();
  const todos = useMemo(
    () => allContratos.filter((c) => c.empresaId === id && !c.encerrado),
    [allContratos, id],
  );

  if (!empresa) throw notFound();

  const ativos = todos.map((c) => ({ c, info: calcStatus(c) }));
  const hoje = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const counts = { VIGENTE: 0, PROXIMO: 0, RISCO: 0, VENCIDO: 0 };
  for (const { info } of ativos) counts[info.status]++;
  const total = ativos.length;
  const decisoes = counts.RISCO + counts.VENCIDO + counts.PROXIMO;

  const pieData = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name:
        k === "VIGENTE"
          ? "Vigente"
          : k === "PROXIMO"
            ? "Próximo do vencimento"
            : k === "RISCO"
              ? "Em risco"
              : "Vencido",
      value: v,
      key: k,
    }));

  const sorted = [...ativos].sort((a, b) => a.info.diasRestantes - b.info.diasRestantes);

  return (
    <>
      {/* CSS @media print inline */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>

      <div
        className="min-h-screen"
        style={{ background: "#fff", fontFamily: "system-ui, sans-serif" }}
      >
        <div className="max-w-3xl mx-auto px-8 py-10">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div
                className="text-[11px] font-semibold tracking-widest uppercase mb-1"
                style={{ color: "#64748b" }}
              >
                Arbrent Contabilidade
              </div>
              <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>
                {empresa.razaoSocial}
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: "#64748b" }}>
                Relatório de Contratos de Experiência
              </p>
            </div>
            <div className="text-right no-print">
              <p className="text-[12px] mb-3" style={{ color: "#64748b" }}>
                {hoje}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#071040" }}
                >
                  Imprimir / Exportar PDF
                </button>
                <Link
                  to="/empresas/$id"
                  params={{ id }}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors hover:bg-slate-100"
                  style={{ border: "1px solid #e2e5f0", color: "#64748b" }}
                >
                  ← Voltar ao sistema
                </Link>
              </div>
            </div>
            <div className="text-right" style={{ display: "none" }}>
              <p className="text-[12px]" style={{ color: "#64748b" }}>
                {hoje}
              </p>
            </div>
          </div>

          {/* Frase resumo */}
          <div
            className="mb-8 p-5 rounded-lg"
            style={{ background: "#f8fafc", borderLeft: "4px solid #071040" }}
          >
            <p className="text-[15px] leading-relaxed" style={{ color: "#0f172a" }}>
              {total === 0 ? (
                "Nenhum colaborador em contrato de experiência ativo."
              ) : (
                <>
                  Você tem{" "}
                  <strong>
                    {total} colaborador{total !== 1 ? "es" : ""}
                  </strong>{" "}
                  em contrato de experiência.{" "}
                  {decisoes > 0 ? (
                    <>
                      <strong>
                        {decisoes} decisão{decisoes !== 1 ? "ões precisam" : " precisa"} ser tomada
                        {decisoes !== 1 ? "s" : ""}
                      </strong>{" "}
                      este mês.
                    </>
                  ) : (
                    "Todos os contratos estão em dia."
                  )}
                </>
              )}
            </p>
          </div>

          {/* Gráfico rosca */}
          {pieData.length > 0 && (
            <div className="mb-8">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.key} fill={STATUS_COLOR[d.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} contrato${value !== 1 ? "s" : ""} (${((value / (total || 1)) * 100).toFixed(0)}% da carteira)`,
                      name,
                    ]}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e5f0",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 justify-center mt-1">
                {pieData.map((d) => (
                  <div
                    key={d.key}
                    className="flex items-center gap-1.5 text-[12px]"
                    style={{ color: "#0f172a" }}
                  >
                    <span
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 3,
                        background: STATUS_COLOR[d.key],
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    {d.name} · <span style={{ color: "#64748b" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de colaboradores */}
          <div>
            <h2
              className="text-[11px] font-semibold tracking-widest uppercase mb-3"
              style={{ color: "#64748b", borderBottom: "1px solid #e2e5f0", paddingBottom: 6 }}
            >
              Colaboradores
            </h2>
            {sorted.length === 0 ? (
              <p className="text-[13px]" style={{ color: "#64748b" }}>
                Nenhum colaborador com contrato ativo.
              </p>
            ) : (
              <div className="space-y-2">
                {sorted.map(({ c, info }) => {
                  const cor = SEMAFORO[info.status];
                  const alerta = info.diasRestantes <= 7;
                  const textoVenc =
                    info.diasRestantes < 0
                      ? `vencido há ${Math.abs(info.diasRestantes)} dia${Math.abs(info.diasRestantes) !== 1 ? "s" : ""}`
                      : info.diasRestantes === 0
                        ? "vence hoje"
                        : `vence em ${info.diasRestantes} dia${info.diasRestantes !== 1 ? "s" : ""}`;

                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 py-2"
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cor }} />
                      <span
                        className="text-[13px] font-medium w-48 shrink-0"
                        style={{ color: "#0f172a" }}
                      >
                        {c.funcionarioNome}
                      </span>
                      <span className="text-[12px] flex-1" style={{ color: "#64748b" }}>
                        {c.cargo}
                      </span>
                      <span
                        className="text-[12px]"
                        style={{ color: cor, fontWeight: alerta ? 600 : 400 }}
                      >
                        {textoVenc}
                      </span>
                      {alerta && <span style={{ color: "#d97706" }}>⚠</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div
            className="mt-10 pt-4 text-[11px] text-center"
            style={{ borderTop: "1px solid #e2e5f0", color: "#94a3b8" }}
          >
            Relatório gerado em {hoje} · Arbrent Contabilidade · {empresa.nomeFantasia}
          </div>
        </div>
      </div>
    </>
  );
}
