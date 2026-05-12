import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import type { Contrato } from "@/data/mock";

export type StatusContrato = "VIGENTE" | "PROXIMO" | "RISCO" | "VENCIDO";

export type StatusInfo = {
  status: StatusContrato;
  diasRestantes: number;
  urgencia: number; // higher = more urgent
};

export function calcStatus(contrato: Contrato): StatusInfo {
  const hoje = startOfDay(new Date());
  const venc = startOfDay(parseISO(contrato.vencimentoSegundo));
  const dias = differenceInCalendarDays(venc, hoje);

  let status: StatusContrato;
  if (contrato.encerrado) {
    status = "VIGENTE"; // encerrados saem dos cálculos de risco
  } else if (dias < 0) {
    status = "VENCIDO";
  } else if (dias <= 15) {
    status = "RISCO";
  } else if (dias <= 30) {
    status = "PROXIMO";
  } else {
    status = "VIGENTE";
  }

  const urgencia =
    status === "VENCIDO" ? 1000 - dias : status === "RISCO" ? 500 - dias : status === "PROXIMO" ? 100 - dias : -dias;

  return { status, diasRestantes: dias, urgencia };
}

export function useStatusContrato(contrato: Contrato): StatusInfo {
  return calcStatus(contrato);
}

export function acaoRecomendada(info: StatusInfo, contrato: Contrato): string {
  if (contrato.encerrado) return contrato.motivoEncerramento ?? "Encerrado";
  if (info.status === "VENCIDO") return "VENCIDO — regularizar";
  if (info.diasRestantes < 15) return "URGENTE — definir";
  if (info.diasRestantes <= 30) return "Agendar avaliação";
  return "Monitorar";
}

export function maskCpf(cpf: string): string {
  // XXX.***.**-XX (mostra primeiros 3 e últimos 2)
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.***.**-${digits.slice(9, 11)}`;
}
