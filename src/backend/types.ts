export type AjusteDestino = "mensal" | "ultimoReforco" | "entrada";

export interface Params {
  valorUnidade: number;
  nCotas: number;
  duracaoMeses: number;
  aplicarINCC: boolean;
  inccMes: number;
  dataInicio: string;

  entradaValor: number;
  entradaPercent: number;
  entradaQtd: number;
  entradaInicioMes: number;

  mensaisQtd: number;
  mensaisInicioMes: number;
  mensalValorSugerido: number;
  mensalMinimoUniforme: number;
  mensaisUniformes: boolean;
  semMensalEmMesDeReforco: boolean;
  parcelaUnicaNasChaves: boolean;

  reforcosQtd: number;
  reforcosPeriodicidadeMeses: number;
  reforcosPrimeiroMes: number;
  reforcoPercentTotal: number;
  reforcoValorUnitario: number;
  bloquearReforcosUltimosMeses: boolean;
  mesesBloqueioReforco: number;

  ajusteAutomatico: boolean;
  ajusteDestino: AjusteDestino;
  forcarCemNaObra: boolean;
}

export interface FluxoLinha {
  mes: number;
  data: string;
  entrada: number;
  mensal: number;
  reforco: number;
  totalBase: number;
  incc: number;
  totalComIncc: number;
  acumuladoComIncc: number;
}

export interface TestResult {
  nome: string;
  ok: boolean;
  detalhe?: string;
}

export const defaultParams: Params = {
  valorUnidade: 420000,
  nCotas: 1,
  duracaoMeses: 36,
  aplicarINCC: true,
  inccMes: 0.4,
  dataInicio: new Date().toISOString().slice(0, 10),

  entradaValor: 63000,
  entradaPercent: 15,
  entradaQtd: 3,
  entradaInicioMes: 1,

  mensaisQtd: 24,
  mensaisInicioMes: 4,
  mensalValorSugerido: 6000,
  mensalMinimoUniforme: 4000,
  mensaisUniformes: true,
  semMensalEmMesDeReforco: true,
  parcelaUnicaNasChaves: false,

  reforcosQtd: 4,
  reforcosPeriodicidadeMeses: 6,
  reforcosPrimeiroMes: 6,
  reforcoPercentTotal: 20,
  reforcoValorUnitario: 0,
  bloquearReforcosUltimosMeses: true,
  mesesBloqueioReforco: 6,

  ajusteAutomatico: true,
  ajusteDestino: "mensal",
  forcarCemNaObra: true,
};
