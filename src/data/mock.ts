import { addDays, startOfDay, subDays } from "date-fns";

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

const today = startOfDay(new Date());
const iso = (d: Date) => d.toISOString().slice(0, 10);

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
const nomes = ["João da Silva", "Maria Oliveira", "Pedro Santos", "Ana Costa", "Lucas Pereira", "Juliana Almeida", "Bruno Ferreira", "Camila Rocha", "Diego Lima", "Fernanda Souza", "Gabriel Martins", "Helena Ribeiro", "Igor Cardoso", "Larissa Nunes", "Marcos Teixeira", "Natália Barros", "Otávio Dias", "Patrícia Gomes", "Rodrigo Pinto", "Sofia Carvalho", "Thiago Ramos", "Vitória Mendes", "Wesley Araújo", "Yasmin Castro", "Beatriz Lopes", "Caio Moraes", "Daniela Freitas", "Eduardo Pires", "Flávia Tavares", "Gustavo Reis"];
const empresaIds = ["e1", "e2", "e3", "e4", "e5", "e7"];

const cpf = (i: number) => {
  const base = (10000000000 + i * 31337).toString().padStart(11, "0").slice(0, 11);
  return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6, 9)}-${base.slice(9, 11)}`;
};

// pseudo-random determinístico
const rnd = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

type Bucket = { count: number; minDays: number; maxDays: number; encerrado?: boolean };
const buckets: Bucket[] = [
  { count: 15, minDays: 31, maxDays: 90 },   // vigentes
  { count: 20, minDays: 16, maxDays: 30 },   // próximos
  { count: 15, minDays: 1, maxDays: 15 },    // risco
  { count: 6, minDays: -30, maxDays: -1 },   // vencidos
  { count: 5, minDays: -120, maxDays: -40, encerrado: true }, // encerrados
];

const motivos = ["Efetivado", "Não renovado", "Pedido de demissão", "Efetivado", "Efetivado"];
const contratosGen: Contrato[] = [];
let cid = 1;

for (const b of buckets) {
  for (let i = 0; i < b.count; i++) {
    const range = b.maxDays - b.minDays;
    const offset = b.minDays + Math.floor(rnd(cid * 13.7) * (range + 1));
    const vencSegundo = addDays(today, offset);
    const dataAdmissao = subDays(vencSegundo, 180);
    const vencPrimeiro = addDays(dataAdmissao, 90);
    const empresaId = empresaIds[cid % empresaIds.length];
    contratosGen.push({
      id: `c${cid}`,
      empresaId,
      funcionarioNome: nomes[(cid - 1) % nomes.length],
      funcionarioCpf: cpf(cid),
      cargo: cargos[cid % cargos.length],
      dataAdmissao: iso(dataAdmissao),
      vencimentoPrimeiro: iso(vencPrimeiro),
      vencimentoSegundo: iso(vencSegundo),
      prorrogacaoAtual: 2,
      encerrado: !!b.encerrado,
      motivoEncerramento: b.encerrado ? motivos[i % motivos.length] : undefined,
    });
    cid++;
  }
}

export const contratos: Contrato[] = contratosGen;
