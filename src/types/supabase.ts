// Tipos gerados manualmente baseados no schema supabase/schema.sql
// Espelham snake_case do banco → camelCase da app via funções mapper

export type UserRole = "supervisor" | "analista";

// ── Rows (banco, snake_case) ─────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  nome: string;
  role: UserRole;
  ativo: boolean;
  criado_em: string;
}

export interface EmpresaRow {
  id: string;
  razao_social: string;
  cnpj: string;
  nome_fantasia: string;
  responsavel_id: string | null;
  analista_id: string | null;
  email: string;
  telefone: string;
  ativo: boolean;
  criado_em: string;
}

export interface ColaboradorRow {
  id: string;
  empresa_id: string;
  nome: string;
  cpf: string;
  cargo: string;
  email: string;
  telefone: string;
  ativo: boolean;
  prazo_renovacao: 30 | 45 | 60 | 90 | null;
  observacao: string | null;
  criado_em: string;
}

export interface ContratoRow {
  id: string;
  empresa_id: string;
  funcionario_nome: string;
  funcionario_cpf: string;
  cargo: string;
  data_admissao: string;
  vencimento_primeiro: string;
  vencimento_segundo: string;
  prorrogacao_atual: 1 | 2;
  encerrado: boolean;
  motivo_encerramento: string | null;
  renovado_em: string | null;
  criado_em: string;
}

export interface HistoricoRow {
  id: string;
  tipo: string;
  descricao: string;
  contexto: Record<string, string> | null;
  user_id: string | null;
  empresa_id: string | null;
  at: string;
}

// ── Database type para o cliente Supabase tipado ────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: Omit<ProfileRow, "criado_em"> & Partial<Pick<ProfileRow, "criado_em">>; Update: Partial<ProfileRow> };
      empresas: { Row: EmpresaRow; Insert: Omit<EmpresaRow, "id" | "criado_em"> & Partial<Pick<EmpresaRow, "id" | "criado_em">>; Update: Partial<EmpresaRow> };
      colaboradores: { Row: ColaboradorRow; Insert: Omit<ColaboradorRow, "id" | "criado_em"> & Partial<Pick<ColaboradorRow, "id" | "criado_em">>; Update: Partial<ColaboradorRow> };
      contratos: { Row: ContratoRow; Insert: Omit<ContratoRow, "id" | "criado_em"> & Partial<Pick<ContratoRow, "id" | "criado_em">>; Update: Partial<ContratoRow> };
      historico: { Row: HistoricoRow; Insert: Omit<HistoricoRow, "id" | "at"> & Partial<Pick<HistoricoRow, "id" | "at">>; Update: Partial<HistoricoRow> };
    };
    Functions: {
      get_my_role: { Args: Record<never, never>; Returns: UserRole };
    };
    Enums: {
      user_role: UserRole;
    };
  };
}

// ── Mappers: banco → app ─────────────────────────────────────────────────────
// Os tipos de app (Empresa, Colaborador, Contrato) vivem em src/data/mock.ts

import type { Empresa, Colaborador, Contrato } from "@/data/mock";
import type { HistoryEvent } from "@/store/appStore";

export function mapEmpresa(row: EmpresaRow): Empresa {
  return {
    id: row.id,
    razaoSocial: row.razao_social,
    cnpj: row.cnpj,
    nomeFantasia: row.nome_fantasia,
    responsavelId: row.responsavel_id ?? "",
    email: row.email,
    telefone: row.telefone,
    ativo: row.ativo,
    criadoEm: row.criado_em,
    analistaId: row.analista_id ?? undefined,
  };
}

export function empresaToRow(e: Empresa): Partial<EmpresaRow> {
  return {
    razao_social: e.razaoSocial,
    cnpj: e.cnpj,
    nome_fantasia: e.nomeFantasia,
    responsavel_id: e.responsavelId || null,
    analista_id: (e as Empresa & { analistaId?: string }).analistaId || null,
    email: e.email,
    telefone: e.telefone,
    ativo: e.ativo,
  };
}

export function mapColaborador(row: ColaboradorRow): Colaborador {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    nome: row.nome,
    cpf: row.cpf,
    cargo: row.cargo,
    email: row.email,
    telefone: row.telefone,
    ativo: row.ativo,
    prazoRenovacao: row.prazo_renovacao ?? undefined,
    observacao: row.observacao ?? undefined,
    criadoEm: row.criado_em,
  };
}

export function colaboradorToRow(c: Colaborador): Partial<ColaboradorRow> {
  return {
    empresa_id: c.empresaId,
    nome: c.nome,
    cpf: c.cpf,
    cargo: c.cargo,
    email: c.email,
    telefone: c.telefone,
    ativo: c.ativo,
    prazo_renovacao: c.prazoRenovacao ?? null,
    observacao: c.observacao ?? null,
  };
}

export function mapContrato(row: ContratoRow): Contrato {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    funcionarioNome: row.funcionario_nome,
    funcionarioCpf: row.funcionario_cpf,
    cargo: row.cargo,
    dataAdmissao: row.data_admissao,
    vencimentoPrimeiro: row.vencimento_primeiro,
    vencimentoSegundo: row.vencimento_segundo,
    prorrogacaoAtual: row.prorrogacao_atual,
    encerrado: row.encerrado,
    motivoEncerramento: row.motivo_encerramento ?? undefined,
    renovadoEm: row.renovado_em ?? undefined,
  };
}

export function mapHistorico(row: HistoricoRow): HistoryEvent {
  return {
    id: row.id,
    at: row.at,
    tipo: row.tipo as HistoryEvent["tipo"],
    descricao: row.descricao,
    contexto: row.contexto ?? undefined,
  };
}
