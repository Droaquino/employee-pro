import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore } from "@/store/appStore";
import { EmpresaForm } from "@/components/EmpresaForm";
import type { Empresa } from "@/data/mock";
import { responsaveis } from "@/data/mock";

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas — Experiência" },
      { name: "description", content: "Cadastro e gestão de empresas clientes." },
    ],
  }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const empresas = useAppStore((s) => s.empresas);
  const contratos = useAppStore((s) => s.contratos);
  const upsertEmpresa = useAppStore((s) => s.upsertEmpresa);
  const removeEmpresa = useAppStore((s) => s.removeEmpresa);
  const toggleAtivo = useAppStore((s) => s.toggleAtivo);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const respMap = useMemo(() => new Map(responsaveis.map((r) => [r.id, r.nome])), []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return empresas;
    return empresas.filter((e) => e.razaoSocial.toLowerCase().includes(q) || e.cnpj.includes(q) || e.nomeFantasia.toLowerCase().includes(q));
  }, [empresas, query]);

  const ativosPorEmpresa = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of contratos) if (!c.encerrado) m.set(c.empresaId, (m.get(c.empresaId) ?? 0) + 1);
    return m;
  }, [contratos]);

  return (
    <div>
      <Breadcrumb items={[{ label: "Gestão" }, { label: "Empresas" }]} />
      <PageHeader
        title="Empresas"
        subtitle="Carteira de empresas clientes e seus contratos ativos."
        right={
          <button
            onClick={() => { setEditing(null); setOpen(true); }}
            className="px-4 py-2 rounded-md text-[13px] font-medium text-white"
            style={{ background: "#071040" }}
          >
            + Nova empresa
          </button>
        }
      />

      <Surface>
        <div className="flex items-center gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por razão social, fantasia ou CNPJ…"
            className="flex-1 px-3 py-2 rounded-md text-[13px] outline-none"
            style={{ border: "1px solid #e2e5f0", background: "#f0f2f8" }}
          />
          <span className="text-[12px]" style={{ color: "#64748b" }}>{filtered.length} empresa(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="text-[12px]">
            <thead>
              <tr style={{ color: "#64748b", textAlign: "left" }}>
                <Th>Razão Social</Th>
                <Th>CNPJ</Th>
                <Th>Responsável</Th>
                <Th>Contratos ativos</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} style={{ borderTop: "1px solid #e2e5f0" }}>
                  <Td>
                    <div className="font-medium" style={{ color: "#071040" }}>{e.razaoSocial}</div>
                    <div className="text-[11px]" style={{ color: "#64748b" }}>{e.nomeFantasia}</div>
                  </Td>
                  <Td>{e.cnpj}</Td>
                  <Td>{respMap.get(e.responsavelId) ?? "—"}</Td>
                  <Td>{ativosPorEmpresa.get(e.id) ?? 0}</Td>
                  <Td>
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px]"
                      style={{ background: e.ativo ? "#22c55e22" : "#94a3b822", color: e.ativo ? "#16a34a" : "#475569" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.ativo ? "#22c55e" : "#94a3b8" }} />
                      {e.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </Td>
                  <Td>
                    {confirmId === e.id ? (
                      <span className="inline-flex items-center gap-2 text-[11px]">
                        <span style={{ color: "#ef4444" }}>Excluir?</span>
                        <button onClick={() => { removeEmpresa(e.id); setConfirmId(null); }} className="px-2 py-1 rounded text-white" style={{ background: "#ef4444" }}>Sim</button>
                        <button onClick={() => setConfirmId(null)} className="px-2 py-1 rounded" style={{ background: "#f1f5f9" }}>Não</button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-3 text-[11px]">
                        <Link to="/empresas/$id" params={{ id: e.id }} style={{ color: "#4f8ef7" }}>Ver contratos</Link>
                        <button onClick={() => { setEditing(e); setOpen(true); }} style={{ color: "#0f172a" }}>Editar</button>
                        <button onClick={() => toggleAtivo(e.id)} style={{ color: "#64748b" }}>{e.ativo ? "Desativar" : "Ativar"}</button>
                        <button onClick={() => setConfirmId(e.id)} style={{ color: "#ef4444" }}>Excluir</button>
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6}>
                  <EmptyState
                    icon="search"
                    title="Nenhuma empresa encontrada"
                    subtitle={query ? "Tente outro termo de busca." : "Cadastre uma nova empresa para começar."}
                    action={query ? (
                      <button onClick={() => setQuery("")} className="text-[12px] px-3 py-1.5 rounded-md text-white" style={{ background: "#071040" }}>
                        Limpar busca
                      </button>
                    ) : undefined}
                  />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      <EmpresaForm
        open={open}
        initial={editing}
        onClose={() => setOpen(false)}
        onSave={(emp) => { upsertEmpresa(emp); setOpen(false); }}
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 px-3 align-middle">{children}</td>;
}
