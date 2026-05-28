import { create } from "zustand";
import { empresas as seedEmpresas, type Colaborador, type Contrato, type Empresa } from "@/data/mock";
import { dadosFixos } from "@/data/dadosFixos";

const seedContratos: Contrato[] = dadosFixos.contratos;

export type HistoryEvent = {
  id: string;
  at: string;
  tipo:
    | "EMPRESA_CRIADA" | "EMPRESA_EDITADA" | "EMPRESA_REMOVIDA" | "EMPRESA_ATIVADA" | "EMPRESA_DESATIVADA"
    | "CONTRATO_ENCERRADO"
    | "COLABORADOR_CRIADO" | "COLABORADOR_EDITADO" | "COLABORADOR_REMOVIDO";
  descricao: string;
  contexto?: Record<string, string>;
};

type State = {
  empresas: Empresa[];
  contratos: Contrato[];
  colaboradores: Colaborador[];
  historico: HistoryEvent[];
  upsertEmpresa: (e: Empresa) => void;
  removeEmpresa: (id: string) => void;
  toggleAtivo: (id: string) => void;
  encerrarContratos: (ids: string[], motivo: string) => void;
  upsertColaborador: (c: Colaborador) => void;
  removeColaborador: (id: string) => void;
  toggleAtivoColaborador: (id: string) => void;
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
}));
