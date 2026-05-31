-- =============================================================================
-- Arbrent — Schema completo com RLS e dados de teste
-- Execute no SQL Editor do seu projeto Supabase (supabase.com → SQL Editor)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensões
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 2. Tipo de role
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('supervisor', 'analista');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 3. Tabelas
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id        uuid        not null references auth.users(id) on delete cascade,
  nome      text        not null,
  role      user_role   not null default 'analista',
  ativo     boolean     not null default true,
  criado_em timestamptz not null default now(),
  primary key (id)
);
comment on table public.profiles is 'Extensão do auth.users com nome e role';

create table if not exists public.empresas (
  id            uuid    primary key default gen_random_uuid(),
  razao_social  text    not null,
  cnpj          text    not null,
  nome_fantasia text    not null,
  responsavel_id uuid   references public.profiles(id) on delete set null,
  analista_id   uuid    references public.profiles(id) on delete set null,
  email         text    not null default '',
  telefone      text    not null default '',
  ativo         boolean not null default true,
  criado_em     date    not null default current_date
);

create table if not exists public.colaboradores (
  id               uuid     primary key default gen_random_uuid(),
  empresa_id       uuid     not null references public.empresas(id) on delete cascade,
  nome             text     not null,
  cpf              text     not null,
  cargo            text     not null,
  email            text     not null default '',
  telefone         text     not null default '',
  ativo            boolean  not null default true,
  prazo_renovacao  smallint check (prazo_renovacao in (30, 45, 60, 90)),
  observacao       text,
  criado_em        date     not null default current_date
);

create table if not exists public.contratos (
  id                   uuid     primary key default gen_random_uuid(),
  empresa_id           uuid     not null references public.empresas(id) on delete cascade,
  funcionario_nome     text     not null,
  funcionario_cpf      text     not null,
  cargo                text     not null,
  data_admissao        date     not null,
  vencimento_primeiro  date     not null,
  vencimento_segundo   date     not null,
  prorrogacao_atual    smallint not null default 1 check (prorrogacao_atual in (1, 2)),
  encerrado            boolean  not null default false,
  motivo_encerramento  text,
  renovado_em          date,
  criado_em            timestamptz not null default now()
);

