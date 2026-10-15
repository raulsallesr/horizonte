import { useCallback, useEffect, useMemo, useState } from 'react'
import { VISAO_PADRAO, type Visao } from './componentes/dados'
import { GraficoFluxo, GraficoLeque, GraficoPatrimonio, GraficoProbabilidade } from './componentes/Graficos'
import { Kpis, Metas } from './componentes/Kpis'
import { PainelPremissas } from './componentes/PainelPremissas'
import { Tabela } from './componentes/Tabela'
import { Segmentado } from './componentes/ui'
import { idadeLiberdade, idadeVirada, impactoBarco } from './engine/metas'
import { premissasPadrao } from './engine/padrao'
import { projetar } from './engine/projecao'
import type { Premissas } from './engine/types'
import { carregarInicial, limparPersistencia, normalizar, persistir } from './estado/compartilhar'
import { useMonteCarlo } from './estado/useMonteCarlo'

type Tema = 'auto' | 'claro' | 'escuro'

function useTema() {
  const [tema, setTema] = useState<Tema>(() => {
    try {
      const t = window.localStorage.getItem('horizonte:tema')
      return t === 'claro' || t === 'escuro' ? t : 'auto'
    } catch {
      return 'auto'
    }
  })
  useEffect(() => {
    const raiz = document.documentElement
    if (tema === 'auto') raiz.removeAttribute('data-theme')
    else raiz.setAttribute('data-theme', tema)
    try {
      window.localStorage.setItem('horizonte:tema', tema)
    } catch {
      /* ignora */
    }
  }, [tema])
  return [tema, setTema] as const
}

export default function App() {
  const [p, setP] = useState<Premissas>(carregarInicial)
  const [v, setV] = useState<Visao>(VISAO_PADRAO)
  const [tema, setTema] = useTema()
  const [copiado, setCopiado] = useState(false)

  const set = useCallback((f: (x: Premissas) => Premissas) => setP((x) => normalizar(f(x))), [])

  useEffect(() => {
    const t = window.setTimeout(() => persistir(p), 250)
    return () => window.clearTimeout(t)
  }, [p])

  const series = useMemo(
    () => ({
      pessimista: projetar(p, 'pessimista'),
      base: projetar(p, 'base'),
      otimista: projetar(p, 'otimista'),
    }),
    [p],
  )
  const libs = useMemo(
    () => ({
      pessimista: idadeLiberdade(p, 'pessimista'),
      base: idadeLiberdade(p, 'base'),
      otimista: idadeLiberdade(p, 'otimista'),
    }),
    [p],
  )
  const impactos = useMemo(
    () =>
      p.barco.ativo
        ? { pessimista: impactoBarco(p, 'pessimista'), base: impactoBarco(p, 'base'), otimista: impactoBarco(p, 'otimista') }
        : null,
    [p],
  )
  const virada = useMemo(() => idadeVirada(p, series.base), [p, series])
  const { resultado: mc, calculando } = useMonteCarlo(p)

  const copiarLink = async () => {
    persistir(p)
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copie o link:', window.location.href)
    }
  }

  const restaurar = () => {
    limparPersistencia()
    setP(premissasPadrao())
  }

  const proximoTema = () => setTema(tema === 'auto' ? 'escuro' : tema === 'escuro' ? 'claro' : 'auto')
  const rotuloTema = tema === 'auto' ? '🌓 Auto' : tema === 'escuro' ? '🌙 Escuro' : '☀️ Claro'

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
            <path d="M24 6 L24 34 L10 34 Z" fill="var(--c-sol)" />
            <path d="M26 12 L26 34 L38 34 Z" fill="var(--c-base)" />
            <path d="M6 38 H42 L37 44 H11 Z" fill="var(--c-barco)" />
          </svg>
          <div>
            <h1>Horizonte</h1>
            <p>Simulador de liberdade financeira — e do seu barquinho</p>
          </div>
        </div>
        <div className="acoes">
          <button
            type="button"
            className="btn ir-premissas"
            onClick={() => document.getElementById('premissas')?.scrollIntoView({ behavior: 'smooth' })}
          >
            ⚙️ Premissas
          </button>
          <button type="button" className="btn" onClick={proximoTema} title="Alternar tema">
            {rotuloTema}
          </button>
          <button type="button" className="btn" onClick={restaurar}>
            Restaurar exemplo
          </button>
          <button type="button" className="btn primario" onClick={copiarLink}>
            {copiado ? '✓ Link copiado' : '🔗 Copiar link da simulação'}
          </button>
        </div>
      </header>

      <p className="aviso-exemplo">
        Os valores iniciais são <strong>fictícios</strong> (Marina, 30 anos). Mude qualquer número no painel — tudo recalcula na hora, no seu navegador.
      </p>

      <main className="layout">
        <PainelPremissas p={p} set={set} />

        <div className="resultados">
          <div className="visao" aria-label="Como ver os valores">
            <Segmentado
              rotulo="Valores"
              valor={v.real ? 'real' : 'nominal'}
              onChange={(x) => setV({ ...v, real: x === 'real' })}
              opcoes={[
                { id: 'real', nome: 'R$ de hoje' },
                { id: 'nominal', nome: 'Nominal (futuro)' },
              ]}
            />
            <Segmentado
              rotulo="Período do rendimento"
              valor={v.periodo}
              onChange={(x) => setV({ ...v, periodo: x })}
              opcoes={[
                { id: 'mensal', nome: 'Por mês' },
                { id: 'anual', nome: 'Por ano' },
              ]}
            />
            <Segmentado
              rotulo="Eixo"
              valor={v.eixo}
              onChange={(x) => setV({ ...v, eixo: x })}
              opcoes={[
                { id: 'idade', nome: 'Idade' },
                { id: 'ano', nome: 'Ano' },
              ]}
            />
          </div>

          <Kpis p={p} series={series} libs={libs} impactos={impactos} mc={mc} v={v} />
          <Metas p={p} libs={libs} impactos={impactos} />
          <GraficoPatrimonio p={p} series={series} v={v} idadeLiberdadeBase={libs.base} />
          <GraficoFluxo p={p} serieBase={series.base} v={v} idadeVirada={virada} />
          <GraficoLeque p={p} mc={mc} calculando={calculando} v={v} />
          <GraficoProbabilidade p={p} mc={mc} calculando={calculando} v={v} />
          <Tabela p={p} series={series} v={v} />
        </div>
      </main>

      <footer className="rodape">
        <p>
          <strong>Aviso:</strong> ferramenta educacional e de simulação. Não é recomendação de investimento, nem projeção garantida: retornos passados e hipóteses não se repetem. Para decisões reais, procure um profissional habilitado.
        </p>
        <p>🔒 Privacidade: nada sai do seu navegador. Suas premissas ficam só aqui e no link que você copiar.</p>
        <p>Horizonte · código aberto (MIT)</p>
      </footer>
    </div>
  )
}
