import { Link } from "@tanstack/react-router";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Notificacao, TipoNotif } from "@/hooks/useNotificacoes";
import { COLORS } from "@/constants/colors";

const TIPO_COR: Record<TipoNotif, string> = {
  urgente: COLORS.risco,
  atencao: COLORS.proximo,
  info: COLORS.brandAccent,
};

const TIPO_LABEL: Record<TipoNotif, string> = {
  urgente: "URGENTE",
  atencao: "ATENÇÃO",
  info: "INFO",
};

type Props = {
  n: Notificacao;
  onClick: (n: Notificacao) => void;
};

export function NotificacaoItem({ n, onClick }: Props) {
  const cor = TIPO_COR[n.tipo];
  const data = n.criadaEm;
  const horaLabel = isToday(data)
    ? format(data, "HH:mm")
    : isYesterday(data)
      ? "ontem"
      : isThisWeek(data, { locale: ptBR })
        ? format(data, "EEE", { locale: ptBR })
        : format(data, "dd/MM");

  return (
    <button
      type="button"
      onClick={() => onClick(n)}
      className="w-full text-left px-4 py-3 transition-colors"
      style={{
        background: n.lida ? COLORS.surface : "#f0f4ff",
        borderLeft: `3px solid ${n.lida ? COLORS.borderSoft : cor}`,
        borderBottom: `1px solid ${COLORS.bgPage}`,
        opacity: n.lida ? 0.75 : 1,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8f9ff"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.lida ? COLORS.surface : "#f0f4ff"; }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: cor }}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cor }}>
              {TIPO_LABEL[n.tipo]}
            </span>
            <span className="text-[11px]" style={{ color: COLORS.textMuted }}>{horaLabel}</span>
          </div>
          <div className="text-[13px] font-semibold mt-0.5" style={{ color: COLORS.textPrimary }}>
            {n.titulo}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: COLORS.textMuted }}>
            {n.descricao}
          </div>
          <Link
            to={n.rota}
            onClick={(e) => e.stopPropagation()}
            className="inline-block mt-2 text-[11px] font-medium hover:underline"
            style={{ color: COLORS.brandAccent }}
          >
            {n.rotaLabel} →
          </Link>
        </div>
      </div>
    </button>
  );
}
