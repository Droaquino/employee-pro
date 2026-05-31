import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { useAppStore } from "@/store/appStore";
import { COLORS } from "@/constants/colors";
import type { Notificacao, TipoNotif } from "@/hooks/useNotificacoes";

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

export function NotificacaoTopBar() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const prevUrgentesRef = useRef(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { notificacoes, naoLidas, naoLidasPorTipo, marcarComoLida, marcarTodasComoLidas } =
    useNotificacoes();
  const abrirNotifPainel = useAppStore((s) => s.abrirNotifPainel);

  // Pulse animation when new urgentes appear
  useEffect(() => {
    const urgentes = naoLidasPorTipo.urgente;
    if (urgentes > prevUrgentesRef.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 2500);
      return () => clearTimeout(t);
    }
    prevUrgentesRef.current = urgentes;
  }, [naoLidasPorTipo.urgente]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const urgentes = naoLidasPorTipo.urgente;
  const display = naoLidas > 99 ? "99+" : String(naoLidas);

  // Top-5 unread, then fill with read if needed
  const topItems: Notificacao[] = [];
  for (const n of notificacoes) {
    if (!n.lida && topItems.length < 5) topItems.push(n);
  }
  if (topItems.length < 5) {
    for (const n of notificacoes) {
      if (n.lida && topItems.length < 5) topItems.push(n);
    }
  }

  const hasMore = notificacoes.length > 5;

  return (
    <div style={{ position: "fixed", top: 16, right: 20, zIndex: 55 }}>
      {/* Bell button */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notificações${naoLidas > 0 ? `, ${naoLidas} não lidas` : ""}`}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#fff",
          border: `1.5px solid ${urgentes > 0 ? COLORS.risco : "#e2e5f0"}`,
          boxShadow:
            urgentes > 0
              ? `0 0 0 3px rgba(239,68,68,0.15), 0 2px 8px rgba(0,0,0,0.1)`
              : "0 2px 10px rgba(0,0,0,0.09)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          transition: "box-shadow 0.2s, border-color 0.2s",
          animation: pulse ? "arbrent-pulse 2.5s ease" : undefined,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            urgentes > 0
              ? "0 0 0 3px rgba(239,68,68,0.15), 0 2px 8px rgba(0,0,0,0.1)"
              : "0 2px 10px rgba(0,0,0,0.09)";
        }}
      >
        <BellSvg urgente={urgentes > 0} />
        {naoLidas > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: "0 4px",
              borderRadius: 9,
              background: urgentes > 0 ? COLORS.risco : COLORS.proximo,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
            }}
          >
            {display}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.07)",
            border: "1px solid #e2e5f0",
            overflow: "hidden",
            animation: "page-enter 0.15s ease both",
          }}
        >
          {/* Header */}
          <div style={{ padding: "14px 16px 10px", background: COLORS.brand, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BellSvg size={16} urgente={false} color="#fff" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Notificações</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {naoLidas > 0 && (
                  <button
                    onClick={marcarTodasComoLidas}
                    style={{
                      fontSize: 11,
                      color: "#a8c7ff",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  style={{
                    color: "#a8c7ff",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#a8c7ff", marginTop: 3 }}>
              {naoLidas === 0 ? "Tudo em dia" : `${naoLidas} não lida${naoLidas > 1 ? "s" : ""}`}
            </div>
          </div>

          {/* Notification rows */}
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {topItems.length === 0 ? (
              <div
                style={{
                  padding: "28px 16px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                Nenhuma notificação no momento.
              </div>
            ) : (
              topItems.map((n) => (
                <NotifRow
                  key={n.id}
                  n={n}
                  onClick={() => {
                    marcarComoLida(n.id);
                    setOpen(false);
                    navigate({ to: n.rota });
                  }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => {
                setOpen(false);
                abrirNotifPainel();
              }}
              style={{
                fontSize: 12,
                color: COLORS.brandAccent,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {hasMore ? "Ver todas as notificações →" : "Abrir painel completo →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline notification row ───────────────────────────────────────────────────
function NotifRow({ n, onClick }: { n: Notificacao; onClick: () => void }) {
  const cor = TIPO_COR[n.tipo];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "11px 16px",
        background: n.lida ? "#fff" : "#f0f4ff",
        borderLeft: `3px solid ${n.lida ? "#e2e5f0" : cor}`,
        borderBottom: "1px solid #f8fafc",
        display: "block",
        cursor: "pointer",
        opacity: n.lida ? 0.72 : 1,
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#f8f9ff";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = n.lida ? "#fff" : "#f0f4ff";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span
          style={{
            marginTop: 3,
            width: 8,
            height: 8,
            borderRadius: 2,
            background: cor,
            flexShrink: 0,
            display: "inline-block",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: cor,
              }}
            >
              {TIPO_LABEL[n.tipo]}
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#0f172a",
              marginTop: 2,
              lineHeight: 1.35,
            }}
          >
            {n.titulo}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{n.descricao}</div>
        </div>
      </div>
    </button>
  );
}

// ── Bell SVG ─────────────────────────────────────────────────────────────────
function BellSvg({
  urgente,
  size = 18,
  color,
}: {
  urgente: boolean;
  size?: number;
  color?: string;
}) {
  const stroke = color ?? (urgente ? COLORS.risco : "#64748b");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
