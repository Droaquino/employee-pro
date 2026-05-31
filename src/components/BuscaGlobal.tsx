import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { calcStatus } from "@/hooks/useStatusContrato";
import { STATUS_COLOR, STATUS_LABEL } from "@/constants/colors";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useContratos } from "@/hooks/useContratos";

type Result =
  | {
      type: "funcionario";
      id: string;
      nome: string;
      empresa: string;
      status: string;
      diasRestantes: number;
      contratoId: string;
      empresaId: string;
    }
  | { type: "empresa"; id: string; nome: string; total: number; situacao: string };

export function BuscaGlobal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: empresas = [] } = useEmpresas();
  const { data: contratos = [] } = useContratos();

  // Ctrl+K / Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: Result[] = [];
    const empresaMap = new Map(empresas.map((e) => [e.id, e.nomeFantasia]));

    // Contratos (funcionários)
    for (const c of contratos) {
      if (!c.funcionarioNome.toLowerCase().includes(q)) continue;
      const info = calcStatus(c);
      out.push({
        type: "funcionario",
        id: c.id,
        nome: c.funcionarioNome,
        empresa: empresaMap.get(c.empresaId) ?? "",
        status: info.status,
        diasRestantes: info.diasRestantes,
        contratoId: c.id,
        empresaId: c.empresaId,
      });
      if (out.length >= 8) break;
    }

    // Empresas
    if (out.length < 8) {
      for (const e of empresas) {
        if (!e.nomeFantasia.toLowerCase().includes(q) && !e.razaoSocial.toLowerCase().includes(q))
          continue;
        const total = contratos.filter((c) => c.empresaId === e.id && !c.encerrado).length;
        const emRisco = contratos.filter(
          (c) =>
            c.empresaId === e.id &&
            !c.encerrado &&
            ["RISCO", "VENCIDO"].includes(calcStatus(c).status),
        ).length;
        out.push({
          type: "empresa",
          id: e.id,
          nome: e.nomeFantasia,
          total,
          situacao: emRisco > 0 ? `${emRisco} em risco` : "Em dia",
        });
        if (out.length >= 8) break;
      }
    }

    return out.slice(0, 8);
  }, [query, contratos, empresas]);

  const handleSelect = (r: Result) => {
    setOpen(false);
    if (r.type === "empresa") {
      navigate({ to: "/empresas/$id", params: { id: r.id } });
    } else {
      navigate({ to: "/empresas/$id", params: { id: r.empresaId } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[560px] mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "#fff" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid #f1f5f9" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar funcionário, empresa ou contrato..."
            className="flex-1 text-[14px] outline-none"
            style={{ color: "#0f172a" }}
          />
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e5f0" }}
          >
            ESC
          </kbd>
        </div>

        {query.length >= 2 && (
          <div className="max-h-[360px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px]" style={{ color: "#94a3b8" }}>
                Nenhum resultado encontrado
              </div>
            ) : (
              results.map((r, i) => (
                <button
                  key={r.id + i}
                  onClick={() => handleSelect(r)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  style={{ borderBottom: "1px solid #f8fafc" }}
                >
                  {r.type === "funcionario" ? (
                    <>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: STATUS_COLOR[r.status] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[13px] font-medium truncate"
                          style={{ color: "#0f172a" }}
                        >
                          {r.nome}
                        </div>
                        <div className="text-[11px]" style={{ color: "#64748b" }}>
                          {r.empresa} · {STATUS_LABEL[r.status]}
                        </div>
                      </div>
                      <span
                        className="text-[11px] shrink-0"
                        style={{ color: STATUS_COLOR[r.status] }}
                      >
                        {r.diasRestantes < 0
                          ? `vencido`
                          : r.diasRestantes === 0
                            ? "hoje"
                            : `${r.diasRestantes}d`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className="w-6 h-6 rounded shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: "#071040" }}
                      >
                        {r.nome.charAt(0)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[13px] font-medium truncate"
                          style={{ color: "#0f172a" }}
                        >
                          {r.nome}
                        </div>
                        <div className="text-[11px]" style={{ color: "#64748b" }}>
                          {r.total} contrato{r.total !== 1 ? "s" : ""} · {r.situacao}
                        </div>
                      </div>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="2"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-5 text-[12px]" style={{ color: "#94a3b8" }}>
            Digite pelo menos 2 caracteres para buscar funcionários ou empresas.
          </div>
        )}
      </div>
    </div>
  );
}
