import { create } from "zustand";

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

// UI-only state (notificações, painéis). Dados vivem no Supabase via TanStack Query.
type State = {
  notifLidas: string[];
  notifPainelOpen: boolean;
  marcarNotifLida: (id: string) => void;
  marcarTodasNotifLidas: (ids: string[]) => void;
  abrirNotifPainel: () => void;
  fecharNotifPainel: () => void;
};

export const useAppStore = create<State>((set) => ({
  notifLidas: loadNotifLidas(),
  notifPainelOpen: false,

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
