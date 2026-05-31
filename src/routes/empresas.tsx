import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { EmpresaForm } from "@/components/EmpresaForm";
import type { Empresa } from "@/data/mock";
import { responsaveis } from "@/data/mock";
import { csvDateStamp, downloadCsv, toCsv } from "@/lib/csv";
import { useEmpresas, useUpsertEmpresa, useRemoveEmpresa, useToggleEmpresaAtivo } from "@/hooks/useEmpresas";
import { useContratos } from "@/hooks/useContratos";
import { useAuth } from "@/contexts/AuthContext";

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
  const { profile } = useAuth();
  const isSupervisor = profile?.role === "supervisor";

  const { data: empresas = [], isLoading } = useEmpresas();
  const { data: contratos = [] } = useContratos();
  const upsertEmpresa = useUpsertEmpresa();
  const removeEmpresa = useRemoveEmpresa();
  const toggleAtivo = useToggleEmpresaAtivo();

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

  const handleExport = () => {
    if (filtered.length === 0) { toast.error("Nada para exportar"); return; }
    const rows = filtered.map((e) => ({
      "Razao Social": e.razaoSocial,
      "Nome Fantasia": e.nomeFantasia,
      CNPJ: e.cnpj,
      Responsavel: respMap.get(e.responsavelId) ?? "",
      Email: e.email,
      Telefone: e.telefone,
      "Contratos Ativos": ativosPorEmpresa.get(e.id) ?? 0,
      Status: e.ativo ? "Ativa" : "Inativa",
    }));
    downloadCsv(`empresas_${csvDateStamp()}.csv`, toCsv(rows));
    toast.success(`${rows.length} empresa(s) exportada(s)`);
  };

  if (isLoading) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Gestão" }, { label: "Empresas" }]} />
        <PageHeader title="Empresas" subtitle="Carregando…" />
        <Surface><div className="py-8 text-center text-[13px]" style={{ color: "#94a3b8" }}>Buscando empresas…</div></Surface>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Gestão" }, { label: "Empresas" }]} />
      <PageHeader
        title="Empresas"
        subtitle="Carteira de empresas clientes e seus contratos ativos."
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-md text-[13px] font-medium"
              style={{ background: "#fff", color: "#071040", border: "1px solid #071040" }}
            >
              Exportar CSV
            </button>
            {isSupervisor && (
              <button
                onClick={() => { setEditing(null); setOpen(true); }}
                className="px-4 py-2 rounded-md text-[13px] font-medium text-white"
                style={{ background: "#071040" }}
              >
                + Nova empresa
              </button>
            )}
          </div>
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
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <span className="text-[11px] font-medium mr-1" style={{ color: "#ef4444" }}>Confirmar exclusão?</span>
                        <button
                          onClick={async () => {
                            await removeEmpresa.mutateAsync(e);
                            setConfirmId(null);
                            toast.success("Empresa excluída");
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium text-white"
                          style={{ background: "#ef4444" }}
                        >Sim, excluir</button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium"
                          style={{ background: "#f1f5f9", color: "#64748b" }}
                        >Cancelar</button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 p-1 rounded-lg" style={{ background: "#f8fafc", border: "1px solid #e2e5f0" }}>
                        <Link
                          to="/empresas/$id"
                          params={{ id: e.id }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-white"
                          style={{ background: "#071040" }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          Contratos
                        </Link>
                        {isSupervisor && (
                          <>
                            <button
                              onClick={() => { setEditing(e); setOpen(true); }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium hover:bg-slate-100"
                              style={{ color: "#0f172a" }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Editar
                            </button>
                            <button
                              onClick={async () => {
                                await toggleAtivo.mutateAsync({ id: e.id, ativo: !e.ativo });
                                toast.success(e.ativo ? `${e.nomeFantasia} desativada` : `${e.nomeFantasia} ativada`);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium"
                              style={{ color: e.ativo ? "#d97706" : "#16a34a", background: e.ativo ? "#fffbeb" : "#f0fdf4" }}
                            >
                              {e.ativo ? (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                              ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                              )}
                              {e.ativo ? "Desativar" : "Ativar"}
                            </button>
                            <button
                              onClick={() => setConfirmId(e.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium hover:bg-red-50"
                              style={{ color: "#ef4444" }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                              Excluir
                            </button>
                          </>
                        )}
                      </div>
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

      {isSupervisor && (
        <EmpresaForm
          open={open}
          initial={editing}
          onClose={() => setOpen(false)}
          onSave={async (emp) => {
            const isNew = !empresas.find((e) => e.id === emp.id);
            await upsertEmpresa.mutateAsync(emp);
            setOpen(false);
            toast.success(isNew ? `Empresa "${emp.nomeFantasia}" criada` : `Empresa "${emp.nomeFantasia}" atualizada`);
          }}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 px-3 align-middle">{children}</td>;
}
