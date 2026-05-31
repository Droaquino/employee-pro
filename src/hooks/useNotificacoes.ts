import { useCallback, useMemo } from "react";
import {
  differenceInCalendarDays,
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppStore } from "@/store/appStore";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useContratos } from "@/hooks/useContratos";
import { useHistorico } from "@/hooks/useHistorico";

export type TipoNotif = "urgente" | "atencao" | "info";
export type FiltroNotif = "todos" | TipoNotif;

export type Notificacao = {
  id: string;
  tipo: TipoNotif;
  categoria: string;
  titulo: string;
  descricao: string;
  empresaId: string | null;
  contratoId: string | null;
  lida: boolean;
  criadaEm: Date;
  rota: string;
  rotaLabel: string;
};

const TIPO_RANK: Record<TipoNotif, number> = { urgente: 0, atencao: 1, info: 2 };

// History events that should surface as notifications
const HISTORICO_NOTIF = new Set([
  "CONTRATO_RENOVADO",
  "CONTRATO_ENCERRADO",
  "COLABORADOR_CRIADO",
  "EMPRESA_CRIADA",
]);

const HISTORICO_LABEL: Record<
  string,
  { titulo: (d: string) => string; rota: string; rotaLabel: string }
> = {
  CONTRATO_RENOVADO: { titulo: (d) => d, rota: "/contratos", rotaLabel: "Ver contratos" },
  CONTRATO_ENCERRADO: { titulo: (d) => d, rota: "/historico", rotaLabel: "Ver histórico" },
  COLABORADOR_CRIADO: { titulo: (d) => d, rota: "/empresas", rotaLabel: "Ver empresas" },
  EMPRESA_CRIADA: { titulo: (d) => d, rota: "/empresas", rotaLabel: "Ver empresas" },
};

