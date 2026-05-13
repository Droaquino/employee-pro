import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { responsaveis } from "@/data/mock";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Arbrent" },
      { name: "description", content: "Parâmetros do sistema e responsáveis." },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [risco, setRisco] = useState(15);
  const [proximo, setProximo] = useState(30);
  const [notif, setNotif] = useState(true);

  return (
    <div>
      <Breadcrumb items={[{ label: "Operacional" }, { label: "Configurações" }]} />
      <PageHeader title="Configurações" subtitle="Parâmetros de operação e responsáveis pelo acompanhamento." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Surface title="Parâmetros de alerta">
          <div className="space-y-4 text-[13px]">
            <Row label="Dias para considerar 'em risco'" hint="Contratos com vencimento ≤ N dias">
              <input type="number" min={1} max={60} value={risco} onChange={(e) => setRisco(+e.target.value)}
                className="w-20 px-2 py-1.5 rounded-md text-[13px] outline-none" style={{ border: "1px solid #e2e5f0" }} />
            </Row>
            <Row label="Dias para 'próximo do vencimento'" hint="Contratos com vencimento ≤ N dias e > risco">
              <input type="number" min={1} max={120} value={proximo} onChange={(e) => setProximo(+e.target.value)}
                className="w-20 px-2 py-1.5 rounded-md text-[13px] outline-none" style={{ border: "1px solid #e2e5f0" }} />
            </Row>
            <Row label="Notificações ao abrir o sistema" hint="Exibir resumo de contratos em risco/vencidos">
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notif} onChange={(e) => setNotif(e.target.checked)} className="w-4 h-4" />
              </label>
            </Row>
            <p className="text-[11px]" style={{ color: "#94a3b8" }}>
              Estas configurações são persistidas apenas nesta sessão (versão demo).
            </p>
          </div>
        </Surface>

        <Surface title="Responsáveis">
          <ul className="divide-y text-[13px]" style={{ borderColor: "#e2e5f0" }}>
            {responsaveis.map((r) => (
              <li key={r.id} className="py-2.5 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white" style={{ background: "#071040" }}>
                  {r.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </span>
                <span className="flex-1">{r.nome}</span>
                <span className="text-[11px]" style={{ color: "#64748b" }}>Analista</span>
              </li>
            ))}
          </ul>
        </Surface>
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div style={{ color: "#0f172a", fontWeight: 500 }}>{label}</div>
        {hint && <div className="text-[11px]" style={{ color: "#64748b" }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
