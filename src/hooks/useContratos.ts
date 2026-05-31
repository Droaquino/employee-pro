import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { mapContrato } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { logHistorico } from "@/hooks/useHistorico";

export const CONTRATOS_KEY = ["contratos"] as const;

export function useContratos(empresaId?: string) {
  return useQuery({
    queryKey: empresaId ? [...CONTRATOS_KEY, empresaId] : CONTRATOS_KEY,
    queryFn: async () => {
      let q = supabase.from("contratos").select("*").order("vencimento_segundo");
      if (empresaId) q = q.eq("empresa_id", empresaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapContrato);
    },
  });
}

export function useEncerrarContratos() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ ids, motivo }: { ids: string[]; motivo: string }) => {
      const { error } = await supabase
        .from("contratos")
        .update({ encerrado: true, motivo_encerramento: motivo })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: async (_, { ids, motivo }) => {
      qc.invalidateQueries({ queryKey: CONTRATOS_KEY });
      await logHistorico({
        tipo: "CONTRATO_ENCERRADO",
        descricao: `${ids.length} contrato(s) encerrado(s)`,
        user_id: user?.id ?? null,
        empresa_id: null,
        contexto: { motivo },
      });
    },
  });
}

export function useRenovarContratos() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const hoje = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("contratos")
        .update({ renovado_em: hoje })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: async (_, ids) => {
      qc.invalidateQueries({ queryKey: CONTRATOS_KEY });
      await logHistorico({
        tipo: "CONTRATO_RENOVADO",
        descricao: `${ids.length} contrato(s) renovado(s)`,
        user_id: user?.id ?? null,
        empresa_id: null,
      });
    },
  });
}
