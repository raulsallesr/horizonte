import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VISAO_PADRAO, type Visao } from './componentes/dados'
import { DiagnosticoPlano } from './componentes/DiagnosticoPlano'
import { Kpis, Metas } from './componentes/Kpis'
import { PainelPremissas } from './componentes/PainelPremissas'
import { Icone, Segmentado } from './componentes/ui'
import { idadeLiberdade, idadeVirada, impactoBarco } from './engine/metas'
import { premissasPadrao } from './engine/padrao'
import { projetar } from './engine/projecao'
import type { Premissas } from './engine/types'
import { carregarInicial, limparPersistencia, normalizar, persistir } from './estado/compartilhar'
import { lerPlanoReferencia, removerPlanoReferencia, salvarPlanoReferencia, type PlanoReferencia } from './estado/comparacao'
import { useMonteCarlo } from './estado/useMonteCarlo'
import { useDiagnostico } from './estado/useDiagnostico'

const ResultadosDetalhados = lazy(() => import('./componentes/ResultadosDetalhados'))

type Tema = 'auto' | 'claro' | 'escuro'
type ModoPainel = 'simples' | 'avancado'

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

function useModoPainel() {
  const [modo, setModo] = useState<ModoPainel>(() => {
    try {
      return window.localStorage.getItem('horizonte:modo-painel') === 'avancado' ? 'avancado' : 'simples'
    } catch {
      return 'simples'
    }
  })
  useEffect(() => {
    try {
      window.localStorage.setItem('horizonte:modo-painel', modo)
    } catch {
      /* ignora */
    }
  }, [modo])
  return [modo, setModo] as const
}

function useConectividade() {
  const [online, setOnline] = useState(() => {
    try {
      return navigator.onLine && window.sessionStorage.getItem('horizonte:offline') !== '1'
    } catch {
      return navigator.onLine
    }
  })
  const [offlinePronto, setOfflinePronto] = useState(false)

  useEffect(() => {
    let ativo = true
    let versaoSinal = 0
    const ficouOnline = () => {
      setOnline(true)
      try {
        window.sessionStorage.removeItem('horizonte:offline')
      } catch {
        /* ignora */
      }
    }
    const ficouOffline = () => {
      versaoSinal += 1
      setOnline(false)
      try {
        window.sessionStorage.setItem('horizonte:offline', '1')
      } catch {
        /* ignora */
      }
    }
    const verificarRede = async () => {
      const versaoVerificacao = versaoSinal
      try {
        const resposta = await fetch('./manifest.webmanifest?conectividade=1', { cache: 'no-store' })
        if (!resposta.ok) throw new Error('Rede indisponível')
        if (!ativo || versaoVerificacao !== versaoSinal) return
        if (navigator.onLine) ficouOnline()
        else ficouOffline()
      } catch {
        if (ativo) ficouOffline()
      }
    }
    const possivelmenteOnline = () => void verificarRede()

    window.addEventListener('online', possivelmenteOnline)
    window.addEventListener('offline', ficouOffline)
    void verificarRede()

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => ativo && setOfflinePronto(true)).catch(() => undefined)
    }
    return () => {
      ativo = false
      window.removeEventListener('online', possivelmenteOnline)
      window.removeEventListener('offline', ficouOffline)
    }
  }, [])

  return { online, offlinePronto }
}

function useDetalhesProximos() {
  const ancora = useRef<HTMLDivElement>(null)
  const [carregar, setCarregar] = useState(false)

  useEffect(() => {
    const alvo = ancora.current
    if (!alvo || !('IntersectionObserver' in window)) {
      setCarregar(true)
      return
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return
        setCarregar(true)
        observador.disconnect()
      },
      { rootMargin: '600px 0px' },
    )
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [])

  return { ancora, carregar }
}

export default function App() {
  const [inicial] = useState(carregarInicial)
  const [p, setP] = useState<Premissas>(inicial.premissas)
  const [avisoInicial, setAvisoInicial] = useState(inicial.aviso)
  const [v, setV] = useState<Visao>(VISAO_PADRAO)
  const [tema, setTema] = useTema()
  const [modoPainel, setModoPainel] = useModoPainel()
  const [referencia, setReferencia] = useState<PlanoReferencia | null>(lerPlanoReferencia)
  const [copiado, setCopiado] = useState(false)
  const { online, offlinePronto } = useConectividade()
  const { ancora: ancoraDetalhes, carregar: carregarDetalhes } = useDetalhesProximos()

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
  const { diagnostico, calculando: calculandoDiagnostico } = useDiagnostico(p, series.base)
  const { resultado: mc, fase: faseMc, calculando, progresso, erro: erroMc, recalcular } = useMonteCarlo(p)

  const salvarReferencia = () => setReferencia(salvarPlanoReferencia(p))
  const removerReferencia = () => {
    removerPlanoReferencia()
    setReferencia(null)
  }

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

      {!online && (
        <div className="aviso-offline" role="status" aria-live="polite">
          <Icone nome="offline" />
          <span><strong>Você está offline.</strong> A simulação continua funcionando neste dispositivo; links só poderão ser compartilhados quando a conexão voltar.</span>
        </div>
      )}

      <p className="aviso-exemplo">
        Os valores iniciais são <strong>fictícios</strong> (Marina, 30 anos). Mude qualquer número no painel — tudo recalcula na hora, no seu navegador.
      </p>

      <main className="layout">
        <PainelPremissas p={p} set={set} modo={modoPainel} onModo={setModoPainel} />

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

          <DiagnosticoPlano
            p={p}
            serieBase={series.base}
            diagnostico={diagnostico}
            calculandoAjustes={calculandoDiagnostico}
            mc={mc}
            referencia={referencia}
            set={set}
            onSalvarReferencia={salvarReferencia}
            onRemoverReferencia={removerReferencia}
          />
          <Kpis p={p} series={series} libs={libs} impactos={impactos} mc={mc} mcIndisponivel={Boolean(erroMc)} v={v} />
          <Metas p={p} series={series} libs={libs} impactos={impactos} mc={mc} />
          <div ref={ancoraDetalhes} className="detalhes-sob-demanda">
            {carregarDetalhes ? (
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
            ) : (
              <div className="carregando-detalhes" role="status">Os gráficos e a tabela serão carregados ao se aproximarem da tela.</div>
            )}
          </div>
        </div>
      </main>

      <footer className="rodape">
        <p>
          <strong>Aviso:</strong> ferramenta educacional e de simulação. Não é recomendação de investimento, nem projeção garantida: retornos passados e hipóteses não se repetem. Para decisões reais, procure um profissional habilitado.
        </p>
        <p className="linha-icone"><Icone nome="privacidade" /> Privacidade: nada sai do seu navegador. Suas premissas ficam só aqui e no link que você copiar.</p>
        {offlinePronto && <p className="linha-icone"><Icone nome="offline" /> Pronto para funcionar offline neste dispositivo.</p>}
        <p>Horizonte · código aberto (MIT)</p>
      </footer>
    </div>
  )
}
