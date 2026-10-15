import { useMemo } from 'react'
import type { DiagnosticoPlano as Diagnostico, ResumoPlano } from '../engine/diagnostico'
import { resumirPlano } from '../engine/diagnostico'
import { fmtBRL, fmtBRLCompacto, fmtIdade } from '../engine/formatos'
import { deficitMetaReal } from '../engine/metas'
import type { ResultadoMonteCarlo } from '../engine/montecarlo'
import type { Premissas, Serie } from '../engine/types'
import type { PlanoReferencia } from '../estado/comparacao'
import { Icone } from './ui'

interface Props {
  p: Premissas
  serieBase: Serie
  diagnostico: Diagnostico
  calculandoAjustes: boolean
  mc: ResultadoMonteCarlo | null
  referencia: PlanoReferencia | null
  set: (f: (p: Premissas) => Premissas) => void
  onSalvarReferencia: () => void
  onRemoverReferencia: () => void
}

function textoIdade(idade: number | null): string {
  return idade === null ? 'não atingida' : fmtIdade(idade)
}

function Comparacao({ atual, referencia }: { atual: ResumoPlano; referencia: ResumoPlano }) {
  return (
    <div className="comparacao-tabela" role="table" aria-label="Comparação com o plano de referência">
      <div className="comparacao-linha cabecalho" role="row">
        <span role="columnheader">Indicador</span>
        <span role="columnheader">Referência</span>
        <span role="columnheader">Atual</span>
      </div>
      <div className="comparacao-linha" role="row">
        <span role="rowheader">Liberdade no cenário Base</span>
        <strong role="cell">{textoIdade(referencia.idadeLiberdade)}</strong>
        <strong role="cell">{textoIdade(atual.idadeLiberdade)}</strong>
      </div>
      <div className="comparacao-linha" role="row">
        <span role="rowheader">Patrimônio ao parar</span>
        <strong role="cell">{fmtBRLCompacto(referencia.patrimonioAoParar)}</strong>
        <strong role="cell">{fmtBRLCompacto(atual.patrimonioAoParar)}</strong>
      </div>
      <div className="comparacao-linha" role="row">
        <span role="rowheader">Renda sustentável</span>
        <strong role="cell">{fmtBRL(referencia.rendaSustentavel)}/mês</strong>
        <strong role="cell">{fmtBRL(atual.rendaSustentavel)}/mês</strong>
      </div>
      <div className="comparacao-linha" role="row">
        <span role="rowheader">Metas realizadas</span>
        <strong role="cell">{referencia.metasRealizadas}/{referencia.totalMetas}</strong>
        <strong role="cell">{atual.metasRealizadas}/{atual.totalMetas}</strong>
      </div>
    </div>
  )
}

