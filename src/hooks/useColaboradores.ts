import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { mapColaborador, colaboradorToRow } from "@/types/supabase";
import type { Colaborador } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";
import { logHistorico } from "@/hooks/useHistorico";

export const COLABORADORES_KEY = ["colaboradores"] as const;

export function useColaboradores(empresaId?: string) {
  return useQuery({
    queryKey: empresaId ? [...COLABORADORES_KEY, empresaId] : COLABORADORES_KEY,
    queryFn: async () => {
      let q = supabase.from("colaboradores").select("*").order("nome");
      if (empresaId) q = q.eq("empresa_id", empresaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapColaborador);
    },
  });
}

export function useUpsertColaborador() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (colaborador: Colaborador) => {
      const row = colaboradorToRow(colaborador);
      if (colaborador.id) {
        const { data, error } = await supabase
          .from("colaboradores")
          .update(row)
          .eq("id", colaborador.id)
          .select()
          .single();
        if (error) throw error;
        return mapColaborador(data);
      }
      const { data, error } = await supabase
        .from("colaboradores")
        .insert({ ...row, empresa_id: colaborador.empresaId })
        .select()
        .single();
      if (error) throw error;
      return mapColaborador(data);
    },
    onSuccess: async (saved, original) => {
      qc.invalidateQueries({ queryKey: COLABORADORES_KEY });
      const isNew = !original.id;
      await logHistorico({
        tipo: isNew ? "COLABORADOR_CRIADO" : "COLABORADOR_EDITADO",
        descricao: isNew
          ? `Colaborador criado: ${saved.nome}`
          : `Colaborador editado: ${saved.nome}`,
        user_id: user?.id ?? null,
        empresa_id: saved.empresaId,
      });
    },
  });
}

export function useRemoveColaborador() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (colaborador: Colaborador) => {
      const { error } = await supabase
        .from("colaboradores")
        .delete()
        .eq("id", colaborador.id);
      if (error) throw error;
    },
    onSuccess: async (_, colaborador) => {
      qc.invalidateQueries({ queryKey: COLABORADORES_KEY });
      await logHistorico({
        tipo: "COLABORADOR_REMOVIDO",
        descricao: `Colaborador removido: ${colaborador.nome}`,
        user_id: user?.id ?? null,
        empresa_id: colaborador.empresaId,
      });
    },
  });
}

export function useToggleAtivoColaborador() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("colaboradores")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COLABORADORES_KEY }),
  });
}
