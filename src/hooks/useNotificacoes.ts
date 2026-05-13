import { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, getISOWeek, getISOWeekYear, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppStore } from "@/store/appStore";

const STORAGE_KEY = "arbrent_notificacoes";

type Stored = { lidas: string[]; lastResumo: string | null };

function loadStored(): Stored {
  if (typeof window === "undefined") return { lidas: [], lastResumo: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : { lidas: [], lastResumo: null };
  } catch {
    return { lidas: [], lastResumo: null };
  }
}

function saveStored(s: Stored) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

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

export function useNotificacoes() {
  const contratos = useAppStore((s) => s.contratos);
  const empresas = useAppStore((s) => s.empresas);

  const [stored, setStored] = useState<Stored>(() => loadStored());
  const [filtro, setFiltro] = useState<FiltroNotif>("todos");

  // garantir que o resumo diário do dia seja gerado uma vez (atualiza lastResumo)
  useEffect(() => {
    const hoje = format(startOfDay(new Date()), "yyyy-MM-dd");
    if (stored.lastResumo !== hoje) {
      const next = { ...stored, lastResumo: hoje };
      setStored(next);
      saveStored(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas]);

  const notificacoes = useMemo<Notificacao[]>(() => {
    const hoje = startOfDay(new Date());
    const lidas = new Set(stored.lidas);
    const list: Notificacao[] = [];
    const seen = new Set<string>();

    const push = (n: Omit<Notificacao, "lida">) => {
      if (seen.has(n.id)) return;
      seen.add(n.id);
      list.push({ ...n, lida: lidas.has(n.id) });
    };

    // Por contrato
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
          descricao: `Venceu há ${Math.abs(dias)} dia(s) e não foi regularizado. ${empNome}`,
          empresaId: c.empresaId,
          contratoId: c.id,
          criadaEm: hoje,
          rota: rotaContrato,
          rotaLabel: "Ver contrato",
        });
      } else if (dias <= 7) {
        push({
          id: `vencimento_iminente_${c.id}`,
          tipo: "urgente",
          categoria: "vencimento_iminente",
          titulo: `${c.funcionarioNome} — vence em ${dias} dia(s)`,
          descricao: `${empNome} · ${c.cargo} · 2ª prorrogação`,
          empresaId: c.empresaId,
          contratoId: c.id,
          criadaEm: hoje,
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
          criadaEm: hoje,
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
          criadaEm: hoje,
          rota: rotaContrato,
          rotaLabel: "Ver contrato",
        });
      }

      if (dias >= 0 && dias <= 7) porEmpresa7d.set(c.empresaId, (porEmpresa7d.get(c.empresaId) ?? 0) + 1);
      if (dias >= 0 && dias <= 30) porEmpresa30d.set(c.empresaId, (porEmpresa30d.get(c.empresaId) ?? 0) + 1);
    }

    // Lote por empresa — crítico (>=3 em 7d)
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
        criadaEm: hoje,
        rota: `/empresas/${empId}`,
        rotaLabel: "Ver empresa",
      });
    }

    // Lote por empresa — atenção (>=5 em 30d)
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
        criadaEm: hoje,
        rota: `/empresas/${empId}`,
        rotaLabel: "Ver empresa",
      });
    }

    // Resumo diário (info)
    let risco = 0, proximo = 0, vencido = 0;
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
      criadaEm: hoje,
      rota: "/",
      rotaLabel: "Ver dashboard",
    });

    // Ordenação: não lidas (urgente > atencao > info) por data desc, depois lidas por data desc
    list.sort((a, b) => {
      if (a.lida !== b.lida) return a.lida ? 1 : -1;
      const r = TIPO_RANK[a.tipo] - TIPO_RANK[b.tipo];
      if (r !== 0) return r;
      return b.criadaEm.getTime() - a.criadaEm.getTime();
    });

    return list;
  }, [contratos, empresaMap, stored.lidas]);

  const naoLidas = useMemo(() => notificacoes.filter((n) => !n.lida).length, [notificacoes]);

  const naoLidasPorTipo = useMemo(() => {
    const m: Record<TipoNotif, number> = { urgente: 0, atencao: 0, info: 0 };
    for (const n of notificacoes) if (!n.lida) m[n.tipo]++;
    return m;
  }, [notificacoes]);

  const notificacoesFiltradas = useMemo(() => {
    if (filtro === "todos") return notificacoes;
    return notificacoes.filter((n) => n.tipo === filtro);
  }, [notificacoes, filtro]);

  const marcarComoLida = useCallback((id: string) => {
    setStored((prev) => {
      if (prev.lidas.includes(id)) return prev;
      const next = { ...prev, lidas: [...prev.lidas, id] };
      saveStored(next);
      return next;
    });
  }, []);

  const marcarTodasComoLidas = useCallback(() => {
    setStored((prev) => {
      const ids = notificacoes.map((n) => n.id);
      const set = new Set([...prev.lidas, ...ids]);
      const next = { ...prev, lidas: Array.from(set) };
      saveStored(next);
      return next;
    });
  }, [notificacoes]);

  return {
    notificacoes,
    notificacoesFiltradas,
    naoLidas,
    naoLidasPorTipo,
    filtro,
    filtrar: setFiltro,
    marcarComoLida,
    marcarTodasComoLidas,
  };
}
