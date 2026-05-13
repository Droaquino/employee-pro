import { create } from "zustand";
import { empresas as seedEmpresas, contratos as seedContratos, type Empresa, type Contrato } from "@/data/mock";

export type HistoryEvent = {
  id: string;
  at: string; // ISO datetime
  tipo: "EMPRESA_CRIADA" | "EMPRESA_EDITADA" | "EMPRESA_REMOVIDA" | "EMPRESA_ATIVADA" | "EMPRESA_DESATIVADA" | "CONTRATO_ENCERRADO";
  descricao: string;
  contexto?: Record<string, string>;
};

type State = {
  empresas: Empresa[];
  contratos: Contrato[];
  historico: HistoryEvent[];
  upsertEmpresa: (e: Empresa) => void;
  removeEmpresa: (id: string) => void;
  toggleAtivo: (id: string) => void;
  encerrarContratos: (ids: string[], motivo: string) => void;
};

const log = (h: HistoryEvent[], ev: Omit<HistoryEvent, "id" | "at">): HistoryEvent[] => [
  { id: Math.random().toString(36).slice(2), at: new Date().toISOString(), ...ev },
  ...h,
].slice(0, 200);

export const useAppStore = create<State>((set) => ({
  empresas: seedEmpresas,
  contratos: seedContratos,
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
}));