create table if not exists public.historico (
  id          uuid        primary key default gen_random_uuid(),
  tipo        text        not null,
  descricao   text        not null,
  contexto    jsonb,
  user_id     uuid        references public.profiles(id) on delete set null,
  empresa_id  uuid        references public.empresas(id) on delete set null,
  at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Trigger: primeiro usuário vira supervisor automaticamente
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_first boolean;
begin
  select count(*) = 0 into is_first from public.profiles;
  insert into public.profiles (id, nome, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nome',
      split_part(new.email, '@', 1)
    ),
    case when is_first then 'supervisor'::user_role else 'analista'::user_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. Função helper — lê role sem sofrer RLS (security definer)
-- ---------------------------------------------------------------------------
create or replace function public.get_my_role()
returns user_role
language sql
security definer
stable
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.empresas    enable row level security;
alter table public.colaboradores enable row level security;
alter table public.contratos   enable row level security;
alter table public.historico   enable row level security;

-- Profiles
drop policy if exists "profiles: ver próprio"        on public.profiles;
drop policy if exists "profiles: supervisor vê todos" on public.profiles;
drop policy if exists "profiles: supervisor atualiza" on public.profiles;

create policy "profiles: ver próprio"         on public.profiles for select using (id = auth.uid());
create policy "profiles: supervisor vê todos" on public.profiles for select using (public.get_my_role() = 'supervisor');
create policy "profiles: supervisor atualiza" on public.profiles for update  using (public.get_my_role() = 'supervisor');

-- Empresas
drop policy if exists "empresas: supervisor total"     on public.empresas;
drop policy if exists "empresas: analista seleciona"   on public.empresas;
drop policy if exists "empresas: analista atualiza"    on public.empresas;

create policy "empresas: supervisor total"   on public.empresas for all    using (public.get_my_role() = 'supervisor');
create policy "empresas: analista seleciona" on public.empresas for select using (analista_id = auth.uid());
create policy "empresas: analista atualiza"  on public.empresas for update using (analista_id = auth.uid());

-- Colaboradores
drop policy if exists "colaboradores: supervisor" on public.colaboradores;
drop policy if exists "colaboradores: analista"   on public.colaboradores;

create policy "colaboradores: supervisor" on public.colaboradores for all using (public.get_my_role() = 'supervisor');
create policy "colaboradores: analista"   on public.colaboradores for all using (
  empresa_id in (select id from public.empresas where analista_id = auth.uid())
);

-- Contratos
drop policy if exists "contratos: supervisor" on public.contratos;
drop policy if exists "contratos: analista"   on public.contratos;

create policy "contratos: supervisor" on public.contratos for all using (public.get_my_role() = 'supervisor');
create policy "contratos: analista"   on public.contratos for all using (
  empresa_id in (select id from public.empresas where analista_id = auth.uid())
);

-- Historico
drop policy if exists "historico: supervisor"       on public.historico;
drop policy if exists "historico: analista select"  on public.historico;
drop policy if exists "historico: insert"           on public.historico;

create policy "historico: supervisor"      on public.historico for all    using (public.get_my_role() = 'supervisor');
create policy "historico: analista select" on public.historico for select using (
  user_id = auth.uid()
  or empresa_id in (select id from public.empresas where analista_id = auth.uid())
);
create policy "historico: insert" on public.historico for insert with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. Seed — dados de teste (analista_id = NULL, supervisor verá tudo)
-- ---------------------------------------------------------------------------

insert into public.empresas (id, razao_social, cnpj, nome_fantasia, email, telefone, ativo, criado_em) values
  ('00000000-0001-0000-0000-000000000001', 'Construtora Vértice S.A.',     '12.345.678/0001-90', 'Vértice',       'rh@vertice.com.br',         '(11) 3456-7890', true,  '2024-03-12'),
  ('00000000-0002-0000-0000-000000000002', 'Logística Atlântico Ltda.',    '23.456.789/0001-01', 'Atlântico Log', 'dp@atlanticolog.com',        '(21) 2345-6789', true,  '2023-11-02'),
  ('00000000-0003-0000-0000-000000000003', 'Indústria Nova Era ME',        '34.567.890/0001-12', 'Nova Era',      'contato@novaera.ind.br',     '(31) 3344-5566', true,  '2024-06-20'),
  ('00000000-0004-0000-0000-000000000004', 'Tech Holding Brasil',          '45.678.901/0001-23', 'Tech Holding',  'people@techholding.com',     '(11) 4002-8922', true,  '2024-01-15'),
  ('00000000-0005-0000-0000-000000000005', 'Rede Varejo Sul S.A.',         '56.789.012/0001-34', 'Varejo Sul',    'rh@varejosul.com.br',        '(51) 3221-9988', true,  '2023-09-08')
on conflict (id) do nothing;

-- Colaboradores de teste
insert into public.colaboradores (empresa_id, nome, cpf, cargo, email, ativo) values
  ('00000000-0001-0000-0000-000000000001', 'João da Silva',     '111.111.111-01', 'Auxiliar Administrativo', 'joao@vertice.com.br',    true),
  ('00000000-0001-0000-0000-000000000001', 'Maria Oliveira',    '111.111.111-02', 'Operador de Logística',   'maria@vertice.com.br',   true),
  ('00000000-0001-0000-0000-000000000001', 'Pedro Santos',      '111.111.111-03', 'Analista Financeiro',     'pedro@vertice.com.br',   true),
  ('00000000-0002-0000-0000-000000000002', 'Ana Costa',         '222.222.222-01', 'Vendedora',               'ana@atlanticolog.com',   true),
  ('00000000-0002-0000-0000-000000000002', 'Lucas Pereira',     '222.222.222-02', 'Mecânico',                'lucas@atlanticolog.com', true),
  ('00000000-0003-0000-0000-000000000003', 'Juliana Almeida',   '333.333.333-01', 'Técnico de TI',           'juliana@novaera.com.br', true),
  ('00000000-0003-0000-0000-000000000003', 'Bruno Ferreira',    '333.333.333-02', 'Recepcionista',           'bruno@novaera.com.br',   true),
  ('00000000-0004-0000-0000-000000000004', 'Camila Rocha',      '444.444.444-01', 'Enfermeira',              'camila@techholding.com', true),
  ('00000000-0004-0000-0000-000000000004', 'Diego Lima',        '444.444.444-02', 'Soldador',                'diego@techholding.com',  true),
  ('00000000-0005-0000-0000-000000000005', 'Fernanda Souza',    '555.555.555-01', 'Motorista',               'ferna@varejosul.com.br', true)
on conflict do nothing;

-- Contratos de teste (datas relativas ao dia da execução)
insert into public.contratos (empresa_id, funcionario_nome, funcionario_cpf, cargo, data_admissao, vencimento_primeiro, vencimento_segundo, prorrogacao_atual, encerrado) values
  -- Vigentes (vence em 60-90 dias)
  ('00000000-0001-0000-0000-000000000001', 'João da Silva',   '111.111.111-01', 'Auxiliar Administrativo', current_date - 120, current_date - 30, current_date + 60,  2, false),
  ('00000000-0001-0000-0000-000000000001', 'Maria Oliveira',  '111.111.111-02', 'Operador de Logística',   current_date - 130, current_date - 40, current_date + 50,  2, false),
  ('00000000-0002-0000-0000-000000000002', 'Ana Costa',       '222.222.222-01', 'Vendedora',               current_date - 150, current_date - 60, current_date + 30,  2, false),
  ('00000000-0003-0000-0000-000000000003', 'Juliana Almeida', '333.333.333-01', 'Técnico de TI',           current_date - 100, current_date - 10, current_date + 80,  2, false),
  ('00000000-0004-0000-0000-000000000004', 'Camila Rocha',    '444.444.444-01', 'Enfermeira',              current_date - 110, current_date - 20, current_date + 70,  2, false),
  -- Próximos do vencimento (15-30 dias)
  ('00000000-0001-0000-0000-000000000001', 'Pedro Santos',    '111.111.111-03', 'Analista Financeiro',     current_date - 160, current_date - 70, current_date + 20,  2, false),
  ('00000000-0002-0000-0000-000000000002', 'Lucas Pereira',   '222.222.222-02', 'Mecânico',                current_date - 155, current_date - 65, current_date + 25,  2, false),
  ('00000000-0005-0000-0000-000000000005', 'Fernanda Souza',  '555.555.555-01', 'Motorista',               current_date - 158, current_date - 68, current_date + 22,  2, false),
  -- Em risco (1-10 dias)
  ('00000000-0003-0000-0000-000000000003', 'Bruno Ferreira',  '333.333.333-02', 'Recepcionista',           current_date - 175, current_date - 85, current_date + 5,   2, false),
  ('00000000-0004-0000-0000-000000000004', 'Diego Lima',      '444.444.444-02', 'Soldador',                current_date - 172, current_date - 82, current_date + 8,   2, false),
  -- Vencidos
  ('00000000-0005-0000-0000-000000000005', 'Fernanda Souza',  '555.555.555-01', 'Motorista',               current_date - 200, current_date - 110, current_date - 5,  2, false),
  -- Encerrado
  ('00000000-0001-0000-0000-000000000001', 'João da Silva',   '111.111.111-01', 'Auxiliar Administrativo', current_date - 300, current_date - 210, current_date - 120, 2, true)
on conflict do nothing;
