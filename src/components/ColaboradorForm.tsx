import { useEffect, useState } from "react";
import type { Colaborador } from "@/data/mock";

type Props = {
  open: boolean;
  initial?: Colaborador | null;
  empresaId: string;
  onClose: () => void;
  onSave: (c: Colaborador) => void;
};

function maskCpfInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  return digits.length === 11;
}

const EMPTY: Colaborador = {
  id: "",
  empresaId: "",
  nome: "",
  cpf: "",
  cargo: "",
  email: "",
  telefone: "",
  ativo: true,
  criadoEm: "",
  prazoRenovacao: undefined,
  observacao: "",
};

export function ColaboradorForm({ open, initial, empresaId, onClose, onSave }: Props) {
  const [form, setForm] = useState<Colaborador>({ ...EMPTY, empresaId });

  useEffect(() => {
    if (initial) {
      setForm(initial);
    } else {
      setForm({ ...EMPTY, empresaId, criadoEm: new Date().toISOString().slice(0, 10) });
    }
  }, [initial, open, empresaId]);

  const errors = {
    nome: form.nome.trim().length < 2 || form.nome.trim().length > 120,
    cpf: form.cpf.trim() !== "" && !isValidCpf(form.cpf),
    cargo: form.cargo.trim().length < 2,
    email: form.email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    telefone: form.telefone.trim() !== "" && form.telefone.replace(/\D/g, "").length < 10,
  };

  const valid =
    form.nome.trim().length >= 2 &&
    form.cargo.trim().length >= 2 &&
    !errors.cpf &&
    !errors.email &&
    !errors.telefone;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(7,16,64,0.35)",
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity .2s", zIndex: 40,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, height: "100vh", width: 440,
          background: "#fff",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .25s ease",
          boxShadow: "-8px 0 24px rgba(7,16,64,0.12)", zIndex: 50,
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <header className="px-6 py-5 border-b" style={{ borderColor: "#e2e5f0" }}>
          <h2 className="text-[16px] font-semibold" style={{ color: "#071040" }}>
            {initial ? "Editar colaborador" : "Novo colaborador"}
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: "#64748b" }}>
            {initial ? "Atualize os dados do colaborador." : "Cadastre um colaborador para esta empresa."}
          </p>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Nome */}
          <Field label="Nome completo *" error={form.nome.trim().length > 0 && errors.nome ? "Mínimo 2 caracteres" : ""}>
            <input
              className={inputCls}
              style={inputStyle(form.nome.trim().length > 0 && errors.nome)}
              maxLength={120}
              placeholder="Ex.: João da Silva"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Field>

          {/* CPF */}
          <Field label="CPF" error={errors.cpf ? "CPF inválido" : ""}>
            <input
              className={inputCls}
              style={inputStyle(errors.cpf)}
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: maskCpfInput(e.target.value) })}
            />
          </Field>

          {/* Cargo */}
          <Field label="Cargo *" error={form.cargo.trim().length > 0 && errors.cargo ? "Obrigatório" : ""}>
            <input
              className={inputCls}
              style={inputStyle(form.cargo.trim().length > 0 && errors.cargo)}
              maxLength={80}
              placeholder="Ex.: Analista Financeiro"
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
            />
          </Field>

          {/* E-mail */}
          <Field label="E-mail" error={errors.email ? "E-mail inválido" : ""}>
            <input
              className={inputCls}
              style={inputStyle(errors.email)}
              type="email"
              placeholder="colaborador@empresa.com.br"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>

          {/* Telefone */}
          <Field label="Telefone" error={errors.telefone ? "Telefone inválido" : ""}>
            <input
              className={inputCls}
              style={inputStyle(errors.telefone)}
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: maskTelefone(e.target.value) })}
            />
          </Field>

          {/* Prazo de renovação */}
          <Field label="Prazo de renovação">
            <select
              className={inputCls}
              style={inputStyle(false)}
              value={form.prazoRenovacao ?? ""}
              onChange={(e) => setForm({ ...form, prazoRenovacao: e.target.value ? Number(e.target.value) as 30 | 45 | 60 | 90 : undefined })}
            >
              <option value="">Não definido</option>
              <option value="30">30 dias</option>
              <option value="45">45 dias</option>
              <option value="60">60 dias</option>
              <option value="90">90 dias</option>
            </select>
          </Field>

          {/* Observação */}
          <Field label="Observações">
            <textarea
              className={inputCls}
              style={{ ...inputStyle(false), resize: "none" }}
              rows={3}
              maxLength={500}
              placeholder="Anotações internas sobre este colaborador..."
              value={form.observacao ?? ""}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            />
          </Field>

          {/* Toggle ativo */}
          <label className="flex items-center gap-3 mt-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setForm({ ...form, ativo: !form.ativo })}
              style={{
                width: 36, height: 20, borderRadius: 999,
                background: form.ativo ? "#22c55e" : "#cbd5e1",
                position: "relative", transition: "background .15s",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute", top: 2,
                  left: form.ativo ? 18 : 2,
                  width: 16, height: 16,
                  borderRadius: 999, background: "#fff",
                  transition: "left .15s",
                }}
              />
            </button>
            <span className="text-[13px]">Colaborador {form.ativo ? "ativo" : "inativo"}</span>
          </label>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: "#e2e5f0" }}>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md text-[13px]"
            style={{ color: "#64748b" }}
          >
            Cancelar
          </button>
          <button
            disabled={!valid}
            onClick={() =>
              onSave({
                ...form,
                id: form.id || `col${Date.now()}`,
                empresaId,
                criadoEm: form.criadoEm || new Date().toISOString().slice(0, 10),
              })
            }
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

const inputCls = "w-full px-3 py-2 rounded-md text-[13px] outline-none bg-white";
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
      <div className="rounded-md">{children}</div>
      {error && (
        <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}
