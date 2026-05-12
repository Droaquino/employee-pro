import { create } from "zustand";
import { empresas as seedEmpresas, contratos as seedContratos, type Empresa, type Contrato } from "@/data/mock";

type State = {
  empresas: Empresa[];
  contratos: Contrato[];
  upsertEmpresa: (e: Empresa) => void;
  removeEmpresa: (id: string) => void;
  toggleAtivo: (id: string) => void;
};

export const useAppStore = create<State>((set) => ({
  empresas: seedEmpresas,
  contratos: seedContratos,
  upsertEmpresa: (e) =>
    set((s) => {
      const idx = s.empresas.findIndex((x) => x.id === e.id);
      if (idx === -1) return { empresas: [...s.empresas, e] };
      const next = [...s.empresas];
      next[idx] = e;
      return { empresas: next };
    }),
  removeEmpresa: (id) =>
    set((s) => ({
      empresas: s.empresas.filter((e) => e.id !== id),
      contratos: s.contratos.filter((c) => c.empresaId !== id),
    })),
  toggleAtivo: (id) =>
    set((s) => ({
      empresas: s.empresas.map((e) => (e.id === id ? { ...e, ativo: !e.ativo } : e)),
    })),
}));
