import { format, parseISO } from "date-fns";
import { acaoRecomendada, calcStatus, maskCpf } from "@/hooks/useStatusContrato";
import { STATUS_COLOR, STATUS_LABEL } from "@/constants/colors";
import { formatDiasRestantes } from "@/lib/format";
import type { Contrato } from "@/data/mock";

export function ContratosTable({ contratos }: { contratos: Contrato[] }) {
  const rows = contratos
    .map((c) => ({ c, info: calcStatus(c) }))
    .sort((a, b) => b.info.urgencia - a.info.urgencia);

  return (
    <div className="overflow-x-auto">
      <table className="text-[12px]">
        <thead>
          <tr style={{ color: "#64748b", textAlign: "left" }}>
            <Th>Funcionário</Th>
            <Th>CPF</Th>
            <Th>Cargo</Th>
            <Th>Admissão</Th>
            <Th>Vencimento 1ª</Th>
            <Th>Vencimento 2ª</Th>
            <Th>Status</Th>
            <Th>Dias restantes</Th>
            <Th>Ação recomendada</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ c, info }) => (
            <tr key={c.id} style={{ borderTop: "1px solid #e2e5f0" }}>
              <Td>{c.funcionarioNome}</Td>
              <Td>{maskCpf(c.funcionarioCpf)}</Td>
              <Td>{c.cargo}</Td>
              <Td>{format(parseISO(c.dataAdmissao), "dd/MM/yyyy")}</Td>
              <Td>{format(parseISO(c.vencimentoPrimeiro), "dd/MM/yyyy")}</Td>
              <Td>{format(parseISO(c.vencimentoSegundo), "dd/MM/yyyy")}</Td>
              <Td>
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: STATUS_COLOR[info.status] + "22", color: STATUS_COLOR[info.status] }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[info.status] }} />
                  {STATUS_LABEL[info.status]}
                </span>
              </Td>
              <Td>
                {(() => {
                  const f = formatDiasRestantes(info.diasRestantes);
                  return <span style={{ color: f.cor, fontWeight: f.bold ? 600 : 400 }}>{f.texto}</span>;
                })()}
              </Td>
              <Td>
                <span style={{ color: info.status === "VENCIDO" ? STATUS_COLOR.VENCIDO : info.status === "RISCO" ? STATUS_COLOR.risco : "#0f172a", fontWeight: info.status === "VENCIDO" || info.status === "RISCO" ? 600 : 400 }}>
                  {acaoRecomendada(info, c)}
                </span>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={9} className="py-6 text-center" style={{ color: "#64748b" }}>Nenhum contrato.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-2.5 px-3 align-middle">{children}</td>;
}
