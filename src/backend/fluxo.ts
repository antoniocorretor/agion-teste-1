import { FluxoLinha, Params } from "./types";

const toCurrency = (value: number) => Number(value.toFixed(2));

const clampMonth = (mes: number, duracao: number) => Math.min(Math.max(1, mes), duracao);

const addMonths = (isoDate: string, offset: number) => {
  const base = new Date(isoDate);
  const result = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  return result.toISOString().slice(0, 10);
};

interface Distribuicao {
  entradas: number[];
  mensais: number[];
  reforcos: number[];
}

const inicializaDistribuicao = (duracao: number): Distribuicao => ({
  entradas: Array(duracao).fill(0),
  mensais: Array(duracao).fill(0),
  reforcos: Array(duracao).fill(0),
});

const distribuiEntrada = (params: Params, alvoTotal: number, dist: Distribuicao) => {
  if (params.entradaQtd <= 0) return;
  const inicio = clampMonth(params.entradaInicioMes, params.duracaoMeses) - 1;
  const totalInformado = params.entradaValor > 0 ? params.entradaValor : (params.entradaPercent / 100) * alvoTotal;
  const valor = totalInformado / params.entradaQtd;

  for (let i = 0; i < params.entradaQtd; i += 1) {
    const index = inicio + i;
    if (index >= params.duracaoMeses) break;
    dist.entradas[index] = toCurrency(valor);
  }
};

const distribuiReforcos = (params: Params, alvoTotal: number, dist: Distribuicao) => {
  if (params.reforcosQtd <= 0) return;

  const primeiro = clampMonth(params.reforcosPrimeiroMes, params.duracaoMeses) - 1;
  const periodicidade = Math.max(1, params.reforcosPeriodicidadeMeses);
  const limite = params.duracaoMeses - params.mesesBloqueioReforco;
  const total =
    params.reforcoValorUnitario > 0
      ? params.reforcoValorUnitario * params.reforcosQtd
      : ((params.reforcoPercentTotal / 100) * alvoTotal);
  const valorEvento =
    params.reforcoValorUnitario > 0
      ? params.reforcoValorUnitario
      : total / params.reforcosQtd;

  let eventosDistribuidos = 0;
  let ultimoIndice = primeiro;
  for (let i = 0; i < params.reforcosQtd; i += 1) {
    let indice = primeiro + i * periodicidade;
    if (params.bloquearReforcosUltimosMeses && indice >= limite) {
      indice = Math.max(0, limite - 1 - (params.reforcosQtd - 1 - i));
    }
    indice = clampMonth(indice + 1, params.duracaoMeses) - 1;
    dist.reforcos[indice] = toCurrency(valorEvento);
    ultimoIndice = indice;
    eventosDistribuidos += 1;
  }

  if (eventosDistribuidos < params.reforcosQtd && ultimoIndice < params.duracaoMeses) {
    const faltantes = params.reforcosQtd - eventosDistribuidos;
    dist.reforcos[ultimoIndice] = toCurrency(dist.reforcos[ultimoIndice] + faltantes * valorEvento);
  }
};

const distribuiMensais = (params: Params, alvoTotal: number, dist: Distribuicao) => {
  if (params.mensaisQtd <= 0) return;
  const inicio = clampMonth(params.mensaisInicioMes, params.duracaoMeses) - 1;

  const totalEntradas = dist.entradas.reduce((acc, item) => acc + item, 0);
  const totalReforcos = dist.reforcos.reduce((acc, item) => acc + item, 0);
  const restante = Math.max(0, alvoTotal - (totalEntradas + totalReforcos));

  const baseMensal = params.mensalValorSugerido > 0 ? params.mensalValorSugerido : restante / params.mensaisQtd;

  for (let i = 0; i < params.mensaisQtd; i += 1) {
    const index = inicio + i;
    if (index >= params.duracaoMeses) break;
    dist.mensais[index] = toCurrency(baseMensal);
  }
};

const redistribuiMensaisSemReforco = (params: Params, dist: Distribuicao) => {
  if (!params.semMensalEmMesDeReforco) return;
  const totalRealloc = dist.mensais.reduce((acc, valor, index) => {
    if (dist.reforcos[index] > 0 && valor > 0) {
      dist.mensais[index] = 0;
      return acc + valor;
    }
    return acc;
  }, 0);

  const mesesElegiveis = dist.mensais
    .map((valor, index) => ({ valor, index }))
    .filter(({ index }) => dist.reforcos[index] === 0 && index < params.duracaoMeses - 1);

  if (totalRealloc === 0 || mesesElegiveis.length === 0) return;

  const incremento = totalRealloc / mesesElegiveis.length;
  mesesElegiveis.forEach(({ index }) => {
    dist.mensais[index] = toCurrency(dist.mensais[index] + incremento);
  });
};

