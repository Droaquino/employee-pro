import { create } from "zustand";
import { empresas as seedEmpresas, type Colaborador, type Contrato, type Empresa } from "@/data/mock";
import { dadosFixos } from "@/data/dadosFixos";

const seedContratos: Contrato[] = dadosFixos.contratos;

// ── Notification lidas — persisted in localStorage ────────────────────────────
const NOTIF_KEY = "arbrent_notif_lidas";
const loadNotifLidas = (): string[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) ?? "[]"); } catch { return []; }
};
const saveNotifLidas = (ids: string[]) => {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(ids)); } catch {}
};

export type HistoryEvent = {
  id: string;
  at: string;
  tipo:
    | "EMPRESA_CRIADA" | "EMPRESA_EDITADA" | "EMPRESA_REMOVIDA" | "EMPRESA_ATIVADA" | "EMPRESA_DESATIVADA"
    | "CONTRATO_ENCERRADO" | "CONTRATO_RENOVADO"
    | "COLABORADOR_CRIADO" | "COLABORADOR_EDITADO" | "COLABORADOR_REMOVIDO";
  descricao: string;
  contexto?: Record<string, string>;
};

type State = {
  empresas: Empresa[];
  contratos: Contrato[];
  colaboradores: Colaborador[];
  historico: HistoryEvent[];
  // Notifications shared state
  notifLidas: string[];
  notifPainelOpen: boolean;
  // Actions
  upsertEmpresa: (e: Empresa) => void;
  removeEmpresa: (id: string) => void;
  toggleAtivo: (id: string) => void;
  encerrarContratos: (ids: string[], motivo: string) => void;
  renovarContratos: (ids: string[]) => void;
  upsertColaborador: (c: Colaborador) => void;
  removeColaborador: (id: string) => void;
  toggleAtivoColaborador: (id: string) => void;
  marcarNotifLida: (id: string) => void;
  marcarTodasNotifLidas: (ids: string[]) => void;
  abrirNotifPainel: () => void;
  fecharNotifPainel: () => void;
};

const log = (h: HistoryEvent[], ev: Omit<HistoryEvent, "id" | "at">): HistoryEvent[] => [
  { id: Math.random().toString(36).slice(2), at: new Date().toISOString(), ...ev },
  ...h,
].slice(0, 200);

export const useAppStore = create<State>((set) => ({
  empresas: seedEmpresas,
  contratos: seedContratos,
  colaboradores: [],
  historico: [],
  notifLidas: loadNotifLidas(),
  notifPainelOpen: false,

  upsertEmpresa: (e) =>
    set((s) => {
      const idx = s.empresas.findIndex((x) => x.id === e.id);
      if (idx === -1) {
        return { empresas: [...s.empresas, e], historico: log(s.historico, { tipo: "EMPRESA_CRIADA", descricao: `Empresa criada: ${e.razaoSocial}` }) };
      }
      const next = [...s.empresas];
      next[idx] = e;
      return { empresas: next, historico: log(s.historico, { tipo: "EMPRESA_EDITADA", descricao: `Empresa editada: ${e.razaoSocial}` }) };
    }),

  removeEmpresa: (id) =>
    set((s) => {
      const emp = s.empresas.find((e) => e.id === id);
      return {
        empresas: s.empresas.filter((e) => e.id !== id),
        contratos: s.contratos.filter((c) => c.empresaId !== id),
        colaboradores: s.colaboradores.filter((c) => c.empresaId !== id),
        historico: log(s.historico, { tipo: "EMPRESA_REMOVIDA", descricao: `Empresa removida: ${emp?.razaoSocial ?? id}` }),
      };
    }),

  toggleAtivo: (id) =>
    set((s) => {
      const emp = s.empresas.find((e) => e.id === id);
      const novoAtivo = emp ? !emp.ativo : true;
      return {
        empresas: s.empresas.map((e) => (e.id === id ? { ...e, ativo: !e.ativo } : e)),
        historico: log(s.historico, {
          tipo: novoAtivo ? "EMPRESA_ATIVADA" : "EMPRESA_DESATIVADA",
          descricao: `${novoAtivo ? "Ativada" : "Desativada"}: ${emp?.razaoSocial ?? id}`,
        }),
      };
    }),

  encerrarContratos: (ids, motivo) =>
    set((s) => {
      const nomes = s.contratos.filter((c) => ids.includes(c.id)).map((c) => c.funcionarioNome);
      return {
        contratos: s.contratos.map((c) => (ids.includes(c.id) ? { ...c, encerrado: true, motivoEncerramento: motivo } : c)),
        historico: log(s.historico, {
          tipo: "CONTRATO_ENCERRADO",
          descricao: `${ids.length} contrato(s) encerrado(s): ${nomes.slice(0, 3).join(", ")}${nomes.length > 3 ? "…" : ""}`,
          contexto: { motivo },
        }),
      };
    }),

  renovarContratos: (ids) =>
    set((s) => {
      const today = new Date().toISOString().slice(0, 10);
      const nomes = s.contratos.filter((c) => ids.includes(c.id)).map((c) => c.funcionarioNome);
      return {
        contratos: s.contratos.map((c) => (ids.includes(c.id) ? { ...c, renovadoEm: today } : c)),
        historico: log(s.historico, {
          tipo: "CONTRATO_RENOVADO",
          descricao: `${ids.length} contrato(s) renovado(s): ${nomes.slice(0, 3).join(", ")}${nomes.length > 3 ? "…" : ""}`,
        }),
      };
    }),

  upsertColaborador: (c) =>
    set((s) => {
      const idx = s.colaboradores.findIndex((x) => x.id === c.id);
      if (idx === -1) {
        return {
          colaboradores: [...s.colaboradores, c],
          historico: log(s.historico, { tipo: "COLABORADOR_CRIADO", descricao: `Colaborador criado: ${c.nome}` }),
        };
      }
      const next = [...s.colaboradores];
      next[idx] = c;
      return {
        colaboradores: next,
        historico: log(s.historico, { tipo: "COLABORADOR_EDITADO", descricao: `Colaborador editado: ${c.nome}` }),
      };
    }),

  removeColaborador: (id) =>
    set((s) => {
      const col = s.colaboradores.find((c) => c.id === id);
      return {
        colaboradores: s.colaboradores.filter((c) => c.id !== id),
        historico: log(s.historico, { tipo: "COLABORADOR_REMOVIDO", descricao: `Colaborador removido: ${col?.nome ?? id}` }),
      };
    }),

  toggleAtivoColaborador: (id) =>
    set((s) => ({
      colaboradores: s.colaboradores.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c)),
    })),

  marcarNotifLida: (id) =>
    set((s) => {
      if (s.notifLidas.includes(id)) return {};
      const next = [...s.notifLidas, id];
      saveNotifLidas(next);
      return { notifLidas: next };
    }),

  marcarTodasNotifLidas: (ids) =>
    set((s) => {
      const merged = Array.from(new Set([...s.notifLidas, ...ids]));
      saveNotifLidas(merged);
      return { notifLidas: merged };
    }),

  abrirNotifPainel: () => set({ notifPainelOpen: true }),
  fecharNotifPainel: () => set({ notifPainelOpen: false }),
}));
