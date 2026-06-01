import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Surface } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { ProfileRow, UserRole } from "@/types/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresas } from "@/hooks/useEmpresas";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Arbrent" },
      { name: "description", content: "Gestão de usuários e convites." },
    ],
  }),
  component: UsuariosPage,
});

function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });
}

function useAlterarRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profiles"] }),
  });
}

function useToggleAtivoProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("profiles").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profiles"] }),
  });
}

function useAtribuirAnalistaEmpresas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      analistaId,
      empresaIds,
    }: {
      analistaId: string;
      empresaIds: string[];
    }) => {
      // Clear existing assignments for this analista
      const { error: clearError } = await supabase
        .from("empresas")
        .update({ analista_id: null })
        .eq("analista_id", analistaId);
      if (clearError) throw clearError;

      if (empresaIds.length > 0) {
        const { error } = await supabase
          .from("empresas")
          .update({ analista_id: analistaId })
          .in("id", empresaIds);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["empresas"] }),
  });
}

function UsuariosPage() {
  const { profile: myProfile } = useAuth();
  const isSupervisor = myProfile?.role === "supervisor";

  const { data: profiles = [], isLoading } = useProfiles();
  const { data: empresas = [] } = useEmpresas();
  const alterarRole = useAlterarRole();
  const toggleAtivo = useToggleAtivoProfile();
  const atribuirAnalista = useAtribuirAnalistaEmpresas();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null); // analista id
  const [selectedEmpresas, setSelectedEmpresas] = useState<string[]>([]);

  const empresasPorAnalista = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const e of empresas) {
      if (e.analistaId) {
        const arr = m.get(e.analistaId) ?? [];
        arr.push(e.id);
        m.set(e.analistaId, arr);
      }
    }
    return m;
  }, [empresas]);

  if (!isSupervisor) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Operacional" }, { label: "Usuários" }]} />
        <PageHeader title="Usuários" subtitle="Acesso restrito a supervisores." />
        <Surface>
          <EmptyState
            icon="alert"
            title="Acesso restrito"
            subtitle="Apenas supervisores podem gerenciar usuários."
          />
        </Surface>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Operacional" }, { label: "Usuários" }]} />
        <PageHeader title="Usuários" subtitle="Carregando…" />
        <Surface>
          <div className="py-8 text-center text-[13px]" style={{ color: "#94a3b8" }}>
            Buscando usuários…
          </div>
        </Surface>
      </div>
    );
  }

  const openAssign = (analistaId: string) => {
    setSelectedEmpresas(empresasPorAnalista.get(analistaId) ?? []);
    setAssignOpen(analistaId);
  };

  const saveAssign = async () => {
    if (!assignOpen) return;
    await atribuirAnalista.mutateAsync({ analistaId: assignOpen, empresaIds: selectedEmpresas });
    toast.success("Empresas atribuídas");
    setAssignOpen(null);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Operacional" }, { label: "Usuários" }]} />
      <PageHeader
        title="Usuários"
        subtitle="Gerencie membros da equipe e seus acessos."
        right={
          <button
            onClick={() => setInviteOpen(true)}
            className="px-4 py-2 rounded-md text-[13px] font-medium text-white"
            style={{ background: "#071040" }}
          >
            + Convidar usuário
          </button>
        }
      />

      <Surface>
        <table className="text-[12px] w-full">
          <thead>
            <tr style={{ color: "#64748b", textAlign: "left" }}>
              <Th>Nome</Th>
              <Th>Papel</Th>
              <Th>Empresas atribuídas</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const isMe = p.id === myProfile?.id;
              const empCount = empresasPorAnalista.get(p.id)?.length ?? 0;
              return (
                <tr key={p.id} style={{ borderTop: "1px solid #e2e5f0" }}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                        style={{ background: "#071040" }}
                      >
                        {initials(p.nome)}
                      </span>
                      <div>
                        <div className="font-medium" style={{ color: "#0f172a" }}>
                          {p.nome}
                          {isMe && (
                            <span
                              className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: "#e0e7ff", color: "#4338ca" }}
                            >
                              você
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px]"
                      style={{
                        background: p.role === "supervisor" ? "#ede9fe" : "#f0fdf4",
                        color: p.role === "supervisor" ? "#6d28d9" : "#16a34a",
                      }}
                    >
                      {p.role === "supervisor" ? "Supervisor" : "Analista"}
                    </span>
                  </Td>
                  <Td>
                    {p.role === "analista" ? (
                      <span style={{ color: empCount > 0 ? "#0f172a" : "#94a3b8" }}>
                        {empCount > 0
                          ? `${empCount} empresa${empCount !== 1 ? "s" : ""}`
                          : "Nenhuma"}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </Td>
                  <Td>
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px]"
                      style={{
                        background: p.ativo ? "#22c55e22" : "#94a3b822",
                        color: p.ativo ? "#16a34a" : "#475569",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: p.ativo ? "#22c55e" : "#94a3b8" }}
                      />
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </Td>
                  <Td>
                    {!isMe && (
                      <div
                        className="inline-flex items-center gap-1 p-1 rounded-lg"
                        style={{ background: "#f8fafc", border: "1px solid #e2e5f0" }}
                      >
                        {p.role === "analista" && (
                          <button
                            onClick={() => openAssign(p.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium hover:bg-slate-100"
                            style={{ color: "#0f172a" }}
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            Empresas
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const newRole: UserRole =
                              p.role === "supervisor" ? "analista" : "supervisor";
                            await alterarRole.mutateAsync({ id: p.id, role: newRole });
                            toast.success(
                              `${p.nome} agora é ${newRole === "supervisor" ? "Supervisor" : "Analista"}`,
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium hover:bg-slate-100"
                          style={{ color: "#4338ca" }}
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                          </svg>
                          {p.role === "supervisor" ? "→ Analista" : "→ Supervisor"}
                        </button>
                        <button
                          onClick={async () => {
                            await toggleAtivo.mutateAsync({ id: p.id, ativo: !p.ativo });
                            toast.success(p.ativo ? `${p.nome} desativado` : `${p.nome} ativado`);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium"
                          style={{
                            color: p.ativo ? "#d97706" : "#16a34a",
                            background: p.ativo ? "#fffbeb" : "#f0fdf4",
                          }}
                        >
                          {p.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    )}
                  </Td>
                </tr>
              );
            })}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon="search"
                    title="Nenhum usuário encontrado"
                    subtitle="Convide alguém para começar."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Surface>

      {/* Invite modal */}
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}

      {/* Assign empresas modal */}
      {assignOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setAssignOpen(null)}
        >
          <div
            className="w-full max-w-md rounded-xl shadow-xl p-6 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[15px] font-semibold mb-1" style={{ color: "#0f172a" }}>
              Atribuir empresas
            </h2>
            <p className="text-[12px] mb-4" style={{ color: "#64748b" }}>
              Selecione as empresas que este analista pode visualizar e gerenciar.
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {empresas.map((e) => (
                <label key={e.id} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEmpresas.includes(e.id)}
                    onChange={(ev) => {
                      if (ev.target.checked) setSelectedEmpresas((p) => [...p, e.id]);
                      else setSelectedEmpresas((p) => p.filter((x) => x !== e.id));
                    }}
                  />
                  <span className="text-[13px]" style={{ color: "#0f172a" }}>
                    {e.nomeFantasia}
                  </span>
                  <span className="text-[11px]" style={{ color: "#64748b" }}>
                    {e.cnpj}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAssignOpen(null)}
                className="px-4 py-2 rounded-md text-[13px]"
                style={{ background: "#f1f5f9", color: "#0f172a" }}
              >
                Cancelar
              </button>
              <button
                onClick={saveAssign}
                className="px-4 py-2 rounded-md text-[13px] font-medium text-white"
                style={{ background: "#071040" }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [role, setRole] = useState<UserRole>("analista");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    const e = email.trim();
    const n = nome.trim();
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError("E-mail inválido.");
      return;
    }
    if (!n) {
      setError("Nome obrigatório.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: invErr } = await supabase.auth.signUp({
        email: e,
        password: Math.random().toString(36).slice(2) + "A1!",
        options: {
          data: { nome: n, role },
          emailRedirectTo: window.location.origin + "/login",
        },
      });
      if (invErr) throw invErr;
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? "Erro ao enviar convite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl p-6 bg-white overflow-y-auto"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <>
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "#f0fdf4" }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: "#0f172a" }}>
                Convite enviado!
              </h2>
              <p className="text-[12px]" style={{ color: "#64748b" }}>
                Um e-mail de confirmação foi enviado para <strong>{email}</strong>.<br />O usuário
                deve confirmar o e-mail para acessar o sistema.
              </p>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-[13px] font-medium text-white"
                style={{ background: "#071040" }}
              >
                Fechar
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-[15px] font-semibold mb-1" style={{ color: "#0f172a" }}>
              Convidar usuário
            </h2>
            <p className="text-[12px] mb-4" style={{ color: "#64748b" }}>
              O usuário receberá um e-mail para confirmar o cadastro.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: "#374151" }}>
                  Nome completo
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: "1px solid #e2e5f0", background: "#f8fafc" }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: "#374151" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: "1px solid #e2e5f0", background: "#f8fafc" }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: "#374151" }}>
                  Papel
                </label>
                <div className="flex gap-2">
                  {(["analista", "supervisor"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className="flex-1 py-2 rounded-md text-[12px] font-medium transition-all"
                      style={{
                        background: role === r ? "#071040" : "#f1f5f9",
                        color: role === r ? "#fff" : "#374151",
                        border: `1px solid ${role === r ? "#071040" : "#e2e5f0"}`,
                      }}
                    >
                      {r === "supervisor" ? "Supervisor" : "Analista"}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <div
                  className="text-[12px] px-3 py-2 rounded-md"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                >
                  {error}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-[13px]"
                style={{ background: "#f1f5f9", color: "#0f172a" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleInvite}
                disabled={loading}
                className="px-4 py-2 rounded-md text-[13px] font-medium text-white"
                style={{ background: loading ? "#94a3b8" : "#071040" }}
              >
                {loading ? "Enviando…" : "Enviar convite"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 px-3 align-middle">{children}</td>;
}
