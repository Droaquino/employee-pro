import { addMonths, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Contrato, Empresa } from "@/data/mock";
import { calcStatus } from "@/hooks/useStatusContrato";

export type Insight = { tone: "neutro" | "atencao" | "critico" | "ok"; texto: string };

export function insightStatus(contratos: Contrato[]): Insight {
  const ativos = contratos.filter((c) => !c.encerrado);
  const total = ativos.length;
  if (total === 0) return { tone: "neutro", texto: "Nenhum contrato ativo na carteira." };
  const counts = { VIGENTE: 0, PROXIMO: 0, RISCO: 0, VENCIDO: 0 };
  for (const c of ativos) counts[calcStatus(c).status]++;
  if (counts.VENCIDO > 0)
    return { tone: "critico", texto: `${counts.VENCIDO} contrato(s) vencido(s) — regularize hoje para evitar efetivação automática.` };
  if (counts.RISCO > 0)
    return { tone: "critico", texto: `${counts.RISCO} contrato(s) em risco (≤15 dias). Decida prorrogar ou encerrar nesta semana.` };
  if (counts.PROXIMO > 0)
    return { tone: "atencao", texto: `${counts.PROXIMO} contrato(s) próximos do vencimento (16–30 dias). Agende avaliação.` };
  return { tone: "ok", texto: `Carteira saudável: ${counts.VIGENTE} vigente(s), sem riscos imediatos.` };
}

export function insightEmpresas(empresas: Empresa[], contratos: Contrato[]): Insight {
  const ativos = contratos.filter((c) => !c.encerrado);
  if (ativos.length === 0) return { tone: "neutro", texto: "Sem contratos ativos para distribuir entre empresas." };
  const porEmpresa = empresas.map((e) => {
    const list = ativos.filter((c) => c.empresaId === e.id);
    const risco = list.filter((c) => {
      const s = calcStatus(c).status;
      return s === "RISCO" || s === "VENCIDO";
    }).length;
    return { nome: e.nomeFantasia, total: list.length, risco };
  });
  const comRisco = porEmpresa.filter((p) => p.risco > 0).sort((a, b) => b.risco - a.risco);
  if (comRisco.length > 0) {
    const top = comRisco[0];
    return {
      tone: "critico",
      texto: `${top.nome} concentra ${top.risco} contrato(s) em risco/vencido — priorize esta empresa.`,
    };
  }
  const maior = [...porEmpresa].sort((a, b) => b.total - a.total)[0];
  return {
    tone: "neutro",
    texto: `${maior.nome} é a maior carteira com ${maior.total} contrato(s) ativo(s).`,
  };
}

export function insightVencimentos(contratos: Contrato[]): Insight {
  const now = startOfMonth(new Date());
  const months = Array.from({ length: 4 }, (_, i) => addMonths(now, i));
  const buckets = months.map((m) => {
    const key = format(m, "yyyy-MM");
    let prim = 0;
    let seg = 0;
    for (const c of contratos) {
      if (c.encerrado) continue;
      if (format(parseISO(c.vencimentoPrimeiro), "yyyy-MM") === key && c.prorrogacaoAtual === 1) prim++;
      if (format(parseISO(c.vencimentoSegundo), "yyyy-MM") === key) seg++;
    }
    return { mes: format(m, "MMMM", { locale: ptBR }), total: prim + seg, seg };
  });
  const pico = buckets.reduce((a, b) => (b.total > a.total ? b : a), buckets[0]);
  if (pico.total === 0) return { tone: "ok", texto: "Sem vencimentos nos próximos 4 meses." };
  const tone = pico.seg >= 5 ? "critico" : pico.seg >= 3 ? "atencao" : "neutro";
  return {
    tone,
    texto: `Pico em ${pico.mes}: ${pico.total} vencimento(s), sendo ${pico.seg} de 2ª prorrogação (efetivação ou desligamento).`,
  };
}

export function insightEvolucao(contratos: Contrato[]): Insight {
  const ativos = contratos.filter((c) => !c.encerrado).length;
  const now = new Date();
  const em60 = contratos.filter((c) => {
    if (c.encerrado) return false;
    const dias = Math.floor((parseISO(c.vencimentoSegundo).getTime() - now.getTime()) / 86400000);
    return dias >= 0 && dias <= 60;
  }).length;
  if (ativos === 0) return { tone: "neutro", texto: "Sem contratos ativos." };
  const pct = Math.round((em60 / ativos) * 100);
  const tone = pct >= 40 ? "critico" : pct >= 20 ? "atencao" : "ok";
  return {
    tone,
    texto: `${em60} de ${ativos} contratos (${pct}%) vencem nos próximos 60 dias.`,
  };
}

export function insightHeatmap(empresas: Empresa[], contratos: Contrato[]): Insight {
  const now = new Date();
  const limit = new Date(now.getTime() + 84 * 86400000); // 12 semanas
  const ativos = contratos.filter((c) => !c.encerrado);
  const noPeriodo = ativos.filter((c) => {
    const v = parseISO(c.vencimentoSegundo);
    return v >= now && v <= limit;
  });
  if (noPeriodo.length === 0) return { tone: "ok", texto: "Sem vencimentos nas próximas 12 semanas." };

  // semana com mais vencimentos por empresa
  const porSemanaEmpresa = new Map<string, number>();
  for (const c of noPeriodo) {
    const v = parseISO(c.vencimentoSegundo);
    const semanaIdx = Math.floor((v.getTime() - now.getTime()) / (7 * 86400000));
    const key = `${c.empresaId}|${semanaIdx}`;
    porSemanaEmpresa.set(key, (porSemanaEmpresa.get(key) ?? 0) + 1);
  }
  let topKey = "";
  let topCount = 0;
  for (const [k, v] of porSemanaEmpresa) if (v > topCount) { topCount = v; topKey = k; }
  if (topCount <= 1) {
    return { tone: "neutro", texto: `${noPeriodo.length} vencimento(s) distribuídos nas próximas 12 semanas — sem concentração relevante.` };
  }
  const [eid, sIdx] = topKey.split("|");
  const emp = empresas.find((e) => e.id === eid)?.nomeFantasia ?? "Empresa";
  const semanaInicio = new Date(now.getTime() + Number(sIdx) * 7 * 86400000);
  const tone = topCount >= 5 ? "critico" : topCount >= 3 ? "atencao" : "neutro";
  return {
    tone,
    texto: `Pico: ${topCount} contratos da ${emp} vencem na semana de ${format(semanaInicio, "dd/MM", { locale: ptBR })}.`,
  };
}
