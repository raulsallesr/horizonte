import { useId, useState, type ReactNode } from 'react'
import { analisarNumero } from './numeros'

export type NomeIcone =
  | 'usuario'
  | 'renda'
  | 'aporte'
  | 'investimentos'
  | 'liberdade'
  | 'barco'
  | 'meta'
  | 'ajustes'
  | 'tema'
  | 'link'
  | 'check'
  | 'privacidade'
  | 'diagnostico'
  | 'alerta'
  | 'comparar'
  | 'salvar'
  | 'offline'

const CAMINHOS_ICONES: Record<NomeIcone, string> = {
  usuario: 'M20 21a8 8 0 0 0-16 0 M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  renda: 'M3 7h18v12H3z M3 10h18 M7 15h2',
  aporte: 'M12 22V10 M12 14c-5 0-7-3-7-7 5 0 7 3 7 7 M12 11c4 0 6-2 6-6-4 0-6 2-6 6',
  investimentos: 'M4 19V9 M10 19V5 M16 19v-7 M22 19V3 M2 19h22',
  liberdade: 'M4 20h16 M7 20c0-5 2-9 5-13 3 4 5 8 5 13 M9 7l3-4 3 4',
  barco: 'M3 18h18l-3 3H6z M12 3v12 M12 5 5 8h-5 M12 7l-5 6h5',
  meta: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12 M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  ajustes: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M19 12l2-1-2-4-2 1-2-1-1-3h-4l-1 3-2 1-2-1-2 4 2 1 2 1 1 3h4l1-3 2-1 2 1 2-4z',
  tema: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9',
  link: 'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1 M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1',
  check: 'M4 12l5 5L20 6',
  privacidade: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  diagnostico: 'M4 19V9 M10 19v-5 M16 19V5 M22 19v-8 M2 19h22',
  alerta: 'M12 3 2 21h20L12 3z M12 9v5 M12 18h.01',
  comparar: 'M7 7h13 M16 3l4 4-4 4 M17 17H4 M8 13l-4 4 4 4',
  salvar: 'M5 3h12l3 3v15H4V3h1 M8 3v6h8V3 M8 21v-7h8v7',
  offline: 'M5 5l14 14 M8.5 8.5A5.5 5.5 0 0 1 18 13h1a3 3 0 0 1 2.8 4 M6 17H5a3 3 0 0 1-.7-5.9 M9 17h6',
}

export function Icone({ nome, tamanho = 18 }: { nome: NomeIcone; tamanho?: number }) {
  return (
    <svg
      className="icone-svg"
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={CAMINHOS_ICONES[nome]} />
    </svg>
  )
}

interface CampoProps {
  rotulo: string
  valor: number
  onChange: (v: number) => void
  min: number
  max: number
  passo?: number
  prefixo?: string
  sufixo?: string
  ajuda?: string
  /** Esconde o slider (só campo numérico). */
  semSlider?: boolean
  /** Permite digitar além do máximo do slider (até `maxDigitavel`). */
  maxDigitavel?: number
}

/** Campo numérico + slider. O texto só é confirmado quando válido; ao sair do campo volta ao valor atual. */
export function Campo({
  rotulo,
  valor,
  onChange,
  min,
  max,
  passo = 1,
  prefixo,
  sufixo,
  ajuda,
  semSlider,
  maxDigitavel,
}: CampoProps) {
  const id = useId()
  const ajudaId = `${id}-ajuda`
  const erroId = `${id}-erro`
  const [rascunho, setRascunho] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const limiteDigitavel = maxDigitavel ?? max

  const digitar = (txt: string) => {
    setRascunho(txt)
    setErro(null)
    const resultado = analisarNumero(txt, min, limiteDigitavel)
    if (resultado.valor !== null) onChange(resultado.valor)
  }

  const confirmar = () => {
    if (rascunho === null) return
    const resultado = analisarNumero(rascunho, min, limiteDigitavel)
    if (resultado.erro) {
      setErro(resultado.erro)
      return
    }
    onChange(resultado.valor!)
    setRascunho(null)
    setErro(null)
  }

  return (
    <div className="campo">
      <div className="campo-topo">
        <label htmlFor={id}>{rotulo}</label>
        <div className="campo-entrada">
          {prefixo && <span className="afixo">{prefixo}</span>}
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={rascunho ?? String(valor).replace('.', ',')}
            onChange={(e) => digitar(e.target.value)}
            onBlur={confirmar}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            aria-invalid={erro ? 'true' : undefined}
            aria-describedby={[ajuda && ajudaId, erro && erroId].filter(Boolean).join(' ') || undefined}
          />
          {sufixo && <span className="afixo">{sufixo}</span>}
        </div>
      </div>
      {!semSlider && (
        <input
          className="slider"
          type="range"
          aria-label={rotulo}
          min={min}
          max={max}
          step={passo}
          value={Math.min(max, Math.max(min, valor))}
          onChange={(e) => {
            setRascunho(null)
            setErro(null)
            onChange(Number(e.target.value))
          }}
        />
      )}
      {ajuda && <p id={ajudaId} className="ajuda">{ajuda}</p>}
      {erro && <p id={erroId} className="erro-campo" role="alert">{erro}</p>}
    </div>
  )
}

export function CampoTexto({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string
  valor: string
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div className="campo">
      <div className="campo-topo">
        <label htmlFor={id}>{rotulo}</label>
        <input
          id={id}
          className="texto"
          type="text"
          maxLength={40}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export function Interruptor({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string
  valor: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="interruptor">
      <input type="checkbox" checked={valor} onChange={(e) => onChange(e.target.checked)} />
      <span className="trilho" aria-hidden="true" />
      <span>{rotulo}</span>
    </label>
  )
}

export function Segmentado<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: { id: T; nome: string }[]
  valor: T
  onChange: (v: T) => void
  rotulo: string
}) {
  return (
    <div className="seg" role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          className={o.id === valor ? 'on' : ''}
          aria-pressed={o.id === valor}
          onClick={() => onChange(o.id)}
        >
          {o.nome}
        </button>
      ))}
    </div>
  )
}

export function Secao({
  titulo,
  icone,
  children,
  aberta = true,
}: {
  titulo: string
  icone: NomeIcone
  children: ReactNode
  aberta?: boolean
}) {
  return (
    <details className="secao" open={aberta}>
      <summary>
        <span className="icone" aria-hidden="true">
          <Icone nome={icone} />
        </span>
        {titulo}
      </summary>
      <div className="secao-corpo">{children}</div>
    </details>
  )
}
