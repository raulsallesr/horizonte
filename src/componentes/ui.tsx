import { useId, useState, type ReactNode } from 'react'

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
  const [rascunho, setRascunho] = useState<string | null>(null)
  const limiteDigitavel = maxDigitavel ?? max

  const digitar = (txt: string) => {
    setRascunho(txt)
    const n = Number(txt.replace(',', '.'))
    if (txt.trim() !== '' && Number.isFinite(n) && n >= min && n <= limiteDigitavel) onChange(n)
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
            onBlur={() => setRascunho(null)}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
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
            onChange(Number(e.target.value))
          }}
        />
      )}
      {ajuda && <p className="ajuda">{ajuda}</p>}
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
  icone: string
  children: ReactNode
  aberta?: boolean
}) {
  return (
    <details className="secao" open={aberta}>
      <summary>
        <span className="icone" aria-hidden="true">
          {icone}
        </span>
        {titulo}
      </summary>
      <div className="secao-corpo">{children}</div>
    </details>
  )
}
