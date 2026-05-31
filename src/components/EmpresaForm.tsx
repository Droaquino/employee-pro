import { useEffect, useState } from "react";
import type { Empresa } from "@/data/mock";
import { responsaveis } from "@/data/mock";
import { isValidCnpj, maskCnpj } from "@/lib/cnpj";

type Props = {
  open: boolean;
  initial?: Empresa | null;
  onClose: () => void;
  onSave: (e: Empresa) => void;
};

export function EmpresaForm({ open, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<Empresa>({
    id: "",
    razaoSocial: "",
    cnpj: "",
    nomeFantasia: "",
    responsavelId: responsaveis[0].id,
    email: "",
    telefone: "",
    ativo: true,
    criadoEm: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (initial) setForm(initial);
    else
      setForm({
        id: "",
        razaoSocial: "",
        cnpj: "",
        nomeFantasia: "",
        responsavelId: responsaveis[0].id,
        email: "",
        telefone: "",
        ativo: true,
        criadoEm: new Date().toISOString().slice(0, 10),
      });
  }, [initial, open]);

  const errors = {
    razaoSocial: form.razaoSocial.trim().length < 2 || form.razaoSocial.length > 150,
    cnpj: !isValidCnpj(form.cnpj),
    nomeFantasia: form.nomeFantasia.trim().length < 2,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    telefone: form.telefone.replace(/\D/g, "").length < 10,
  };
  const valid = !Object.values(errors).some(Boolean);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(7,16,64,0.35)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .2s",
          zIndex: 40,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 440,
          background: "#fff",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .25s ease",
          boxShadow: "-8px 0 24px rgba(7,16,64,0.12)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header className="px-6 py-5 border-b" style={{ borderColor: "#e2e5f0" }}>
          <h2 className="text-[16px] font-semibold" style={{ color: "#071040" }}>
            {initial ? "Editar empresa" : "Nova empresa"}
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: "#64748b" }}>
            Cadastro de empresa cliente.
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field
            label="Razão Social"
            error={form.razaoSocial && errors.razaoSocial ? "Obrigatório, máx 150" : ""}
          >
            <input
              className={input}
              maxLength={150}
              value={form.razaoSocial}
              onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
            />
          </Field>
          <Field label="CNPJ" error={form.cnpj && errors.cnpj ? "CNPJ inválido" : ""}>
            <input
              className={input}
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: maskCnpj(e.target.value) })}
              placeholder="00.000.000/0000-00"
            />
          </Field>
          <Field
            label="Nome fantasia"
            error={form.nomeFantasia && errors.nomeFantasia ? "Obrigatório" : ""}
          >
            <input
              className={input}
              value={form.nomeFantasia}
              onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
            />
          </Field>
          <Field label="Responsável interno">
            <select
              className={input}
              value={form.responsavelId}
              onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}
            >
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="E-mail de contato"
            error={form.email && errors.email ? "E-mail inválido" : ""}
          >
            <input
              className={input}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field
            label="Telefone"
            error={form.telefone && errors.telefone ? "Telefone inválido" : ""}
          >
            <input
              className={input}
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(00) 0000-0000"
            />
          </Field>
          <label className="flex items-center gap-3 mt-2 cursor-pointer">
            <button
              type="button"
              onClick={() => setForm({ ...form, ativo: !form.ativo })}
              style={{
                width: 36,
                height: 20,
                borderRadius: 999,
                background: form.ativo ? "#22c55e" : "#cbd5e1",
                position: "relative",
                transition: "background .15s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: form.ativo ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: "#fff",
                  transition: "left .15s",
                }}
              />
            </button>
            <span className="text-[13px]">Empresa {form.ativo ? "ativa" : "inativa"}</span>
          </label>
        </div>

        <footer
          className="px-6 py-4 border-t flex items-center justify-end gap-2"
          style={{ borderColor: "#e2e5f0" }}
        >
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md text-[13px]"
            style={{ color: "#64748b" }}
          >
            Cancelar
          </button>
          <button
            disabled={!valid}
            onClick={() => onSave({ ...form, id: form.id || `e${Date.now()}` })}
            className="px-4 py-2 rounded-md text-[13px] font-medium text-white"
            style={{
              background: valid ? "#071040" : "#94a3b8",
              cursor: valid ? "pointer" : "not-allowed",
            }}
          >
            Salvar
          </button>
        </footer>
      </div>
    </>
  );
}

const input = "w-full px-3 py-2 rounded-md text-[13px] outline-none bg-white";
const inputStyle = (err?: boolean): React.CSSProperties => ({
  border: `1px solid ${err ? "#ef4444" : "#e2e5f0"}`,
});

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: "#0f172a" }}>
        {label}
      </label>
      <div style={inputStyle(!!error)} className="rounded-md">
        {children}
      </div>
      {error && (
        <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}
