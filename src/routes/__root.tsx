import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Sidebar } from "@/components/Sidebar";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#f0f2f8" }}>
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold" style={{ color: "#071040" }}>404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ background: "#071040" }}
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#f0f2f8" }}>
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm" style={{ color: "#64748b" }}>{error.message}</p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Experiência — Gestão de contratos" },
      { name: "description", content: "Sistema de gestão de contratos de experiência trabalhista." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ background: "#f0f2f8", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ marginLeft: 240, padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}
