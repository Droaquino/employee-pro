import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore } from "@/store/appStore";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — Arbrent" },
      { name: "description", content: "Histórico de ações realizadas no sistema." },
    ],
  }),
  component: HistoricoPage,
});

const TIPO_LABEL: Record<string, { label: string; cor: string }> = {
  EMPRESA_CRIADA: { label: "Empresa criada", cor: "#22c55e" },
  EMPRESA_EDITADA: { label: "Empresa editada", cor: "#4f8ef7" },
  EMPRESA_REMOVIDA: { label: "Empresa removida", cor: "#ef4444" },
  EMPRESA_ATIVADA: { label: "Empresa ativada", cor: "#22c55e" },
  EMPRESA_DESATIVADA: { label: "Empresa desativada", cor: "#94a3b8" },
  CONTRATO_ENCERRADO: { label: "Contrato encerrado", cor: "#7f1d1d" },
};

function HistoricoPage() {
  const historico = useAppStore((s) => s.historico);

  return (
    <div>
      <Breadcrumb items={[{ label: "Operacional" }, { label: "Histórico" }]} />
      <PageHeader title="Histórico de ações" subtitle="Registro das alterações realizadas durante esta sessão." />
      <Surface>
        {historico.length === 0 ? (
          <EmptyState icon="empty" title="Nenhuma ação registrada" subtitle="Ações realizadas no sistema aparecerão aqui." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "#e2e5f0" }}>
            {historico.map((ev) => {
              const meta = TIPO_LABEL[ev.tipo] ?? { label: ev.tipo, cor: "#64748b" };
              return (
                <li key={ev.id} className="py-3 flex items-start gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: meta.cor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px]" style={{ color: "#0f172a" }}>{ev.descricao}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                      <span style={{ color: meta.cor, fontWeight: 600 }}>{meta.label}</span>
                      {" · "}
                      {format(parseISO(ev.at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Surface>
    </div>
  );
}
