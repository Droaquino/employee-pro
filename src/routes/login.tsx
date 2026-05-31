import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Entrar — Arbrent" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, loading, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redireciona se já logado
  if (!loading && session) {
    navigate({ to: "/" });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao fazer login";
      if (msg.includes("Invalid login credentials")) {
        setError("E-mail ou senha inválidos.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Confirme seu e-mail antes de acessar.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#f0f2f8" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: "#fff", border: "1px solid #e2e5f0" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
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
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <p className="text-[16px] font-bold leading-tight" style={{ color: "#071040" }}>
              Arbrent
            </p>
            <p className="text-[11px]" style={{ color: "#64748b" }}>
              Contabilidade · Experiência
            </p>
          </div>
        </div>

        <h1 className="text-[20px] font-semibold mb-1" style={{ color: "#0f172a" }}>
          Entrar
        </h1>
        <p className="text-[13px] mb-6" style={{ color: "#64748b" }}>
          Use o e-mail e senha enviados pelo seu supervisor.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "#0f172a" }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-colors"
              style={{ border: "1px solid #e2e5f0", color: "#0f172a" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4f8ef7")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e5f0")}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "#0f172a" }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-colors"
              style={{ border: "1px solid #e2e5f0", color: "#0f172a" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4f8ef7")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e5f0")}
            />
          </div>

          {error && (
            <div
              className="px-3 py-2.5 rounded-lg text-[12px]"
              style={{ background: "#fee2e2", color: "#b91c1c" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-opacity"
            style={{ background: "#071040", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-center text-[11px] mt-6" style={{ color: "#94a3b8" }}>
          Não tem acesso? Peça ao seu supervisor para te convidar.
        </p>
      </div>
    </div>
  );
}
