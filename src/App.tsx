import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { VISAO_PADRAO, type Visao } from './componentes/dados'
import { Kpis, Metas } from './componentes/Kpis'
import { PainelPremissas } from './componentes/PainelPremissas'
import { Icone, Segmentado } from './componentes/ui'
import { idadeLiberdade, idadeVirada, impactoBarco } from './engine/metas'
import { premissasPadrao } from './engine/padrao'
import { projetar } from './engine/projecao'
import type { Premissas } from './engine/types'
import { carregarInicial, limparPersistencia, normalizar, persistir } from './estado/compartilhar'
import { useMonteCarlo } from './estado/useMonteCarlo'

const ResultadosDetalhados = lazy(() => import('./componentes/ResultadosDetalhados'))

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
  const [inicial] = useState(carregarInicial)
  const [p, setP] = useState<Premissas>(inicial.premissas)
  const [avisoInicial, setAvisoInicial] = useState(inicial.aviso)
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
  const { resultado: mc, fase: faseMc, calculando, progresso, erro: erroMc, recalcular } = useMonteCarlo(p)

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
    setAvisoInicial(null)
  }

  const proximoTema = () => setTema(tema === 'auto' ? 'escuro' : tema === 'escuro' ? 'claro' : 'auto')
  const rotuloTema = tema === 'auto' ? 'Auto' : tema === 'escuro' ? 'Escuro' : 'Claro'

  return (
    <div className="app">
      <a className="pular-conteudo" href="#resultados">Pular para os resultados</a>
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
            <Icone nome="ajustes" /> Premissas
          </button>
          <button type="button" className="btn" onClick={proximoTema} title="Alternar tema">
            <Icone nome="tema" /> {rotuloTema}
          </button>
          <button type="button" className="btn" onClick={restaurar}>
            Restaurar exemplo
          </button>
          <button type="button" className="btn primario" onClick={copiarLink}>
            <Icone nome={copiado ? 'check' : 'link'} /> {copiado ? 'Link copiado' : 'Copiar link da simulação'}
          </button>
        </div>
      </header>

      {avisoInicial && (
        <div className="aviso-sistema" role="alert">
          <span>{avisoInicial}</span>
          <button type="button" className="btn" onClick={() => setAvisoInicial(null)}>Entendi</button>
        </div>
      )}

      <p className="aviso-exemplo">
        Os valores iniciais são <strong>fictícios</strong> (Marina, 30 anos). Mude qualquer número no painel — tudo recalcula na hora, no seu navegador.
      </p>

      <main className="layout">
        <PainelPremissas p={p} set={set} />

        <div id="resultados" className="resultados" aria-busy={calculando}>
          <h2 className="sr-only">Resultados da simulação</h2>
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

          {calculando && (
            <div className="estado-calculo" role="status" aria-live="polite">
              <span className="spinner" aria-hidden="true" />
              {faseMc === 'aguardando'
                ? 'Preparando a simulação de probabilidades…'
                : `Calculando 5.000 futuros possíveis${progresso > 0 ? ` · ${Math.round(progresso * 100)}%` : '…'}`}
            </div>
          )}
          {erroMc && (
            <div className="erro-calculo" role="alert">
              <span>{erroMc} Os resultados determinísticos continuam válidos.</span>
              <button type="button" className="btn" onClick={recalcular}>Tentar novamente</button>
            </div>
          )}

          <Kpis p={p} series={series} libs={libs} impactos={impactos} mc={mc} mcIndisponivel={Boolean(erroMc)} v={v} />
          <Metas p={p} series={series} libs={libs} impactos={impactos} mc={mc} />
          <Suspense fallback={<div className="carregando-detalhes" role="status">Carregando gráficos e tabela…</div>}>
            <ResultadosDetalhados
              p={p}
              series={series}
              v={v}
              libs={libs}
              virada={virada}
              mc={mc}
              calculando={calculando}
            />
          </Suspense>
        </div>
      </main>

      <footer className="rodape">
        <p>
          <strong>Aviso:</strong> ferramenta educacional e de simulação. Não é recomendação de investimento, nem projeção garantida: retornos passados e hipóteses não se repetem. Para decisões reais, procure um profissional habilitado.
        </p>
        <p className="linha-icone"><Icone nome="privacidade" /> Privacidade: nada sai do seu navegador. Suas premissas ficam só aqui e no link que você copiar.</p>
        <p>Horizonte · código aberto (MIT)</p>
      </footer>
    </div>
  )
}
