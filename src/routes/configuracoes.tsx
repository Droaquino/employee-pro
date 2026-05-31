import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { responsaveis as responsaveisSeed } from "@/data/mock";
import { useEmpresas } from "@/hooks/useEmpresas";
import { COLORS } from "@/constants/colors";

type Responsavel = { id: string; nome: string; cargo: string; email: string };

const seed: Responsavel[] = responsaveisSeed.map((r) => ({
  id: r.id,
  nome: r.nome,
  cargo: "Analista",
  email: `${r.nome.toLowerCase().split(" ")[0]}@arbrent.com.br`,
}));

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

  const { data: empresas = [] } = useEmpresas();
  const [lista, setLista] = useState<Responsavel[]>(seed);
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const vinculosPorResp = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const e of empresas) {
      const arr = m.get(e.responsavelId) ?? [];
      arr.push(e.nomeFantasia);
      m.set(e.responsavelId, arr);
    }
    return m;
  }, [empresas]);

  const adicionar = (r: Omit<Responsavel, "id">) => {
    const id = `u${Date.now().toString(36)}`;
    setLista((prev) => [...prev, { id, ...r }]);
    setAdicionando(false);
    setErro(null);
  };

  const salvarEdicao = (id: string, r: Omit<Responsavel, "id">) => {
    setLista((prev) => prev.map((x) => (x.id === id ? { id, ...r } : x)));
    setEditandoId(null);
    setErro(null);
  };

  const confirmarRemocao = (id: string) => {
    const vinculos = vinculosPorResp.get(id) ?? [];
    if (vinculos.length > 0) {
      setErro(
        `Não é possível remover: vinculado a ${vinculos.length} empresa(s) — ${vinculos.slice(0, 3).join(", ")}${vinculos.length > 3 ? "…" : ""}.`,
      );
      setRemovendoId(null);
      return;
    }
    setLista((prev) => prev.filter((r) => r.id !== id));
    setRemovendoId(null);
    setErro(null);
  };

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
              Configurações salvas automaticamente.
            </p>
          </div>
        </Surface>

        <Surface title="Responsáveis">
          <div className="flex items-center justify-end mb-3 -mt-2">
            {!adicionando && (
              <button
                type="button"
                onClick={() => { setAdicionando(true); setEditandoId(null); setErro(null); }}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-md px-2.5 py-1.5"
                style={{ background: COLORS.brand, color: "#fff" }}
                aria-label="Adicionar responsável"
              >
                <Plus size={14} /> Adicionar responsável
              </button>
            )}
          </div>
          {erro && (
            <div
              className="mb-2 rounded-md px-3 py-2 text-[12px]"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
              role="alert"
            >
              {erro}
            </div>
          )}

          {adicionando && (
            <FormResponsavel
              onCancel={() => setAdicionando(false)}
              onSave={adicionar}
            />
          )}

          <ul className="divide-y text-[13px]" style={{ borderColor: "#e2e5f0" }}>
            {lista.map((r) => {
              const editando = editandoId === r.id;
              const removendo = removendoId === r.id;
              const vinculos = (vinculosPorResp.get(r.id) ?? []).length;

              if (editando) {
                return (
                  <li key={r.id} className="py-2.5">
                    <FormResponsavel
                      initial={r}
                      onCancel={() => setEditandoId(null)}
                      onSave={(v) => salvarEdicao(r.id, v)}
                    />
                  </li>
                );
              }

              return (
                <li key={r.id} className="py-2.5 flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                    style={{ background: "#071040" }}
                  >
                    {r.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ color: COLORS.textPrimary }}>{r.nome}</div>
                    <div className="text-[11px] truncate" style={{ color: COLORS.textMuted }}>
                      {r.cargo} · {r.email}
                      {vinculos > 0 ? ` · ${vinculos} empresa(s)` : ""}
                    </div>
                  </div>

                  {removendo ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]" style={{ color: COLORS.textMuted }}>Remover?</span>
                      <button
                        type="button"
                        onClick={() => confirmarRemocao(r.id)}
                        aria-label="Confirmar remoção"
                        className="rounded p-1.5"
                        style={{ background: COLORS.risco, color: "#fff" }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemovendoId(null)}
                        aria-label="Cancelar remoção"
                        className="rounded p-1.5"
                        style={{ background: "#f1f5f9", color: COLORS.textPrimary }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setEditandoId(r.id); setAdicionando(false); setErro(null); }}
                        aria-label={`Editar ${r.nome}`}
                        title="Editar"
                        className="p-1.5 rounded hover:bg-slate-100"
                        style={{ color: COLORS.textMuted }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRemovendoId(r.id); setErro(null); }}
                        aria-label={`Remover ${r.nome}`}
                        title="Remover"
                        className="p-1.5 rounded hover:bg-slate-100"
                        style={{ color: COLORS.risco }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Surface>
      </div>
    </div>
  );
}

function FormResponsavel({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Responsavel;
  onCancel: () => void;
  onSave: (r: Omit<Responsavel, "id">) => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [cargo, setCargo] = useState(initial?.cargo ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [erro, setErro] = useState<string | null>(null);

  const submit = () => {
    const n = nome.trim();
    const c = cargo.trim();
    const e = email.trim();
    if (!n || n.length > 100) return setErro("Nome obrigatório (até 100 caracteres).");
    if (!c || c.length > 60) return setErro("Cargo obrigatório (até 60 caracteres).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 255) return setErro("E-mail inválido.");
    onSave({ nome: n, cargo: c, email: e });
  };

  return (
    <div
      className="rounded-md p-3 mb-2 space-y-2"
      style={{ background: "#f8fafc", border: "1px solid #e2e5f0" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome completo"
          aria-label="Nome completo"
          maxLength={100}
          className="px-2 py-1.5 rounded-md text-[13px] outline-none bg-white"
          style={{ border: "1px solid #e2e5f0" }}
        />
        <input
          type="text"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          placeholder="Cargo"
          aria-label="Cargo"
          maxLength={60}
          className="px-2 py-1.5 rounded-md text-[13px] outline-none bg-white"
          style={{ border: "1px solid #e2e5f0" }}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          aria-label="E-mail"
          maxLength={255}
          className="px-2 py-1.5 rounded-md text-[13px] outline-none bg-white"
          style={{ border: "1px solid #e2e5f0" }}
        />
      </div>
      {erro && <div className="text-[11px]" style={{ color: COLORS.risco }}>{erro}</div>}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] px-2.5 py-1.5 rounded-md"
          style={{ background: "#f1f5f9", color: COLORS.textPrimary }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          className="text-[12px] font-medium px-2.5 py-1.5 rounded-md"
          style={{ background: COLORS.brand, color: "#fff" }}
        >
          {initial ? "Salvar" : "Adicionar"}
        </button>
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
