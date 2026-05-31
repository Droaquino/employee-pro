import type { Insight } from "@/lib/insights";

const TONE_STYLE: Record<Insight["tone"], { bg: string; border: string; fg: string; dot: string }> =
  {
    ok: { bg: "#f0fdf4", border: "#bbf7d0", fg: "#166534", dot: "#22c55e" },
    neutro: { bg: "#f8fafc", border: "#e2e8f0", fg: "#334155", dot: "#94a3b8" },
    atencao: { bg: "#fffbeb", border: "#fde68a", fg: "#92400e", dot: "#f59e0b" },
    critico: { bg: "#fef2f2", border: "#fecaca", fg: "#991b1b", dot: "#ef4444" },
  };

export function ChartInsight({ insight }: { insight: Insight }) {
  const s = TONE_STYLE[insight.tone];
  return (
    <div
      className="mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-[12px] leading-snug"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.fg }}
    >
      <span className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      <span>{insight.texto}</span>
    </div>
  );
}