export function DiagnosticoPlano({
  p,
  serieBase,
  diagnostico,
  calculandoAjustes,
  mc,
  referencia,
  set,
  onSalvarReferencia,
  onRemoverReferencia,
}: Props) {
  const resumoAtual = useMemo(() => resumirPlano(p, serieBase), [p, serieBase])
  const resumoReferencia = useMemo(
    () => (referencia ? resumirPlano(referencia.premissas) : null),
    [referencia],
  )
  const aporteMaior =
    diagnostico.aporteMinimoHoje !== null &&
    diagnostico.aporteMinimoHoje > diagnostico.aporteAtualHoje + 49
  const idadePosterior = diagnostico.idadeViavel !== null && diagnostico.idadeViavel > p.idadeParar
  const despesaMenor =
    diagnostico.despesaSustentavelHoje !== null &&
    diagnostico.despesaSustentavelHoje < p.despesaMensal - 49
  const temAcoes = aporteMaior || idadePosterior || despesaMenor || diagnostico.metasPendentes.length > 0

  const aplicarMeta = (id: string, patch: { idade?: number; valor?: number }) =>
    set((atual) => id === atual.barco.id
      ? { ...atual, barco: { ...atual.barco, ...patch } }
      : { ...atual, extras: atual.extras.map((meta) => meta.id === id ? { ...meta, ...patch } : meta) })

  return (
    <section className={`diagnostico cartao diag-${diagnostico.nivel}`} aria-labelledby="titulo-diagnostico">
      <header className="diagnostico-topo">
        <div>
          <p className="sobretitulo"><Icone nome="diagnostico" /> Leitura do plano</p>
          <h2 id="titulo-diagnostico">
            {diagnostico.nivel === 'saudavel'
              ? 'O plano Base fecha com as premissas atuais'
              : diagnostico.nivel === 'critico'
                ? 'O plano precisa de ajustes para durar'
                : 'O plano está perto, mas ainda há pontos a resolver'}
          </h2>
          <p>
            Diagnóstico determinístico do cenário Base. Use as probabilidades como margem de segurança, não como garantia.
          </p>
        </div>
        <span className="selo-diagnostico">
          {diagnostico.nivel === 'saudavel' ? 'No caminho' : diagnostico.nivel === 'critico' ? 'Revisar agora' : 'Ajustar'}
        </span>
      </header>

      <ul className="checklist-plano">
        <li className={diagnostico.liberdadeNoPrazo ? 'ok' : 'falha'}>
          <Icone nome={diagnostico.liberdadeNoPrazo ? 'check' : 'alerta'} />
          Patrimônio aos {p.idadeParar} anos {diagnostico.liberdadeNoPrazo ? 'cobre' : 'não cobre'} o número da liberdade.
        </li>
        <li className={diagnostico.duraAteOHorizonte ? 'ok' : 'falha'}>
          <Icone nome={diagnostico.duraAteOHorizonte ? 'check' : 'alerta'} />
          O patrimônio {diagnostico.duraAteOHorizonte ? 'não zera' : 'zera'} na fase de saque até os {p.idadeFinal} anos.
        </li>
        <li className={diagnostico.metasPendentes.length === 0 ? 'ok' : 'falha'}>
          <Icone nome={diagnostico.metasPendentes.length === 0 ? 'check' : 'alerta'} />
          {diagnostico.metasPendentes.length === 0
            ? 'Todas as metas cabem no cenário Base.'
            : `${diagnostico.metasPendentes.length} meta(s) ainda não cabem no cenário Base.`}
        </li>
        {mc && (
          <li className={mc.probDura >= 0.8 ? 'ok' : 'falha'}>
            <Icone nome={mc.probDura >= 0.8 ? 'check' : 'alerta'} />
            Em 5.000 trajetórias, a chance de o patrimônio durar foi {(mc.probDura * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%.
          </li>
        )}
      </ul>

      {calculandoAjustes && (
        <p className="diagnostico-calculando" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" /> Calculando ajustes aplicáveis…
        </p>
      )}

      {temAcoes && (
        <div className="recomendacoes" aria-labelledby="titulo-recomendacoes">
          <div className="recomendacoes-cabecalho">
            <h3 id="titulo-recomendacoes">Ajustes calculados</h3>
            <p>Teste uma alternativa por vez. Cada botão altera as premissas e recalcula o plano completo.</p>
          </div>
          <div className="recomendacoes-grade">
            {aporteMaior && (
              <article className="recomendacao">
                <span className="recomendacao-tipo">Aporte</span>
                <strong>{fmtBRL(diagnostico.aporteMinimoHoje!)}/mês</strong>
                <p>Estimativa mínima em valor fixo de hoje, sem aumento real, para o plano Base fechar.</p>
                <button className="btn" type="button" onClick={() => set((atual) => ({ ...atual, aporteModo: 'fixo', aporteFixo: diagnostico.aporteMinimoHoje!, aumentoRealAporte: 0 }))}>
                  Aplicar aporte sugerido
                </button>
              </article>
            )}
            {idadePosterior && (
              <article className="recomendacao">
                <span className="recomendacao-tipo">Prazo</span>
                <strong>Parar aos {diagnostico.idadeViavel} anos</strong>
                <p>Primeira idade inteira em que patrimônio, saques e metas fecham no cenário Base.</p>
                <button className="btn" type="button" onClick={() => set((atual) => ({ ...atual, idadeParar: diagnostico.idadeViavel! }))}>
                  Usar esta idade
                </button>
              </article>
            )}
            {despesaMenor && (
              <article className="recomendacao">
                <span className="recomendacao-tipo">Despesa</span>
                <strong>{fmtBRL(diagnostico.despesaSustentavelHoje!)}/mês</strong>
                <p>Maior despesa estimada que preserva o plano Base e as metas informadas.</p>
                <button className="btn" type="button" onClick={() => set((atual) => ({ ...atual, despesaMensal: diagnostico.despesaSustentavelHoje! }))}>
                  Ajustar despesa
                </button>
              </article>
            )}
            {diagnostico.metasPendentes.map((meta) => {
              const alternativa = diagnostico.alternativasMetas.find((item) => item.id === meta.id)
              return (
                <article className="recomendacao" key={meta.id}>
                  <span className="recomendacao-tipo">Meta · {meta.nome || 'sem nome'}</span>
                  <strong>Faltam {fmtBRLCompacto(deficitMetaReal(meta))}</strong>
                  <p>Escolha adiar a meta ou reduzir seu valor; o simulador nunca cria dívida automaticamente.</p>
                  <div className="recomendacao-acoes">
                    {alternativa?.idadePossivel && (
                      <button className="btn" type="button" onClick={() => aplicarMeta(meta.id, { idade: alternativa.idadePossivel! })}>
                        Adiar para {alternativa.idadePossivel} anos
                      </button>
                    )}
                    {alternativa && alternativa.valorMaximoHoje > 0 && (
                      <button className="btn" type="button" onClick={() => aplicarMeta(meta.id, { valor: alternativa.valorMaximoHoje })}>
                        Reduzir para {fmtBRLCompacto(alternativa.valorMaximoHoje)}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      <details className="comparacao" open={Boolean(referencia)}>
        <summary><Icone nome="comparar" /> Comparar versões do plano</summary>
        <div className="comparacao-corpo">
          <p>Guarde uma fotografia das premissas neste navegador e compare antes e depois dos ajustes.</p>
          <div className="comparacao-acoes">
            <button type="button" className="btn" onClick={onSalvarReferencia}>
              <Icone nome="salvar" /> {referencia ? 'Atualizar referência' : 'Salvar plano como referência'}
            </button>
            {referencia && <button type="button" className="btn" onClick={onRemoverReferencia}>Remover referência</button>}
          </div>
          {resumoReferencia && <Comparacao atual={resumoAtual} referencia={resumoReferencia} />}
        </div>
      </details>
    </section>
  )
}
