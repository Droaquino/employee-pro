import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { mapEmpresa, empresaToRow } from "@/types/supabase";
import type { Empresa } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";
import { logHistorico } from "@/hooks/useHistorico";

export const EMPRESAS_KEY = ["empresas"] as const;

export function useEmpresas() {
  return useQuery({
    queryKey: EMPRESAS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("nome_fantasia");
      if (error) throw error;
      return (data ?? []).map(mapEmpresa);
    },
  });
}

export function useUpsertEmpresa() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (empresa: Empresa) => {
      const row = { ...empresaToRow(empresa) };
      if (empresa.id) {
        const { data, error } = await supabase
          .from("empresas")
          .update(row)
          .eq("id", empresa.id)
          .select()
          .single();
        if (error) throw error;
        return mapEmpresa(data);
      }
      const { data, error } = await supabase
        .from("empresas")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapEmpresa(data);
    },
    onSuccess: async (saved, empresa) => {
      qc.invalidateQueries({ queryKey: EMPRESAS_KEY });
      const isNew = !empresa.id || empresa.id !== saved.id;
      await logHistorico({
        tipo: isNew ? "EMPRESA_CRIADA" : "EMPRESA_EDITADA",
        descricao: isNew
          ? `Empresa criada: ${saved.razaoSocial}`
          : `Empresa editada: ${saved.razaoSocial}`,
        user_id: user?.id ?? null,
        empresa_id: saved.id,
      });
    },
  });
}

export function useRemoveEmpresa() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (empresa: Empresa) => {
      const { error } = await supabase
        .from("empresas")
        .delete()
        .eq("id", empresa.id);
      if (error) throw error;
    },
    onSuccess: async (_, empresa) => {
      qc.invalidateQueries({ queryKey: EMPRESAS_KEY });
      qc.invalidateQueries({ queryKey: ["contratos"] });
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
      await logHistorico({
        tipo: "EMPRESA_REMOVIDA",
        descricao: `Empresa removida: ${empresa.razaoSocial}`,
        user_id: user?.id ?? null,
        empresa_id: null,
      });
    },
  });
}

export function useToggleEmpresaAtivo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("empresas")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPRESAS_KEY }),
  });
}

export function useAtribuirAnalista() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      empresaId,
      analistaId,
    }: {
      empresaId: string;
      analistaId: string | null;
    }) => {
      const { error } = await supabase
        .from("empresas")
        .update({ analista_id: analistaId })
        .eq("id", empresaId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPRESAS_KEY }),
  });
}
