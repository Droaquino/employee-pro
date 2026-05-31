import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  addMonths,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/Surface";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore } from "@/store/appStore";
import { toCsv, downloadCsv, csvDateStamp } from "@/lib/csv";
import { calcStatus } from "@/hooks/useStatusContrato";
import { STATUS_LABEL, STATUS_COLOR } from "@/constants/colors";
import type { Contrato, Empresa } from "@/data/mock";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Arbrent" },
      { name: "description", content: "Relatórios consolidados da carteira." },
    ],
  }),
  component: Relatorios,
});

type Aba = "vencimentos" | "empresas" | "encerrados";

const AVATAR_PALETTE = [
  "#4f8ef7",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
];

function avatarColor(empresaId: string, empresas: Empresa[]) {
  const idx = empresas.findIndex((e) => e.id === empresaId);
  return AVATAR_PALETTE[(idx >= 0 ? idx : 0) % AVATAR_PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── sub-components ────────────────────────────────────────────────────────

function PillTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all"
      style={
        active
          ? { background: "#071040", color: "#fff" }
          : { background: "#fff", color: "#64748b", border: "1px solid #e2e5f0" }
      }
    >
      {label}
      <span
        className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center"
        style={
          active
            ? { background: "rgba(255,255,255,0.2)", color: "#e8ecff" }
            : { background: "#f0f2f8", color: "#64748b" }
        }
      >
        {count}
      </span>
    </button>
  );
}

function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors flex-shrink-0"
      style={{ background: "#fff", color: "#071040", border: "1px solid #e2e5f0" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f2f8")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </svg>
      Exportar CSV
    </button>
  );
}

function ToggleFilter({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  const bg = active ? (color ?? "#071040") : "#fff";
  const text = active ? "#fff" : "#64748b";
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
      style={{ background: bg, color: text, border: `1px solid ${active ? (color ?? "#071040") : "#e2e5f0"}` }}
    >
      {color && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: active ? "rgba(255,255,255,0.8)" : color }}
        />
      )}
      {label}
    </button>
  );
}

function Avatar({
  name,
  color,
  size = 36,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#64748b";
  const label =
    status === "RISCO"
      ? "Em risco"
      : status === "PROXIMO"
        ? "Próximo"
        : STATUS_LABEL[status] ?? status;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0"
      style={{ background: color + "1a", color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

function ContratoCard({
  c,
  empresa,
  color,
}: {
  c: Contrato;
  empresa: string;
  color: string;
}) {
  const st = calcStatus(c).status;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
      style={{ background: "#fff", border: "1px solid #e2e5f0" }}
    >
      <Avatar name={c.funcionarioNome} color={color} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: "#0f172a" }}>
          {c.funcionarioNome}
        </p>
        <p className="text-[12px] truncate" style={{ color: "#64748b" }}>
          {c.cargo}
        </p>
      </div>
      <span
        className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-full font-medium flex-shrink-0"
        style={{ background: color + "18", color }}
      >
        {empresa}
      </span>
      <div
        className="hidden md:flex items-center gap-1.5 flex-shrink-0 text-[12px]"
        style={{ color: "#64748b" }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy")}
      </div>
      <StatusBadge status={st} />
    </div>
  );
}

function MonthSection({
  mes,
  list,
  empresas,
}: {
  mes: string;
  list: Contrato[];
  empresas: Empresa[];
}) {
  const emRisco = list.filter(
    (c) => calcStatus(c).status === "RISCO" || calcStatus(c).status === "VENCIDO",
  ).length;
  const label = capitalize(format(parseISO(mes + "-01"), "MMMM 'de' yyyy", { locale: ptBR }));
  const empresaNome = (id: string) =>
    empresas.find((e) => e.id === id)?.nomeFantasia ?? "—";

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>
          {label}
        </span>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full"
          style={{ background: "#f0f2f8", color: "#64748b" }}
        >
          {list.length} contrato{list.length !== 1 ? "s" : ""}
        </span>
        {emRisco > 0 && (
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "#fee2e2", color: "#ef4444" }}
          >
            {emRisco} em risco
          </span>
        )}
        <div className="flex-1 h-px" style={{ background: "#e2e5f0" }} />
      </div>
      <div className="space-y-2">
        {list.map((c) => (
          <ContratoCard
            key={c.id}
            c={c}
            empresa={empresaNome(c.empresaId)}
            color={avatarColor(c.empresaId, empresas)}
          />
        ))}
      </div>
    </div>
  );
}

