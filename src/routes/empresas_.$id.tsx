import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO, subDays, startOfDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore } from "@/store/appStore";
import { ContratosTable } from "@/components/ContratosTable";
import { ContratosFilters, applyFilters, initialFilters, type FiltersState } from "@/components/ContratosFilters";
import { CargosPieChart } from "@/components/charts/CargosPieChart";
import { StatusEmpresaBarChart } from "@/components/charts/StatusEmpresaBarChart";
import { ColaboradorForm } from "@/components/ColaboradorForm";
import { responsaveis } from "@/data/mock";
import type { Colaborador } from "@/data/mock";
import { maskCpf } from "@/hooks/useStatusContrato";

export const Route = createFileRoute("/empresas_/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da empresa — Arbrent" },
      { name: "description", content: "Detalhe e contratos da empresa." },
    ],
  }),
  component: EmpresaDetail,
  notFoundComponent: () => (
    <div className="text-center py-16">
      <h2 className="text-lg font-semibold">Empresa não encontrada</h2>
      <Link to="/empresas" className="text-[13px]" style={{ color: "#4f8ef7" }}>Voltar para empresas</Link>
    </div>
  ),
});

function EmpresaDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const empresa = useAppStore((s) => s.empresas.find((e) => e.id === id));
  // Use stable selectors (no inline .filter) to avoid infinite re-render loops
  const allContratos = useAppStore((s) => s.contratos);
  const allColaboradores = useAppStore((s) => s.colaboradores);
  const contratos = useMemo(() => allContratos.filter((c) => c.empresaId === id), [allContratos, id]);
  const colaboradores = useMemo(() => allColaboradores.filter((c) => c.empresaId === id), [allColaboradores, id]);
  const encerrarContratos = useAppStore((s) => s.encerrarContratos);
  const upsertColaborador = useAppStore((s) => s.upsertColaborador);
  const removeColaborador = useAppStore((s) => s.removeColaborador);
  const toggleAtivoColaborador = useAppStore((s) => s.toggleAtivoColaborador);

  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [selected, setSelected] = useState<string[]>([]);

  // Collaborator form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador | null>(null);
  const [confirmColId, setConfirmColId] = useState<string | null>(null);
  const [colQuery, setColQuery] = useState("");

  if (!empresa) throw notFound();

  useEffect(() => {
    document.title = `${empresa.nomeFantasia} · Arbrent`;
  }, [empresa.nomeFantasia]);

  const respNome = responsaveis.find((r) => r.id === empresa.responsavelId)?.nome ?? "—";
  const ativos = contratos.filter((c) => !c.encerrado);
  const filtered = useMemo(() => applyFilters(contratos, filters), [contratos, filters]);

  const filteredColaboradores = useMemo(() => {
    const q = colQuery.toLowerCase().trim();
    if (!q) return colaboradores;
    return colaboradores.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.cargo.toLowerCase().includes(q) ||
        c.cpf.includes(q),
    );
  }, [colaboradores, colQuery]);

  // Contratos renovados nos últimos 30 dias
  const renovados = useMemo(() => {
    const corte = startOfDay(subDays(new Date(), 30));
    return contratos.filter((c) => {
      if (!c.renovadoEm) return false;
      return isAfter(startOfDay(parseISO(c.renovadoEm)), corte) || startOfDay(parseISO(c.renovadoEm)).getTime() === corte.getTime();
    });
  }, [contratos]);

  const handleEncerrar = () => {
    if (selected.length === 0) return;
    encerrarContratos(selected, "Encerrado em lote");
    toast.success(`${selected.length} contrato${selected.length !== 1 ? "s" : ""} encerrado${selected.length !== 1 ? "s" : ""}`);
    setSelected([]);
  };

  const handleSaveColaborador = (col: Colaborador) => {
    const isNew = !colaboradores.find((c) => c.id === col.id);
    upsertColaborador(col);
    setFormOpen(false);
    setEditing(null);
    toast.success(isNew ? `Colaborador "${col.nome}" adicionado` : `Colaborador "${col.nome}" atualizado`);
  };

  return (
    <div>
      <Breadcrumb items={[
        { label: "Gestão" },
        { label: "Empresas", to: "/empresas" },
        { label: empresa.nomeFantasia },
      ]} />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader title={empresa.razaoSocial} subtitle={`${empresa.nomeFantasia} · ${empresa.cnpj}`} />
        <button
          onClick={() => navigate({ to: "/cliente/$id/painel", params: { id } })}
          className="text-[12px] px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 mt-1"
          style={{ border: "1px solid #071040", color: "#071040", background: "#fff" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M10 14L21 3M21 14v7H3V3h7"/></svg>
          Painel do cliente
        </button>
      </div>

      {/* Info fields */}
      <Surface className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
          <InfoField label="Responsável" value={respNome} />
          <InfoField label="E-mail" value={empresa.email} />
          <InfoField label="Telefone" value={empresa.telefone} />
          <InfoField label="Status" value={empresa.ativo ? "Ativa" : "Inativa"} color={empresa.ativo ? "#16a34a" : "#475569"} />
        </div>
      </Surface>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Surface title="Distribuição por status">
          <StatusEmpresaBarChart contratos={ativos} />
        </Surface>
        <Surface title="Distribuição por cargo">
          <CargosPieChart contratos={ativos} />
        </Surface>
      </div>

      {/* ── Colaboradores ── */}
      <Surface className="mb-4">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "#071040" }}>Colaboradores</h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
              {colaboradores.length} cadastrado{colaboradores.length !== 1 ? "s" : ""} · {colaboradores.filter((c) => c.ativo).length} ativo{colaboradores.filter((c) => c.ativo).length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#071040" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo colaborador
          </button>
        </div>

        {/* Search */}
        {colaboradores.length > 0 && (
          <div className="flex items-center gap-3 mb-3">
            <input
              value={colQuery}
              onChange={(e) => setColQuery(e.target.value)}
              placeholder="Buscar por nome, cargo ou CPF…"
              className="flex-1 px-3 py-2.5 rounded-md text-[13px] outline-none"
              style={{ border: "1px solid #e2e5f0", background: "#f0f2f8" }}
            />
            <span className="text-[11px]" style={{ color: "#64748b" }}>
              {filteredColaboradores.length} resultado{filteredColaboradores.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {colaboradores.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="Nenhum colaborador cadastrado"
            subtitle="Adicione o primeiro colaborador desta empresa."
            action={
              <button
                onClick={() => { setEditing(null); setFormOpen(true); }}
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white"
                style={{ background: "#071040" }}
              >
                + Novo colaborador
              </button>
            }
          />
        ) : filteredColaboradores.length === 0 ? (
          <EmptyState
            icon="search"
            title="Nenhum colaborador encontrado"
            subtitle="Tente outro termo de busca."
            action={
              <button
                onClick={() => setColQuery("")}
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white"
                style={{ background: "#071040" }}
              >
                Limpar busca
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="text-[12px] w-full">
              <thead>
                <tr style={{ color: "#64748b", textAlign: "left" }}>
                  <ColTh>Nome</ColTh>
                  <ColTh>CPF</ColTh>
                  <ColTh>Cargo</ColTh>
                  <ColTh>Prazo renovação</ColTh>
                  <ColTh>E-mail</ColTh>
                  <ColTh>Telefone</ColTh>
                  <ColTh>Status</ColTh>
                  <ColTh>Ações</ColTh>
                </tr>
              </thead>
              <tbody>
                {filteredColaboradores.map((col) => (
                  <tr key={col.id} style={{ borderTop: "1px solid #e2e5f0" }}>
                    <ColTd>
                      <div className="font-medium" style={{ color: "#071040" }}>{col.nome}</div>
                      <div className="text-[10px]" style={{ color: "#94a3b8" }}>desde {col.criadoEm}</div>
                      {col.observacao && (
                        <div className="text-[10px] mt-0.5 italic" style={{ color: "#94a3b8" }} title={col.observacao}>
                          {col.observacao.length > 40 ? col.observacao.slice(0, 40) + "…" : col.observacao}
                        </div>
                      )}
                    </ColTd>
                    <ColTd>{col.cpf ? maskCpf(col.cpf) : "—"}</ColTd>
                    <ColTd>{col.cargo}</ColTd>
                    <ColTd>
                      {col.prazoRenovacao ? (
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ background: "#e0f2fe", color: "#0369a1" }}
                        >
                          {col.prazoRenovacao} dias
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </ColTd>
                    <ColTd>
                      {col.email ? (
                        <a href={`mailto:${col.email}`} className="hover:underline" style={{ color: "#4f8ef7" }}>
                          {col.email}
                        </a>
                      ) : "—"}
                    </ColTd>
                    <ColTd>{col.telefone || "—"}</ColTd>
                    <ColTd>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={{
                          background: col.ativo ? "#22c55e22" : "#94a3b822",
                          color: col.ativo ? "#16a34a" : "#475569",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: col.ativo ? "#22c55e" : "#94a3b8" }}
                        />
                        {col.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </ColTd>
                    <ColTd>
                      {confirmColId === col.id ? (
                        <div
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          <span className="text-[12px] font-medium" style={{ color: "#ef4444" }}>Confirmar exclusão?</span>
                          <button
                            onClick={() => { removeColaborador(col.id); setConfirmColId(null); toast.success("Colaborador excluído"); }}
                            className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ background: "#ef4444" }}
                          >
                            Excluir
                          </button>
                          <button
                            onClick={() => setConfirmColId(null)}
                            className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors hover:bg-slate-200"
                            style={{ background: "#f1f5f9", color: "#64748b" }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {/* Editar */}
                          <button
                            onClick={() => { setEditing(col); setFormOpen(true); }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors hover:bg-slate-100"
                            style={{ color: "#0f172a", border: "1px solid #e2e5f0", background: "#fff" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Editar
                          </button>
                          {/* Ativar/Desativar */}
                          <button
                            onClick={() => {
                              toggleAtivoColaborador(col.id);
                              toast.success(col.ativo ? `${col.nome} desativado` : `${col.nome} ativado`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors hover:opacity-90"
                            style={{
                              color: col.ativo ? "#92400e" : "#14532d",
                              background: col.ativo ? "#fef3c7" : "#dcfce7",
                              border: `1px solid ${col.ativo ? "#fde68a" : "#bbf7d0"}`,
                            }}
                          >
                            {col.ativo ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                            )}
                            {col.ativo ? "Desativar" : "Ativar"}
                          </button>
                          {/* Excluir */}
                          <button
                            onClick={() => setConfirmColId(col.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors hover:bg-red-50"
                            style={{ color: "#dc2626", border: "1px solid #fecaca", background: "#fff5f5" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                            Excluir
                          </button>
                        </div>
                      )}
                    </ColTd>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      {/* ── Renovados ── */}
      <Surface className="mb-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "#071040" }}>
              Renovados nos últimos 30 dias
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
              Contratos marcados como renovados recentemente
            </p>
          </div>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold"
            style={{ background: renovados.length > 0 ? "#dbeafe" : "#f1f5f9", color: renovados.length > 0 ? "#1d4ed8" : "#94a3b8" }}
          >
            {renovados.length} contrato{renovados.length !== 1 ? "s" : ""}
          </span>
        </div>

        {renovados.length === 0 ? (
          <div className="py-6 text-center text-[13px]" style={{ color: "#94a3b8" }}>
            Nenhum contrato renovado nos últimos 30 dias.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-[12px] w-full">
              <thead>
                <tr style={{ color: "#64748b", textAlign: "left" }}>
                  <ColTh>Funcionário</ColTh>
                  <ColTh>Cargo</ColTh>
                  <ColTh>Renovado em</ColTh>
                  <ColTh>Vencimento 2ª prorr.</ColTh>
                </tr>
              </thead>
              <tbody>
                {renovados.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #e2e5f0" }}>
                    <ColTd>
                      <div className="font-medium" style={{ color: "#071040" }}>{c.funcionarioNome}</div>
                      <div className="text-[10px]" style={{ color: "#94a3b8" }}>{maskCpf(c.funcionarioCpf)}</div>
                    </ColTd>
                    <ColTd>{c.cargo}</ColTd>
                    <ColTd>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                        ↻ {format(parseISO(c.renovadoEm!), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </ColTd>
                    <ColTd>{format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy", { locale: ptBR })}</ColTd>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      {/* ── Contratos ── */}
      <Surface title="Contratos">
        <ContratosFilters
          contratos={contratos}
          total={contratos.length}
          filtered={filtered.length}
          value={filters}
          onChange={setFilters}
        />
        {selected.length > 0 && (
          <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-md" style={{ background: "#f0f5ff", border: "1px solid #c7d2fe" }}>
            <span className="text-[12px]" style={{ color: "#071040" }}>{selected.length} selecionado(s)</span>
            <button onClick={handleEncerrar} className="text-[12px] px-3 py-1 rounded text-white" style={{ background: "#071040" }}>
              Marcar como encerrado
            </button>
            <button onClick={() => setSelected([])} className="text-[12px]" style={{ color: "#64748b" }}>Limpar seleção</button>
          </div>
        )}
        <ContratosTable
          contratos={filtered}
          selectable
          expandable
          selected={selected}
          onSelectionChange={setSelected}
          onClearFilters={() => setFilters(initialFilters)}
          caption={`Contratos da empresa ${empresa.nomeFantasia}`}
        />
      </Surface>

      {/* Collaborator form drawer */}
      <ColaboradorForm
        open={formOpen}
        initial={editing}
        empresaId={id}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSaveColaborador}
      />
    </div>
  );
}

function InfoField({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="uppercase text-[10px] tracking-wider" style={{ color: "#64748b" }}>{label}</div>
      <div className="mt-1 text-[13px] font-medium" style={{ color: color ?? "#0f172a" }}>{value}</div>
    </div>
  );
}

function ColTh({ children }: { children: React.ReactNode }) {
  return <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">{children}</th>;
}
function ColTd({ children }: { children: React.ReactNode }) {
  return <td className="py-3 px-3 align-middle">{children}</td>;
}
