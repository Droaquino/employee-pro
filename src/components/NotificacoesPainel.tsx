import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isToday, isYesterday, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { COLORS } from "@/constants/colors";
import { NotificacaoItem } from "@/components/NotificacaoItem";
import type { FiltroNotif, Notificacao } from "@/hooks/useNotificacoes";
import { useNotificacoes } from "@/hooks/useNotificacoes";

type Props = {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

const FILTROS: { key: FiltroNotif; label: string; cor: string }[] = [
  { key: "todos",   label: "Todos",   cor: COLORS.brand },
  { key: "urgente", label: "Urgente", cor: COLORS.risco },
  { key: "atencao", label: "Atenção", cor: COLORS.proximo },
  { key: "info",    label: "Info",    cor: COLORS.brandAccent },
];

function grupo(d: Date): "HOJE" | "ONTEM" | "ESTA SEMANA" | "MAIS ANTIGAS" {
  if (isToday(d))    return "HOJE";
  if (isYesterday(d)) return "ONTEM";
  if (isThisWeek(d, { locale: ptBR })) return "ESTA SEMANA";
  return "MAIS ANTIGAS";
}

export function NotificacoesPainel({ open, onClose, returnFocusRef }: Props) {
  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas } = useNotificacoes();
  const navigate = useNavigate();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [filtro, setFiltro] = useState<FiltroNotif>("todos");

  const notificacoesFiltradas = useMemo(
    () => filtro === "todos" ? notificacoes : notificacoes.filter((n) => n.tipo === filtro),
    [notificacoes, filtro],
  );

  // ESC to close + focus management
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      returnFocusRef?.current?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  const grupos = useMemo(() => {
    const map = new Map<string, Notificacao[]>();
    for (const n of notificacoesFiltradas) {
      const g = grupo(n.criadaEm);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(n);
    }
    const ordem = ["HOJE", "ONTEM", "ESTA SEMANA", "MAIS ANTIGAS"];
    return ordem.filter((k) => map.has(k)).map((k) => ({ label: k, items: map.get(k)! }));
  }, [notificacoesFiltradas]);

  const handleClick = (n: Notificacao) => {
    marcarComoLida(n.id);
    onClose();
    navigate({ to: n.rota });
  };

  return (
    <>
      {open && (
        <div
          aria-hidden
          onClick={onClose}
          className="fixed inset-0"
          style={{ background: "rgba(0,0,0,0.3)", zIndex: 59 }}
        />
      )}
      <aside
        role="dialog"
        aria-label="Notificações"
        aria-hidden={!open}
        className="fixed top-0 right-0 h-screen flex flex-col"
        style={{
          width: 380,
          maxWidth: "100vw",
          background: COLORS.surface,
          zIndex: 60,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          boxShadow: open ? "-8px 0 24px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 shrink-0" style={{ background: COLORS.brand, color: "#fff" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellIcon size={18} />
              <h2 className="text-[16px] font-semibold">Notificações</h2>
            </div>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              aria-label="Fechar painel"
              className="p-1 rounded hover:opacity-80"
              style={{ color: "#fff" }}
            >
              <XIcon size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[12px]" style={{ color: "#a8c7ff" }}>
              {naoLidas === 0 ? "Tudo em dia" : `${naoLidas} não lida${naoLidas > 1 ? "s" : ""}`}
            </span>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="text-[12px] hover:underline"
                style={{ color: "#a8c7ff" }}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div
          className="px-4 py-3 shrink-0 flex gap-2 overflow-x-auto"
          style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}
        >
          {FILTROS.map((f) => {
            const ativo = filtro === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className="text-[11px] font-medium px-3 py-1 rounded-full whitespace-nowrap transition-colors"
                style={{
                  background: ativo ? f.cor : "transparent",
                  color: ativo ? "#fff" : f.cor,
                  border: `1px solid ${f.cor}`,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {grupos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <BellOffIcon size={48} color="#cbd5e1" />
              <div className="mt-3 text-[14px] font-medium" style={{ color: COLORS.textPrimary }}>
                Nenhuma notificação
              </div>
              <div className="text-[12px] mt-1" style={{ color: COLORS.textMuted }}>
                Todos os contratos estão em dia.
              </div>
            </div>
          ) : (
            grupos.map((g) => (
              <div key={g.label}>
                <div
                  className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "#6b7a99", borderBottom: `1px solid ${COLORS.bgPage}` }}
                >
                  {g.label}
                </div>
                {g.items.map((n) => (
                  <NotificacaoItem key={n.id} n={n} onClick={handleClick} />
                ))}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

function BellIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function BellOffIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.7 3.3A6 6 0 0 1 18 8c0 3 .8 5.2 1.7 6.7M6.4 6.4A6 6 0 0 0 6 8c0 7-3 9-3 9h14M10.3 21a1.94 1.94 0 0 0 3.4 0M2 2l20 20" />
    </svg>
  );
}
