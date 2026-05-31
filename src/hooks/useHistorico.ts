import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { mapHistorico } from "@/types/supabase";
import type { HistoricoRow } from "@/types/supabase";

export const HISTORICO_KEY = ["historico"] as const;

export function useHistorico() {
  return useQuery({
    queryKey: HISTORICO_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico")
        .select("*")
        .order("at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map(mapHistorico);
    },
  });
}

/** Insere um evento de histórico (chamado dentro de onSuccess das mutations) */
export async function logHistorico(
  ev: Pick<HistoricoRow, "tipo" | "descricao" | "user_id" | "empresa_id"> & {
    contexto?: Record<string, string>;
  },
) {
  await supabase.from("historico").insert({
    tipo: ev.tipo,
    descricao: ev.descricao,
    contexto: ev.contexto ?? null,
    user_id: ev.user_id,
    empresa_id: ev.empresa_id,
  });
}
