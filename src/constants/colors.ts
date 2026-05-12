export const COLORS = {
  brand: "#071040",
  brandHover: "#0d1a5e",
  brandActive: "#1a2d8a",
  brandAccent: "#4f8ef7",
  bgPage: "#f0f2f8",
  surface: "#ffffff",
  borderSoft: "#e2e5f0",
  textOnDark: "#e8ecff",
  textPrimary: "#0f172a",
  textMuted: "#64748b",
  vigente: "#22c55e",
  proximo: "#f59e0b",
  risco: "#ef4444",
  vencido: "#7f1d1d",
};

export const STATUS_COLOR: Record<string, string> = {
  VIGENTE: COLORS.vigente,
  PROXIMO: COLORS.proximo,
  RISCO: COLORS.risco,
  VENCIDO: COLORS.vencido,
};

export const STATUS_LABEL: Record<string, string> = {
  VIGENTE: "Vigente",
  PROXIMO: "Próximo do vencimento",
  RISCO: "Em risco",
  VENCIDO: "Vencido",
};
