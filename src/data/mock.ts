export type Empresa = {
  id: string;
  razaoSocial: string;
  cnpj: string;
  nomeFantasia: string;
  responsavelId: string;
  email: string;
  telefone: string;
  ativo: boolean;
  criadoEm: string;
};

export type Contrato = {
  id: string;
  empresaId: string;
  funcionarioNome: string;
  funcionarioCpf: string;
  cargo: string;
  dataAdmissao: string;
  vencimentoPrimeiro: string;
  vencimentoSegundo: string;
  prorrogacaoAtual: 1 | 2;
  encerrado: boolean;
  motivoEncerramento?: string;
};

export const responsaveis = [
  { id: "u1", nome: "Ana Beatriz Souza" },
  { id: "u2", nome: "Carlos Henrique Lima" },
  { id: "u3", nome: "Mariana Castro" },
  { id: "u4", nome: "Rafael Mendes" },
];

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

export const empresas: Empresa[] = [
  { id: "e1", razaoSocial: "Construtora Vértice S.A.", cnpj: "12.345.678/0001-90", nomeFantasia: "Vértice", responsavelId: "u1", email: "rh@vertice.com.br", telefone: "(11) 3456-7890", ativo: true, criadoEm: "2024-03-12" },
  { id: "e2", razaoSocial: "Logística Atlântico Ltda.", cnpj: "23.456.789/0001-01", nomeFantasia: "Atlântico Log", responsavelId: "u2", email: "dp@atlanticolog.com", telefone: "(21) 2345-6789", ativo: true, criadoEm: "2023-11-02" },
  { id: "e3", razaoSocial: "Indústria Nova Era ME", cnpj: "34.567.890/0001-12", nomeFantasia: "Nova Era", responsavelId: "u1", email: "contato@novaera.ind.br", telefone: "(31) 3344-5566", ativo: true, criadoEm: "2024-06-20" },
  { id: "e4", razaoSocial: "Tech Holding Brasil", cnpj: "45.678.901/0001-23", nomeFantasia: "Tech Holding", responsavelId: "u3", email: "people@techholding.com", telefone: "(11) 4002-8922", ativo: true, criadoEm: "2024-01-15" },
  { id: "e5", razaoSocial: "Rede Varejo Sul S.A.", cnpj: "56.789.012/0001-34", nomeFantasia: "Varejo Sul", responsavelId: "u4", email: "rh@varejosul.com.br", telefone: "(51) 3221-9988", ativo: true, criadoEm: "2023-09-08" },
  { id: "e6", razaoSocial: "Agro Cerrado Cooperativa", cnpj: "67.890.123/0001-45", nomeFantasia: "Agro Cerrado", responsavelId: "u2", email: "rh@agrocerrado.coop.br", telefone: "(62) 3210-4455", ativo: false, criadoEm: "2022-05-01" },
  { id: "e7", razaoSocial: "Saúde Integrada Hospitalar", cnpj: "78.901.234/0001-56", nomeFantasia: "Saúde Integrada", responsavelId: "u3", email: "rh@saudeintegrada.com.br", telefone: "(11) 5050-6060", ativo: true, criadoEm: "2024-02-10" },
];

const cargos = ["Auxiliar Administrativo", "Operador de Logística", "Analista Financeiro", "Vendedor", "Mecânico", "Técnico de TI", "Recepcionista", "Enfermeiro", "Soldador", "Motorista"];
const nomes = ["João da Silva", "Maria Oliveira", "Pedro Santos", "Ana Costa", "Lucas Pereira", "Juliana Almeida", "Bruno Ferreira", "Camila Rocha", "Diego Lima", "Fernanda Souza", "Gabriel Martins", "Helena Ribeiro", "Igor Cardoso", "Larissa Nunes", "Marcos Teixeira", "Natália Barros", "Otávio Dias", "Patrícia Gomes", "Rodrigo Pinto", "Sofia Carvalho", "Thiago Ramos", "Vitória Mendes", "Wesley Araújo", "Yasmin Castro"];

const cpf = (i: number) => {
  const base = (10000000000 + i * 31337).toString().padStart(11, "0").slice(0, 11);
  return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6, 9)}-${base.slice(9, 11)}`;
};

// Generate contratos in spread of statuses across empresas
const contratosGen: Contrato[] = [];
let cid = 1;
let nIdx = 0;
const dist = [
  { empresaId: "e1", count: 12 },
  { empresaId: "e2", count: 9 },
  { empresaId: "e3", count: 6 },
  { empresaId: "e4", count: 14 },
  { empresaId: "e5", count: 11 },
  { empresaId: "e7", count: 8 },
];

for (const { empresaId, count } of dist) {
  for (let i = 0; i < count; i++) {
    // Spread admission dates from -170 to -10 days
    const offset = -170 + Math.floor((160 / count) * i) + (cid % 7);
    const admissao = addDays(today, offset);
    const v1 = addDays(admissao, 90);
    const v2 = addDays(admissao, 180);
    const isOnSecond = offset < -90;
    contratosGen.push({
      id: `c${cid}`,
      empresaId,
      funcionarioNome: nomes[nIdx % nomes.length],
      funcionarioCpf: cpf(cid),
      cargo: cargos[(cid + i) % cargos.length],
      dataAdmissao: iso(admissao),
      vencimentoPrimeiro: iso(v1),
      vencimentoSegundo: iso(v2),
      prorrogacaoAtual: isOnSecond ? 2 : 1,
      encerrado: false,
    });
    cid++;
    nIdx++;
  }
}

// Add a few encerrados to feed funnel
contratosGen.push({
  id: `c${cid++}`,
  empresaId: "e1",
  funcionarioNome: "Eduarda Pires",
  funcionarioCpf: cpf(99),
  cargo: "Engenheira Civil",
  dataAdmissao: iso(addDays(today, -200)),
  vencimentoPrimeiro: iso(addDays(today, -110)),
  vencimentoSegundo: iso(addDays(today, -20)),
  prorrogacaoAtual: 2,
  encerrado: true,
  motivoEncerramento: "Efetivado",
});

export const contratos: Contrato[] = contratosGen;