function EmpresaCard({
  r,
  color,
}: {
  r: { empresa: Empresa; total: number; VIGENTE: number; PROXIMO: number; RISCO: number; VENCIDO: number; situacao: "verde" | "amarelo" | "vermelho" };
  color: string;
}) {
  const sitColor =
    r.situacao === "verde" ? "#22c55e" : r.situacao === "amarelo" ? "#f59e0b" : "#ef4444";
  const sitLabel =
    r.situacao === "verde" ? "Saudável" : r.situacao === "amarelo" ? "Atenção" : "Crítico";

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: "#fff", border: "1px solid #e2e5f0" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0"
            style={{ background: color }}
          >
            {r.empresa.nomeFantasia.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "#0f172a" }}>
              {r.empresa.nomeFantasia}
            </p>
            <p className="text-[11px]" style={{ color: "#94a3b8" }}>
              {r.empresa.cnpj}
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0"
          style={{ background: sitColor + "1a", color: sitColor }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: sitColor }}
          />
          {sitLabel}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Total", value: r.total, color: "#64748b" },
          { label: "Vigentes", value: r.VIGENTE, color: "#22c55e" },
          { label: "Próximos", value: r.PROXIMO, color: "#f59e0b" },
          { label: "Em risco", value: r.RISCO, color: "#ef4444" },
          { label: "Vencidos", value: r.VENCIDO, color: "#7f1d1d" },
        ].map(({ label, value, color: c }) => (
          <div
            key={label}
            className="flex flex-col items-center py-2 rounded-lg"
            style={{ background: c + "0d" }}
          >
            <span className="text-[18px] font-bold" style={{ color: c }}>
              {value}
            </span>
            <span className="text-[10px] font-medium text-center leading-tight mt-0.5" style={{ color: c }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EncerradoCard({ c, empresa, color }: { c: Contrato; empresa: string; color: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: "#fff", border: "1px solid #e2e5f0" }}
    >
      <Avatar name={c.funcionarioNome} color={color} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: "#0f172a" }}>
          {c.funcionarioNome}
        </p>
        <p className="text-[12px] truncate" style={{ color: "#64748b" }}>
          {c.cargo}
        </p>
      </div>
      <span
        className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-full font-medium flex-shrink-0"
        style={{ background: color + "18", color }}
      >
        {empresa}
      </span>
      <div className="hidden md:flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="text-[11px]" style={{ color: "#94a3b8" }}>
          Admissão: {format(parseISO(c.dataAdmissao), "dd/MM/yyyy")}
        </span>
        <span className="text-[11px]" style={{ color: "#94a3b8" }}>
          Encerrado: {format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy")}
        </span>
      </div>
      {c.motivoEncerramento && (
        <span
          className="hidden lg:inline-flex text-[11px] px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: "#f0f2f8", color: "#64748b" }}
        >
          {c.motivoEncerramento}
        </span>
      )}
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────

const STATUS_FILTROS = [
  { key: "TODOS", label: "Todos" },
  { key: "VIGENTE", label: "Vigente" },
  { key: "PROXIMO", label: "Próximo" },
  { key: "RISCO", label: "Em risco" },
  { key: "VENCIDO", label: "Vencido" },
] as const;

function Relatorios() {
  const empresas = useAppStore((s) => s.empresas);
  const contratos = useAppStore((s) => s.contratos);
  const [aba, setAba] = useState<Aba>("vencimentos");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const empresaNome = (id: string) =>
    empresas.find((e) => e.id === id)?.nomeFantasia ?? "—";

  // ===== Rel 1: próximos 4 meses =====
  const rel1 = useMemo(() => {
    const hoje = startOfDay(new Date());
    const limite = endOfMonth(addMonths(hoje, 3));
    const filtered = contratos
      .filter((c) => !c.encerrado)
      .filter((c) => {
        const v = parseISO(c.vencimentoSegundo);
        return v >= hoje && v <= limite;
      });
    const grupos = new Map<string, typeof filtered>();
    for (const c of filtered) {
      const key = format(parseISO(c.vencimentoSegundo), "yyyy-MM");
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(c);
    }
    return Array.from(grupos.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [contratos]);

  const rel1Filtrado = useMemo(() => {
    const q = busca.toLowerCase();
    return rel1
      .map(([mes, list]) => {
        const fl = list.filter((c) => {
          const matchQ =
            q === "" ||
            c.funcionarioNome.toLowerCase().includes(q) ||
            empresaNome(c.empresaId).toLowerCase().includes(q);
          const matchSt =
            statusFiltro === "TODOS" || calcStatus(c).status === statusFiltro;
          return matchQ && matchSt;
        });
        return [mes, fl] as [string, typeof fl];
      })
      .filter(([, fl]) => fl.length > 0);
  }, [rel1, busca, statusFiltro]);

  const rel1Total = rel1.reduce((a, [, l]) => a + l.length, 0);
  const rel1Risco = rel1.reduce(
    (a, [, l]) =>
      a + l.filter((c) => ["RISCO", "VENCIDO"].includes(calcStatus(c).status)).length,
    0,
  );

  const exportRel1 = () => {
    const rows = rel1.flatMap(([mes, list]) =>
      list.map((c) => ({
        Mês: format(parseISO(mes + "-01"), "MMMM/yyyy", { locale: ptBR }),
        Empresa: empresaNome(c.empresaId),
        Funcionário: c.funcionarioNome,
        Cargo: c.cargo,
        "Data vencimento": format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy"),
        Status: STATUS_LABEL[calcStatus(c).status],
      })),
    );
    downloadCsv(`contratos_vencimento_${csvDateStamp()}.csv`, toCsv(rows));
  };

  // ===== Rel 2: resumo por empresa =====
  const rel2 = useMemo(
    () =>
      empresas.map((e) => {
        const lista = contratos.filter((c) => c.empresaId === e.id && !c.encerrado);
        const totals = { total: lista.length, VIGENTE: 0, PROXIMO: 0, RISCO: 0, VENCIDO: 0 };
        for (const c of lista) totals[calcStatus(c).status as keyof typeof totals]++;
        const risco = totals.RISCO + totals.VENCIDO;
        const propRisco = totals.total > 0 ? risco / totals.total : 0;
        const sit: "verde" | "amarelo" | "vermelho" =
          propRisco >= 0.3
            ? "vermelho"
            : propRisco > 0 ||
                totals.PROXIMO / Math.max(totals.total, 1) >= 0.3
              ? "amarelo"
              : "verde";
        return { empresa: e, ...totals, situacao: sit };
      }),
    [empresas, contratos],
  );

  const exportRel2 = () => {
    const rows = rel2.map((r) => ({
      Empresa: r.empresa.nomeFantasia,
      CNPJ: r.empresa.cnpj,
      "Total contratos": r.total,
      Vigentes: r.VIGENTE,
      Próximos: r.PROXIMO,
      "Em risco": r.RISCO,
      Vencidos: r.VENCIDO,
      Situação:
        r.situacao === "verde"
          ? "Saudável"
          : r.situacao === "amarelo"
            ? "Atenção"
            : "Crítico",
    }));
    downloadCsv(`resumo_empresas_${csvDateStamp()}.csv`, toCsv(rows));
  };

  // ===== Rel 3: encerrados =====
  const rel3 = useMemo(() => {
    const start = inicio ? startOfMonth(parseISO(inicio + "-01")) : null;
    const end = fim ? endOfMonth(parseISO(fim + "-01")) : null;
    return contratos.filter((c) => {
      if (!c.encerrado) return false;
      if (!start && !end) return true;
      const d = parseISO(c.vencimentoSegundo);
      if (start && end) return isWithinInterval(d, { start, end });
      if (start) return d >= start;
      if (end) return d <= end;
      return true;
    });
  }, [contratos, inicio, fim]);

  const exportRel3 = () => {
    const rows = rel3.map((c) => ({
      Funcionário: c.funcionarioNome,
      Empresa: empresaNome(c.empresaId),
      Cargo: c.cargo,
      Admissão: format(parseISO(c.dataAdmissao), "dd/MM/yyyy"),
      Encerramento: format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy"),
      Motivo: c.motivoEncerramento ?? "—",
    }));
    downloadCsv(`contratos_encerrados_${csvDateStamp()}.csv`, toCsv(rows));
  };

  const encerradosTotal = contratos.filter((c) => c.encerrado).length;

  return (
    <div>
      <Breadcrumb items={[{ label: "Operacional" }, { label: "Relatórios" }]} />
      <PageHeader
        title="Relatórios"
        subtitle="Visões consolidadas e exportáveis para análise estratégica."
      />

      {/* Pill Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <PillTab
          label="Vencimentos"
          count={rel1Total}
          active={aba === "vencimentos"}
          onClick={() => setAba("vencimentos")}
        />
        <PillTab
          label="Por empresa"
          count={empresas.length}
          active={aba === "empresas"}
          onClick={() => setAba("empresas")}
        />
        <PillTab
          label="Encerrados"
          count={encerradosTotal}
          active={aba === "encerrados"}
          onClick={() => setAba("encerrados")}
        />
      </div>

      {/* ── Aba Vencimentos ── */}
      {aba === "vencimentos" && (
        <div className="space-y-5">
          {/* Section header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>
                Contratos a vencer nos próximos 4 meses
              </h2>
              <p className="text-[13px] mt-0.5 flex items-center gap-2" style={{ color: "#64748b" }}>
                {rel1Total} contrato{rel1Total !== 1 ? "s" : ""}
                {rel1Risco > 0 && (
                  <>
                    <span
                      className="inline-block w-1 h-1 rounded-full"
                      style={{ background: "#cbd5e1" }}
                    />
                    <span style={{ color: "#ef4444" }} className="font-medium">
                      {rel1Risco} em risco
                    </span>
                  </>
                )}
              </p>
            </div>
            <ExportBtn onClick={exportRel1} />
          </div>

          {/* Search + filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nome ou empresa…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg outline-none transition-colors"
                style={{ border: "1px solid #e2e5f0", background: "#fff", color: "#0f172a" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4f8ef7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e5f0")}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTROS.map(({ key, label }) => (
                <ToggleFilter
                  key={key}
                  label={label}
                  active={statusFiltro === key}
                  color={key === "TODOS" ? undefined : STATUS_COLOR[key]}
                  onClick={() => setStatusFiltro(key)}
                />
              ))}
            </div>
          </div>

          {/* Month groups */}
          {rel1Filtrado.length === 0 ? (
            <EmptyState
              icon="inbox"
              title={
                busca || statusFiltro !== "TODOS"
                  ? "Nenhum contrato encontrado com esses filtros"
                  : "Sem contratos a vencer nos próximos 4 meses"
              }
            />
          ) : (
            <div className="space-y-6">
              {rel1Filtrado.map(([mes, list]) => (
                <MonthSection key={mes} mes={mes} list={list} empresas={empresas} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Aba Por empresa ── */}
      {aba === "empresas" && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>
                Resumo por empresa
              </h2>
              <p className="text-[13px] mt-0.5" style={{ color: "#64748b" }}>
                {empresas.length} empresa{empresas.length !== 1 ? "s" : ""} ativas
              </p>
            </div>
            <ExportBtn onClick={exportRel2} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {rel2.map((r, i) => (
              <EmpresaCard key={r.empresa.id} r={r} color={AVATAR_PALETTE[i % AVATAR_PALETTE.length]} />
            ))}
          </div>
        </div>
      )}

      {/* ── Aba Encerrados ── */}
      {aba === "encerrados" && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>
                Contratos encerrados
              </h2>
              <p className="text-[13px] mt-0.5" style={{ color: "#64748b" }}>
                {rel3.length} registro{rel3.length !== 1 ? "s" : ""} no período
              </p>
            </div>
            <ExportBtn onClick={exportRel3} />
          </div>

          {/* Period filter */}
          <div
            className="flex items-center gap-3 flex-wrap p-3 rounded-xl"
            style={{ background: "#fff", border: "1px solid #e2e5f0" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              className="flex-shrink-0"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="text-[13px] font-medium" style={{ color: "#64748b" }}>
              Filtrar período
            </span>
            <label className="flex items-center gap-2 text-[13px]" style={{ color: "#0f172a" }}>
              De
              <input
                type="month"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-[13px] outline-none"
                style={{ border: "1px solid #e2e5f0", color: "#0f172a" }}
              />
            </label>
            <label className="flex items-center gap-2 text-[13px]" style={{ color: "#0f172a" }}>
              até
              <input
                type="month"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-[13px] outline-none"
                style={{ border: "1px solid #e2e5f0", color: "#0f172a" }}
              />
            </label>
            {(inicio || fim) && (
              <button
                onClick={() => { setInicio(""); setFim(""); }}
                className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: "#ef4444", background: "#fee2e2" }}
              >
                Limpar
              </button>
            )}
          </div>

          {rel3.length === 0 ? (
            <EmptyState icon="inbox" title="Nenhum contrato encerrado no período" />
          ) : (
            <div className="space-y-2">
              {rel3.map((c) => (
                <EncerradoCard
                  key={c.id}
                  c={c}
                  empresa={empresaNome(c.empresaId)}
                  color={avatarColor(c.empresaId, empresas)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
