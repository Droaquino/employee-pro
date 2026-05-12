import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Surface } from "@/components/Surface";
import { useAppStore } from "@/store/appStore";
import { ContratosTable } from "@/components/ContratosTable";

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos — Experiência" },
      { name: "description", content: "Listagem completa de contratos de experiência." },
    ],
  }),
  component: ContratosPage,
});

function ContratosPage() {
  const empresas = useAppStore((s) => s.empresas);
  const contratos = useAppStore((s) => s.contratos);
  const [empresaId, setEmpresaId] = useState<string>("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return contratos.filter((c) => {
      if (empresaId && c.empresaId !== empresaId) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!c.funcionarioNome.toLowerCase().includes(q) && !c.cargo.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [contratos, empresaId, query]);

  return (
    <div>
      <PageHeader title="Contratos" subtitle="Todos os contratos de experiência da carteira." />
      <Surface>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar funcionário ou cargo…"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-md text-[13px] outline-none"
            style={{ border: "1px solid #e2e5f0", background: "#f0f2f8" }}
          />
          <select
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            className="px-3 py-2 rounded-md text-[13px] outline-none"
            style={{ border: "1px solid #e2e5f0", background: "#fff" }}
          >
            <option value="">Todas as empresas</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nomeFantasia}</option>)}
          </select>
          <span className="text-[12px]" style={{ color: "#64748b" }}>{filtered.length} contrato(s)</span>
        </div>
        <ContratosTable contratos={filtered} />
      </Surface>
    </div>
  );
}
