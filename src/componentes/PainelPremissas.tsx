import { numeroLiberdade } from '../engine/metas'
import { fmtBRLCompacto } from '../engine/formatos'
import { novaCompra } from '../engine/padrao'
import type { Compra, IdCenario, Premissas } from '../engine/types'
import { Campo, CampoTexto, Interruptor, Secao, Segmentado } from './ui'

interface Props {
  p: Premissas
  set: (f: (p: Premissas) => Premissas) => void
}

const CENARIOS: IdCenario[] = ['pessimista', 'base', 'otimista']

export function PainelPremissas({ p, set }: Props) {
  const up = <K extends keyof Premissas>(k: K, v: Premissas[K]) => set((x) => ({ ...x, [k]: v }))
  const upBarco = (patch: Partial<Premissas['barco']>) =>
    set((x) => ({ ...x, barco: { ...x.barco, ...patch } }))
  const upExtra = (id: string, patch: Partial<Compra>) =>
    set((x) => ({ ...x, extras: x.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))

  return (
    <aside id="premissas" className="painel" aria-label="Premissas da simulação">
      <a className="btn primario voltar-resultados" href="#resultados">
        ↑ Ver resultados atualizados
      </a>
      <Secao titulo="Você" icone="usuario">
        <CampoTexto rotulo="Nome" valor={p.nome} onChange={(v) => up('nome', v)} />
        <Campo rotulo="Idade hoje" valor={p.idadeAtual} min={18} max={70} sufixo="anos" onChange={(v) => up('idadeAtual', v)} />
        <Campo
          rotulo="Parar de trabalhar aos"
          valor={p.idadeParar}
          min={p.idadeAtual}
          max={80}
          sufixo="anos"
          ajuda="Até aqui você aporta; depois disso passa a viver do patrimônio."
          onChange={(v) => up('idadeParar', v)}
        />
        <Campo rotulo="Planejar até" valor={p.idadeFinal} min={Math.max(60, p.idadeParar + 1)} max={105} sufixo="anos" onChange={(v) => up('idadeFinal', v)} />
      </Secao>

      <Secao titulo="Renda e patrimônio de hoje" icone="renda">
        <Campo rotulo="Patrimônio investido hoje" valor={p.patrimonioInicial} min={0} max={1000000} passo={5000} prefixo="R$" maxDigitavel={1e9} onChange={(v) => up('patrimonioInicial', v)} />
        <Campo rotulo="Salário líquido mensal" valor={p.salarioMensal} min={1000} max={60000} passo={250} prefixo="R$" maxDigitavel={1e7} onChange={(v) => up('salarioMensal', v)} />
        <Campo
          rotulo="Aumento real do salário"
          valor={p.aumentoRealSalario}
          min={0}
          max={8}
          passo={0.1}
          sufixo="% a.a."
          ajuda="Acima da inflação. 0% = o salário só acompanha os preços."
          onChange={(v) => up('aumentoRealSalario', v)}
        />
        <Interruptor rotulo="Recebo 13º (aporta também em dezembro)" valor={p.decimoTerceiro} onChange={(v) => up('decimoTerceiro', v)} />
      </Secao>

      <Secao titulo="Aportes" icone="aporte">
        <Segmentado
          rotulo="Tipo de aporte"
          valor={p.aporteModo}
          onChange={(v) => up('aporteModo', v)}
          opcoes={[
            { id: 'percentual', nome: '% do salário' },
            { id: 'fixo', nome: 'Valor fixo' },
          ]}
        />
        {p.aporteModo === 'percentual' ? (
          <Campo rotulo="Quanto do salário aporto" valor={p.aportePercentual} min={0} max={70} passo={1} sufixo="%" onChange={(v) => up('aportePercentual', v)} />
        ) : (
          <>
            <Campo rotulo="Aporte mensal (R$ de hoje)" valor={p.aporteFixo} min={0} max={30000} passo={100} prefixo="R$" maxDigitavel={1e7} onChange={(v) => up('aporteFixo', v)} />
            <Campo rotulo="Crescimento real do aporte" valor={p.aumentoRealAporte} min={0} max={8} passo={0.1} sufixo="% a.a." onChange={(v) => up('aumentoRealAporte', v)} />
          </>
        )}
      </Secao>

      <Secao titulo="Investimentos e inflação" icone="investimentos">
        <Campo rotulo="Inflação (IPCA)" valor={p.inflacao} min={0} max={12} passo={0.1} sufixo="% a.a." onChange={(v) => up('inflacao', v)} />
        {CENARIOS.map((id) => {
          const c = p.cenarios[id]
          const real = ((1 + c.rentAnual / 100) / (1 + p.inflacao / 100) - 1) * 100
          return (
            <div key={id} className={`cenario cen-${id}`}>
              <Campo
                rotulo={`${c.nome} — rentabilidade líquida`}
                valor={c.rentAnual}
                min={0}
                max={25}
                passo={0.1}
                sufixo="% a.a."
                ajuda={`≈ ${real.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% a.a. acima da inflação`}
                onChange={(v) => set((x) => ({ ...x, cenarios: { ...x.cenarios, [id]: { ...x.cenarios[id], rentAnual: v } } }))}
              />
              <Campo
                rotulo="Oscilação (volatilidade)"
                valor={c.vol}
                min={0}
                max={30}
                passo={0.5}
                sufixo="% a.a."
                semSlider
                onChange={(v) => set((x) => ({ ...x, cenarios: { ...x.cenarios, [id]: { ...x.cenarios[id], vol: v } } }))}
              />
            </div>
          )
        })}
        <p className="ajuda">Use rentabilidade <strong>líquida</strong> (depois de IR e custos). A oscilação só vale para a simulação de probabilidades (cenário Base).</p>
      </Secao>

      <Secao titulo="Liberdade financeira" icone="liberdade">
        <Campo rotulo="Despesa mensal desejada" valor={p.despesaMensal} min={1000} max={40000} passo={250} prefixo="R$" maxDigitavel={1e7} ajuda="Em R$ de hoje." onChange={(v) => up('despesaMensal', v)} />
        <Campo rotulo="Outra renda após parar" valor={p.outraRendaPosParar} min={0} max={20000} passo={250} prefixo="R$" maxDigitavel={1e7} ajuda="INSS, aluguel, pensão… (R$ de hoje)." onChange={(v) => up('outraRendaPosParar', v)} />
        <Campo rotulo="Taxa de retirada segura" valor={p.taxaRetirada} min={2} max={6} passo={0.1} sufixo="% a.a." onChange={(v) => up('taxaRetirada', v)} />
        <p className="destaque-num">
          Número da liberdade: <strong>{fmtBRLCompacto(numeroLiberdade(p))}</strong> <span>(em R$ de hoje)</span>
        </p>
      </Secao>

      <Secao titulo="Meta: o barco" icone="barco">
        <Interruptor rotulo="Incluir o barco na simulação" valor={p.barco.ativo} onChange={(v) => upBarco({ ativo: v })} />
        {p.barco.ativo && (
          <>
            <CampoTexto rotulo="Nome" valor={p.barco.nome} onChange={(v) => upBarco({ nome: v })} />
            <Campo rotulo="Valor (R$ de hoje)" valor={p.barco.valor} min={10000} max={1500000} passo={5000} prefixo="R$" maxDigitavel={1e8} onChange={(v) => upBarco({ valor: v })} />
            <Campo rotulo="Comprar aos" valor={p.barco.idade} min={p.idadeAtual + 1} max={p.idadeFinal - 1} sufixo="anos" onChange={(v) => upBarco({ idade: v })} />
            <Campo rotulo="Manutenção anual" valor={p.barco.manutencaoPct} min={0} max={20} passo={0.5} sufixo="% do valor" ajuda="Marina, estaleiro, seguro, combustível… barco custa para manter." onChange={(v) => upBarco({ manutencaoPct: v })} />
            <Segmentado
              rotulo="Como pagar"
              valor={p.barco.modo}
              onChange={(v) => upBarco({ modo: v })}
              opcoes={[
                { id: 'vista', nome: 'À vista do patrimônio' },
                { id: 'caixinha', nome: 'Caixinha separada' },
              ]}
            />
            {p.barco.modo === 'caixinha' && (
              <Campo rotulo="Separar por mês (R$ de hoje)" valor={p.barco.caixinhaMensal} min={0} max={10000} passo={100} prefixo="R$" maxDigitavel={1e7} ajuda="Sai do aporte e rende junto até a compra; a sobra volta ao patrimônio." onChange={(v) => upBarco({ caixinhaMensal: v })} />
            )}
          </>
        )}
      </Secao>

      <Secao titulo="Outras metas" icone="meta" aberta={false}>
        {p.extras.map((e) => (
          <div key={e.id} className="extra">
            <CampoTexto rotulo="Meta" valor={e.nome} onChange={(v) => upExtra(e.id, { nome: v })} />
            <Campo rotulo="Valor (R$ de hoje)" valor={e.valor} min={0} max={1000000} passo={5000} prefixo="R$" maxDigitavel={1e8} onChange={(v) => upExtra(e.id, { valor: v })} />
            <Campo rotulo="Aos" valor={e.idade} min={p.idadeAtual + 1} max={p.idadeFinal - 1} sufixo="anos" onChange={(v) => upExtra(e.id, { idade: v })} />
            <button type="button" className="link-perigo" onClick={() => set((x) => ({ ...x, extras: x.extras.filter((y) => y.id !== e.id) }))}>
              Remover
            </button>
          </div>
        ))}
        {p.extras.length < 8 && (
          <button type="button" className="btn" onClick={() => set((x) => ({ ...x, extras: [...x.extras, novaCompra(x.idadeAtual)] }))}>
            + Adicionar meta
          </button>
        )}
      </Secao>
    </aside>
  )
}
