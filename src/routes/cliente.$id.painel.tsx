import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useAppStore } from "@/store/appStore";

export const Route = createFileRoute("/cliente/$id/painel")({
  head: () => ({ meta: [{ title: "Painel do cliente — Arbrent" }] }),
  component: PainelCliente,
});

function PainelCliente() {
  const { id } = Route.useParams();
  const empresa = useAppStore((s) => s.empresas.find((e) => e.id === id));
  if (!empresa) throw notFound();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: "#f8fafc" }}>
      <h1 className="text-3xl font-semibold mb-2" style={{ color: "#0f172a" }}>{empresa.razaoSocial}</h1>
      <p className="text-[14px]" style={{ color: "#64748b" }}>Painel limpo para reunião — em construção</p>
      <Link to="/empresas/$id" params={{ id }} className="mt-6 text-[12px]" style={{ color: "#4f8ef7" }}>← Voltar para a empresa</Link>
    </div>
  );
}