const aplicaUniformizacaoMensal = (params: Params, dist: Distribuicao) => {
  if (!params.mensaisUniformes) return;
  const meses = dist.mensais.map((valor, index) => ({ valor, index })).filter(({ valor }) => valor > 0);
  if (meses.length === 0) return;
  const maxValor = Math.max(params.mensalMinimoUniforme, ...meses.map(({ valor }) => valor));
  meses.forEach(({ index }) => {
    dist.mensais[index] = toCurrency(Math.max(maxValor, params.mensalMinimoUniforme));
  });
};

const aplicaParcelaChaves = (params: Params, dist: Distribuicao) => {
  if (!params.parcelaUnicaNasChaves) return;
  const ultimoIndice = params.duracaoMeses - 1;
  const somaMensais = dist.mensais.reduce((acc, valor, index) => {
    if (index !== ultimoIndice) {
      dist.mensais[index] = 0;
      return acc + valor;
    }
    return acc;
  }, 0);
  dist.mensais[ultimoIndice] = toCurrency(dist.mensais[ultimoIndice] + somaMensais);
};

const somaDistribuicao = (dist: Distribuicao) =>
  dist.entradas.reduce((acc, v) => acc + v, 0) +
  dist.mensais.reduce((acc, v) => acc + v, 0) +
  dist.reforcos.reduce((acc, v) => acc + v, 0);

const ajustaDiferenca = (params: Params, alvoTotal: number, dist: Distribuicao) => {
  const soma = somaDistribuicao(dist);
  const diferenca = toCurrency(alvoTotal - soma);
  if (!params.ajusteAutomatico || Math.abs(diferenca) < 0.5) return;

  const aplica = (indices: number[]) => {
    if (indices.length === 0) return;
    const ajusteUnitario = diferenca / indices.length;
    indices.forEach((indice) => {
      dist.mensais[indice] = toCurrency(dist.mensais[indice] + ajusteUnitario);
    });
  };

  const adicionaAoUltimoReforco = () => {
    const ultimo = [...dist.reforcos]
      .map((valor, index) => ({ valor, index }))
      .filter(({ valor }) => valor > 0)
      .pop();
    if (ultimo) {
      dist.reforcos[ultimo.index] = toCurrency(dist.reforcos[ultimo.index] + diferenca);
      return true;
    }
    return false;
  };

  const adicionaNasEntradas = () => {
    const indicesEntrada = dist.entradas
      .map((valor, index) => ({ valor, index }))
      .filter(({ valor }) => valor > 0)
      .map(({ index }) => index);
    if (indicesEntrada.length === 0) return false;
    const ajusteUnitario = diferenca / indicesEntrada.length;
    indicesEntrada.forEach((indice) => {
      dist.entradas[indice] = toCurrency(dist.entradas[indice] + ajusteUnitario);
    });
    return true;
  };

  const indicesMensais = dist.mensais
    .map((valor, index) => ({ valor, index }))
    .filter(({ valor }) => valor > 0)
    .map(({ index }) => index);

  switch (params.ajusteDestino) {
    case "ultimoReforco":
      if (adicionaAoUltimoReforco()) return;
      break;
    case "entrada":
      if (adicionaNasEntradas()) return;
      break;
    case "mensal":
    default:
      aplica(indicesMensais);
      return;
  }

  if (indicesMensais.length) {
    aplica(indicesMensais);
  } else if (!adicionaAoUltimoReforco()) {
    adicionaNasEntradas();
  }
};

const geraLinhas = (params: Params, dist: Distribuicao, alvoTotal: number): FluxoLinha[] => {
  let acumulado = 0;
  const linhas: FluxoLinha[] = [];

  for (let i = 0; i < params.duracaoMeses; i += 1) {
    const entrada = dist.entradas[i] ?? 0;
    const mensal = dist.mensais[i] ?? 0;
    const reforco = dist.reforcos[i] ?? 0;
    const totalBase = toCurrency(entrada + mensal + reforco);
    const aplicacaoINCC = params.aplicarINCC ? toCurrency(totalBase * (params.inccMes / 100)) : 0;
    const totalComIncc = toCurrency(totalBase + aplicacaoINCC);
    acumulado = toCurrency(acumulado + totalComIncc);

    linhas.push({
      mes: i + 1,
      data: addMonths(params.dataInicio, i),
      entrada,
      mensal,
      reforco,
      totalBase,
      incc: aplicacaoINCC,
      totalComIncc,
      acumuladoComIncc: acumulado,
    });
  }

  if (params.forcarCemNaObra) {
    const somaBase = linhas.reduce((acc, linha) => acc + linha.totalBase, 0);
    if (Math.abs(somaBase - alvoTotal) > 1) {
      const fator = alvoTotal / somaBase;
      acumulado = 0;
      for (const linha of linhas) {
        linha.entrada = toCurrency(linha.entrada * fator);
        linha.mensal = toCurrency(linha.mensal * fator);
        linha.reforco = toCurrency(linha.reforco * fator);
        linha.totalBase = toCurrency(linha.entrada + linha.mensal + linha.reforco);
        linha.incc = params.aplicarINCC ? toCurrency(linha.totalBase * (params.inccMes / 100)) : 0;
        linha.totalComIncc = toCurrency(linha.totalBase + linha.incc);
        acumulado = toCurrency(acumulado + linha.totalComIncc);
        linha.acumuladoComIncc = acumulado;
      }
    }
  }

  return linhas;
};