export function useNotificacoes() {
  const { data: contratos = [] } = useContratos();
  const { data: empresas = [] } = useEmpresas();
  const { data: historico = [] } = useHistorico();
  const notifLidas = useAppStore((s) => s.notifLidas);
  const _marcarLida = useAppStore((s) => s.marcarNotifLida);
  const _marcarTodasLidas = useAppStore((s) => s.marcarTodasNotifLidas);

  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas]);

  const notificacoes = useMemo<Notificacao[]>(() => {
    const hoje = startOfDay(new Date());
    const agora = new Date();
    const lidas = new Set(notifLidas);
    const list: Notificacao[] = [];
    const seen = new Set<string>();

    const push = (n: Omit<Notificacao, "lida">) => {
      if (seen.has(n.id)) return;
      seen.add(n.id);
      list.push({ ...n, lida: lidas.has(n.id) });
    };

    // ── Contract-based notifications ─────────────────────────────────────────
    const semana = `${getISOWeekYear(hoje)}-W${getISOWeek(hoje)}`;
    const porEmpresa7d = new Map<string, number>();
    const porEmpresa30d = new Map<string, number>();

    for (const c of contratos) {
      if (c.encerrado) continue;
      const venc = startOfDay(parseISO(c.vencimentoSegundo));
      const dias = differenceInCalendarDays(venc, hoje);
      const emp = empresaMap.get(c.empresaId);
      const empNome = emp?.nomeFantasia ?? "Empresa";
      const rotaContrato = `/empresas/${c.empresaId}`;

      if (dias < 0) {
        push({
          id: `vencido_nao_regularizado_${c.id}`,
          tipo: "urgente",
          categoria: "vencido_nao_regularizado",
          titulo: `${c.funcionarioNome} — contrato VENCIDO`,
          descricao: `Venceu há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"} e não foi regularizado. ${empNome}`,
          empresaId: c.empresaId,
          contratoId: c.id,
          criadaEm: agora,
          rota: rotaContrato,
          rotaLabel: "Ver contrato",
        });
      } else if (dias <= 7) {
        push({
          id: `vencimento_iminente_${c.id}`,
          tipo: "urgente",
          categoria: "vencimento_iminente",
          titulo: `${c.funcionarioNome} — vence em ${dias === 0 ? "hoje" : `${dias} ${dias === 1 ? "dia" : "dias"}`}`,
          descricao: `${empNome} · ${c.cargo} · 2ª prorrogação`,
          empresaId: c.empresaId,
          contratoId: c.id,
          criadaEm: agora,
          rota: rotaContrato,
          rotaLabel: "Ver contrato",
        });
      } else if (dias <= 15) {
        push({
          id: `proximo_vencimento_${c.id}`,
          tipo: "atencao",
          categoria: "proximo_vencimento",
          titulo: `${c.funcionarioNome} — vence em ${dias} dias`,
          descricao: `Agende avaliação. ${empNome} · ${c.cargo}`,
          empresaId: c.empresaId,
          contratoId: c.id,
          criadaEm: agora,
          rota: rotaContrato,
          rotaLabel: "Ver contrato",
        });
      } else if (dias <= 30) {
        push({
          id: `janela_decisao_${c.id}`,
          tipo: "atencao",
          categoria: "janela_decisao",
          titulo: `${c.funcionarioNome} — vence em ${dias} dias`,
          descricao: `Defina se será efetivado ou encerrado. ${empNome}`,
          empresaId: c.empresaId,
          contratoId: c.id,
          criadaEm: agora,
          rota: rotaContrato,
          rotaLabel: "Ver contrato",
        });
      }

      if (dias >= 0 && dias <= 7)
        porEmpresa7d.set(c.empresaId, (porEmpresa7d.get(c.empresaId) ?? 0) + 1);
      if (dias >= 0 && dias <= 30)
        porEmpresa30d.set(c.empresaId, (porEmpresa30d.get(c.empresaId) ?? 0) + 1);
    }

    // Batch by company — critical (≥3 in 7d)
    for (const [empId, n] of porEmpresa7d) {
      if (n < 3) continue;
      const emp = empresaMap.get(empId);
      push({
        id: `lote_empresa_critico_${empId}_${semana}`,
        tipo: "urgente",
        categoria: "lote_empresa_critico",
        titulo: `${emp?.nomeFantasia ?? "Empresa"} — ${n} contratos vencem esta semana`,
        descricao: "Ação imediata necessária para evitar passivo trabalhista",
        empresaId: empId,
        contratoId: null,
        criadaEm: agora,
        rota: `/empresas/${empId}`,
        rotaLabel: "Ver empresa",
      });
    }

    // Batch by company — attention (≥5 in 30d)
    for (const [empId, n] of porEmpresa30d) {
      if (n < 5) continue;
      const emp = empresaMap.get(empId);
      push({
        id: `lote_empresa_atencao_${empId}_${semana}`,
        tipo: "atencao",
        categoria: "lote_empresa_atencao",
        titulo: `${emp?.nomeFantasia ?? "Empresa"} — ${n} contratos vencem nos próximos 30 dias`,
        descricao: "Planeje as avaliações com antecedência",
        empresaId: empId,
        contratoId: null,
        criadaEm: agora,
        rota: `/empresas/${empId}`,
        rotaLabel: "Ver empresa",
      });
    }

    // ── History-based notifications (last 24 h) ───────────────────────────────
    const limite24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    for (const ev of historico) {
      if (!HISTORICO_NOTIF.has(ev.tipo)) continue;
      const evAt = new Date(ev.at);
      if (evAt < limite24h) continue;
      const meta = HISTORICO_LABEL[ev.tipo];
      push({
        id: `historico_${ev.id}`,
        tipo: "info",
        categoria: ev.tipo.toLowerCase(),
        titulo: meta.titulo(ev.descricao),
        descricao: `Registrado ${format(evAt, "HH:mm", { locale: ptBR })}`,
        empresaId: null,
        contratoId: null,
        criadaEm: evAt,
        rota: meta.rota,
        rotaLabel: meta.rotaLabel,
      });
    }

    // ── Daily summary (info) ──────────────────────────────────────────────────
    let risco = 0,
      proximo = 0,
      vencido = 0;
    for (const c of contratos) {
      if (c.encerrado) continue;
      const dias = differenceInCalendarDays(startOfDay(parseISO(c.vencimentoSegundo)), hoje);
      if (dias < 0) vencido++;
      else if (dias <= 15) risco++;
      else if (dias <= 30) proximo++;
    }
    const dataExtenso = format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR });
    push({
      id: `resumo_diario_${format(hoje, "yyyy-MM-dd")}`,
      tipo: "info",
      categoria: "resumo_diario",
      titulo: `Resumo do dia — ${dataExtenso}`,
      descricao: `${risco} em risco · ${proximo} próximos do vencimento · ${vencido} vencidos`,
      empresaId: null,
      contratoId: null,
      criadaEm: agora,
      rota: "/",
      rotaLabel: "Ver dashboard",
    });

    // Sort: unread first (urgente > atencao > info), newest first; then read
    list.sort((a, b) => {
      if (a.lida !== b.lida) return a.lida ? 1 : -1;
      const r = TIPO_RANK[a.tipo] - TIPO_RANK[b.tipo];
      if (r !== 0) return r;
      return b.criadaEm.getTime() - a.criadaEm.getTime();
    });

    return list;
  }, [contratos, empresaMap, historico, notifLidas]);

  const naoLidas = useMemo(() => notificacoes.filter((n) => !n.lida).length, [notificacoes]);

  const naoLidasPorTipo = useMemo(() => {
    const m: Record<TipoNotif, number> = { urgente: 0, atencao: 0, info: 0 };
    for (const n of notificacoes) if (!n.lida) m[n.tipo]++;
    return m;
  }, [notificacoes]);

  const marcarComoLida = useCallback((id: string) => _marcarLida(id), [_marcarLida]);

  const marcarTodasComoLidas = useCallback(() => {
    _marcarTodasLidas(notificacoes.map((n) => n.id));
  }, [_marcarTodasLidas, notificacoes]);

  return {
    notificacoes,
    naoLidas,
    naoLidasPorTipo,
    marcarComoLida,
    marcarTodasComoLidas,
  };
}
