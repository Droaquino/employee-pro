import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { useAppStore } from "@/store/appStore";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { SinoNotificacoes } from "@/components/SinoNotificacoes";
import logo from "@/assets/arbrent-logo.png";

type Item = {
  to: string;
  label: string;
  icon: React.ReactNode;
  badgeKey?: "risco" | "proximo";
  showDotKey?: "urgenteNaoLida";
};

type Group = { label: string; items: Item[] };

const Icon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const groups: Group[] = [
  { label: "Visão geral", items: [
    { to: "/", label: "Dashboard geral", icon: <Icon d="M3 12l9-9 9 9M5 10v10h14V10" />, showDotKey: "urgenteNaoLida" },
  ]},
  { label: "Gestão", items: [
    { to: "/empresas", label: "Empresas", icon: <Icon d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /> },
    { to: "/contratos", label: "Contratos", icon: <Icon d="M8 3h8l4 4v14H4V3zM8 13h8M8 17h5M8 9h4" /> },
  ]},
  { label: "Alertas", items: [
    { to: "/em-risco", label: "Em risco", icon: <Icon d="M12 3l10 18H2L12 3zM12 10v5M12 18v.5" />, badgeKey: "risco" },
    { to: "/proximos-vencimentos", label: "Próximos vencimentos", icon: <Icon d="M12 8v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, badgeKey: "proximo" },
  ]},
  { label: "Operacional", items: [
    { to: "/relatorios", label: "Relatórios", icon: <Icon d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6" /> },
    { to: "/historico", label: "Histórico", icon: <Icon d="M3 12a9 9 0 109-9M3 12l3-3M3 12l3 3M12 7v5l3 2" /> },
    { to: "/configuracoes", label: "Configurações", icon: <Icon d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /> },
  ]},
];

export function Sidebar() {
  const location = useLocation();
  const contratos = useAppStore((s) => s.contratos);
  const abrirNotifPainel = useAppStore((s) => s.abrirNotifPainel);
  const { naoLidas, naoLidasPorTipo } = useNotificacoes();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const counts = useMemo(() => {
    if (!mounted) return { risco: 0, proximo: 0 };
    const hoje = startOfDay(new Date());
    let risco = 0, proximo = 0;
    for (const c of contratos) {
      if (c.encerrado) continue;
      const dias = differenceInCalendarDays(startOfDay(parseISO(c.vencimentoSegundo)), hoje);
      if (dias < 0 || dias <= 15) risco++;
      else if (dias <= 30) proximo++;
    }
    return { risco, proximo };
  }, [contratos, mounted]);

  return (
    <>
      <aside style={{ background: "#071040", color: "#e8ecff" }} className="fixed inset-y-0 left-0 w-[240px] flex flex-col h-screen overflow-y-auto">
        <div className="px-5 pt-6 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-white p-1.5">
              <img src={logo} alt="Logo Arbrent" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight">Arbrent</div>
              <div className="text-[11px]" style={{ color: "#a8b3e8" }}>Contabilidade · Experiência</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-4">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 mb-1.5 uppercase text-[10px] tracking-wider font-semibold" style={{ color: "#4f6bab" }}>{g.label}</div>
              <div className="space-y-1">
                {g.items.map((it) => {
                  const active = it.to === "/" ? location.pathname === "/" : location.pathname.startsWith(it.to);
                  const badge = it.badgeKey ? counts[it.badgeKey] : 0;
                  const badgeColor = it.badgeKey === "risco" ? "#ef4444" : "#f59e0b";
                  const showDot = it.showDotKey === "urgenteNaoLida" && naoLidasPorTipo.urgente > 0;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] relative"
                      style={{
                        background: active ? "#1a2d8a" : "transparent",
                        borderLeft: active ? "3px solid #4f8ef7" : "3px solid transparent",
                        color: active ? "#ffffff" : "#8fa3cc",
                        transition: "background 0.15s ease, color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "#0d1a5e";
                          (e.currentTarget as HTMLElement).style.color = "#c8d4ff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color = "#8fa3cc";
                        }
                      }}
                    >
                      <span className="relative inline-flex">
                        {it.icon}
                        {showDot && (
                          <span
                            aria-label="Há urgentes não lidas"
                            className="absolute"
                            style={{ top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: "#ef4444", border: "1.5px solid #071040" }}
                          />
                        )}
                      </span>
                      <span className="flex-1">{it.label}</span>
                      {badge > 0 && (
                        <span
                          className="text-[11px] font-semibold text-white"
                          style={{ marginLeft: 8, padding: "2px 7px", borderRadius: 10, background: badgeColor, display: "inline-flex", alignItems: "center", lineHeight: 1.4 }}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-2 py-2" style={{ borderTop: "1px solid #1a2d8a" }}>
          <SinoNotificacoes count={naoLidas} onClick={abrirNotifPainel} />
        </div>

        <div className="px-4 py-4 border-t" style={{ borderColor: "#1a2d8a" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "#1a2d8a" }}>AB</div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate">Ana Beatriz</div>
              <div className="text-[10px] truncate" style={{ color: "#a8b3e8" }}>Analista de DP</div>
            </div>
            <button aria-label="Sair" title="Sair" className="p-1.5 rounded hover:opacity-80" style={{ color: "#a8b3e8" }}>
              <Icon d="M15 12H3M9 6L3 12l6 6M21 4v16" />
            </button>
          </div>
        </div>
      </aside>

    </>
  );
}
