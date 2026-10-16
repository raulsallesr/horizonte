import type { Compra, FluxoPosParar, Premissas } from './types'

/** Persona fictícia "Marina, 30 anos" — nenhum dado real. */
export function premissasPadrao(anoBase = new Date().getFullYear()): Premissas {
  return {
    nome: 'Marina',
    anoBase,
    idadeAtual: 30,
    idadeParar: 55,
    idadeFinal: 90,
    patrimonioInicial: 40000,
    salarioMensal: 10000,
    aumentoRealSalario: 1.5,
    decimoTerceiro: true,
    aporteModo: 'percentual',
    aportePercentual: 30,
    aporteFixo: 2000,
    aumentoRealAporte: 0,
    reservaEmergencia: {
      ativa: false,
      saldoInicial: 0,
      mesesDespesa: 6,
      aporteMensal: 500,
    },
    inflacao: 4.5,
    despesaMensal: 5000,
    outraRendaPosParar: 0,
    estrategiaPosParar: 'renda_passiva',
    taxaRendaPassiva: 4,
    taxaRetirada: 4,
    fluxosPosParar: [],
    cenarios: {
      pessimista: { id: 'pessimista', nome: 'Pessimista', rentAnual: 9, vol: 7 },
      base: { id: 'base', nome: 'Base', rentAnual: 11, vol: 9 },
      otimista: { id: 'otimista', nome: 'Otimista', rentAnual: 13, vol: 11 },
    },
    barco: {
      id: 'barco',
      nome: 'Barquinho',
      ativo: true,
      valor: 120000,
      idade: 42,
      manutencaoPct: 5,
      modo: 'caixinha',
      caixinhaMensal: 1000,
    },
    extras: [
      {
        id: 'extra-carro',
        nome: 'Troca de carro',
        valor: 60000,
        idade: 38,
        manutencaoPct: 0,
        modo: 'vista',
        caixinhaMensal: 0,
      },
    ],
  }
}

export function novoFluxoPosParar(idadeParar: number, idadeFinal: number): FluxoPosParar {
  return {
    id: `fluxo-${Math.random().toString(36).slice(2, 8)}`,
    nome: 'Trabalho parcial',
    tipo: 'renda',
    valorMensal: 2000,
    idadeInicio: idadeParar,
    idadeFim: Math.min(idadeFinal, idadeParar + 5),
  }
}

export function novaCompra(idadeAtual: number): Compra {
  return {
    id: `extra-${Math.random().toString(36).slice(2, 8)}`,
    nome: 'Nova meta',
    valor: 50000,
    idade: idadeAtual + 5,
    manutencaoPct: 0,
    modo: 'vista',
    caixinhaMensal: 0,
  }
}
