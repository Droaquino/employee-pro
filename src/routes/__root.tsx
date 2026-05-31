import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import appCss from "../styles.css?url";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { CalculadoraPrazo } from "@/components/CalculadoraPrazo";
import { BuscaGlobal } from "@/components/BuscaGlobal";
import { NotificacoesPainel } from "@/components/NotificacoesPainel";
import { NotificacaoTopBar } from "@/components/NotificacaoTopBar";
import { useAppStore } from "@/store/appStore";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function NotFoundComponent() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "#f0f2f8" }}
    >
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold" style={{ color: "#071040" }}>
          404
        </h1>
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
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "#f0f2f8" }}
    >
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
          {error.message}
        </p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Arbrent — Gestão de contratos de experiência" },
      {
        name: "description",
        content:
          "Sistema Arbrent Contabilidade para gestão de contratos de experiência trabalhista.",
      },
      { property: "og:title", content: "Arbrent — Gestão de contratos de experiência" },
      { name: "twitter:title", content: "Arbrent — Gestão de contratos de experiência" },
      {
        property: "og:description",
        content:
          "Sistema Arbrent Contabilidade para gestão de contratos de experiência trabalhista.",
      },
      {
        name: "twitter:description",
        content:
          "Sistema Arbrent Contabilidade para gestão de contratos de experiência trabalhista.",
      },
      { property: "og:type", content: "website" },
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
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NavProgressBar() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
    } else {
      timerRef.current = setTimeout(() => setVisible(false), 400);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading]);

  if (!visible) return null;
  return (
    <div
      className="nav-progress-bar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 3,
        background: "linear-gradient(90deg, #4f8ef7, #a78bfa)",
        zIndex: 9999,
        borderRadius: "0 2px 2px 0",
      }}
    />
  );
}

function PageTransition({ children, routeKey }: { children: React.ReactNode; routeKey: string }) {
  const [animKey, setAnimKey] = useState(routeKey);
  useEffect(() => {
    setAnimKey(routeKey);
  }, [routeKey]);
  return (
    <div key={animKey} className="page-enter">
      {children}
    </div>
  );
}

/** Guard: redireciona para /login se não logado */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session && pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [loading, session, pathname, navigate]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#f0f2f8" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#071040" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e8ecff"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="text-[13px]" style={{ color: "#64748b" }}>
            Carregando…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isClientPanel = /^\/cliente\/[^/]+\/painel/.test(pathname);
  const isLoginPage = pathname === "/login";
  const notifPainelOpen = useAppStore((s) => s.notifPainelOpen);
  const fecharNotifPainel = useAppStore((s) => s.fecharNotifPainel);

  if (isClientPanel) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthGuard>
            <Outlet />
            <Toaster richColors position="bottom-right" />
          </AuthGuard>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  if (isLoginPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
          <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          <NavProgressBar />
          <div style={{ background: "#f0f2f8", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{ marginLeft: 240, padding: 24 }}>
              <PageTransition routeKey={pathname}>
                <Outlet />
              </PageTransition>
            </main>
            <Toaster richColors position="bottom-right" />
            <CalculadoraPrazo />
            <BuscaGlobal />
            <NotificacaoTopBar />
            <NotificacoesPainel open={notifPainelOpen} onClose={fecharNotifPainel} />
          </div>
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}
