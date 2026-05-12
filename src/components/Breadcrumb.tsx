import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type Crumb = {
  label: string;
  to?: string;
  params?: Record<string, string>;
};

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Caminho" className="text-[12px] mb-3 flex items-center flex-wrap gap-1.5" style={{ color: "#64748b" }}>
      {items.map((c, i) => {
        const last = i === items.length - 1;
        const sep = i > 0 ? <Sep key={`s${i}`} /> : null;
        const node: ReactNode = last || !c.to ? (
          <span key={i} style={{ color: "#0f172a", fontWeight: 500 }}>{c.label}</span>
        ) : (
          <Link key={i} to={c.to as any} params={c.params as any} style={{ color: "#4f8ef7" }}>
            {c.label}
          </Link>
        );
        return (
          <span key={`w${i}`} className="inline-flex items-center gap-1.5">
            {sep}
            {node}
          </span>
        );
      })}
    </nav>
  );
}

function Sep() {
  return <span style={{ color: "#cbd5e1" }}>›</span>;
}
