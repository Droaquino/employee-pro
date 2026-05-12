export function formatDiasRestantes(dias: number): { texto: string; cor: string; bold: boolean } {
  if (dias === 0) return { texto: "Vence hoje", cor: "#ef4444", bold: true };
  if (dias < 0) return { texto: `Vencido há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"}`, cor: "#7f1d1d", bold: true };
  if (dias <= 15) return { texto: `${dias} ${dias === 1 ? "dia" : "dias"}`, cor: "#ef4444", bold: true };
  if (dias <= 30) return { texto: `${dias} dias`, cor: "#f59e0b", bold: false };
  return { texto: `${dias} dias`, cor: "#22c55e", bold: false };
}