export const computeFluxo = (params: Params): FluxoLinha[] => {
  const alvoTotal = params.valorUnidade * params.nCotas;
  const dist = inicializaDistribuicao(params.duracaoMeses);

  distribuiEntrada(params, alvoTotal, dist);
  distribuiReforcos(params, alvoTotal, dist);
  distribuiMensais(params, alvoTotal, dist);
  redistribuiMensaisSemReforco(params, dist);
  aplicaUniformizacaoMensal(params, dist);
  aplicaParcelaChaves(params, dist);
  ajustaDiferenca(params, alvoTotal, dist);

  return geraLinhas(params, dist, alvoTotal);
};

export const buildCSV = (linhas: FluxoLinha[]): string => {
  const cabecalho = [
    "Mes",
    "Data",
    "Entrada",
    "Mensal",
    "Reforco",
    "Total Base",
    "INCC",
    "Total + INCC",
    "Acumulado + INCC",
  ];
  const linhasCSV = linhas.map((linha) =>
    [
      linha.mes,
      linha.data,
      linha.entrada.toFixed(2),
      linha.mensal.toFixed(2),
      linha.reforco.toFixed(2),
      linha.totalBase.toFixed(2),
      linha.incc.toFixed(2),
      linha.totalComIncc.toFixed(2),
      linha.acumuladoComIncc.toFixed(2),
    ].join(",")
  );
  return [cabecalho.join(","), ...linhasCSV].join("\n");
};

export const downloadCSV = (linhas: FluxoLinha[]) => {
  const csv = buildCSV(linhas);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "fluxo-agion.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const runEmbeddedTests = (params: Params, linhas: FluxoLinha[]): { resultados: string[]; sucesso: boolean } => {
  const resultados: string[] = [];
  const alvoTotal = params.valorUnidade * params.nCotas;
  const somaReforcos = linhas.reduce((acc, linha) => acc + linha.reforco, 0);
  const somaMensais = linhas.reduce((acc, linha) => acc + linha.mensal, 0);
  const somaEntradas = linhas.reduce((acc, linha) => acc + linha.entrada, 0);
  const somaBase = somaReforcos + somaMensais + somaEntradas;

  const ultimoMesPermitidoReforco = params.duracaoMeses - params.mesesBloqueioReforco;
  if (params.bloquearReforcosUltimosMeses) {
    const existeReforcoBloqueado = linhas.some(
      (linha) => linha.reforco > 0 && linha.mes > ultimoMesPermitidoReforco
    );
    resultados.push(
      existeReforcoBloqueado
        ? "❌ Existe reforço dentro do período bloqueado"
        : "✅ Reforços respeitam bloqueio dos últimos meses"
    );
  }

  resultados.push(
    Math.abs(somaBase - alvoTotal) < 1
      ? "✅ Soma base do fluxo bate com o valor da unidade"
      : `❌ Divergência entre fluxo (${somaBase.toFixed(2)}) e alvo (${alvoTotal.toFixed(2)})`
  );

  if (!params.aplicarINCC) {
    const inccAplicado = linhas.some((linha) => linha.incc > 0);
    resultados.push(inccAplicado ? "❌ INCC aplicado indevidamente" : "✅ INCC ausente conforme configuração");
  }

  if (params.parcelaUnicaNasChaves) {
    const mensalForaUltimo = linhas.some((linha, index) => index !== linhas.length - 1 && linha.mensal > 0);
    resultados.push(
      mensalForaUltimo
        ? "❌ Mensais encontradas antes da parcela de chaves"
        : "✅ Mensais concentradas na parcela de chaves"
    );
  }

  if (params.mensaisUniformes) {
    const valoresMensais = linhas.filter((linha) => linha.mensal > 0).map((linha) => linha.mensal);
    const uniformes = valoresMensais.every((valor) => Math.abs(valor - valoresMensais[0]) < 1);
    resultados.push(uniformes ? "✅ Mensais uniformes" : "❌ Mensais variam quando deveriam ser uniformes");
  }

  if (params.semMensalEmMesDeReforco) {
    const conflito = linhas.some((linha) => linha.mensal > 0 && linha.reforco > 0);
    resultados.push(
      conflito ? "❌ Existe mensal em mês de reforço" : "✅ Mensais ausentes em meses com reforço"
    );
  }

  const sucesso = resultados.every((resultado) => resultado.startsWith("✅"));
  return { resultados, sucesso };
};
