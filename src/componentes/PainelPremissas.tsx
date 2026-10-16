import { numeroLiberdade } from '../engine/metas'
import { fmtBRLCompacto } from '../engine/formatos'
import { novaCompra, novoFluxoPosParar } from '../engine/padrao'
import type { Compra, FluxoPosParar, IdCenario, Premissas } from '../engine/types'
import { Campo, CampoTexto, Icone, Interruptor, Secao, Segmentado } from './ui'

interface Props {
  p: Premissas
  set: (f: (p: Premissas) => Premissas) => void
  modo: 'simples' | 'avancado'
  onModo: (modo: 'simples' | 'avancado') => void
}

const CENARIOS: IdCenario[] = ['pessimista', 'base', 'otimista']

export function PainelPremissas({ p, set, modo, onModo }: Props) {
  const up = <K extends keyof Premissas>(k: K, v: Premissas[K]) => set((x) => ({ ...x, [k]: v }))
  const upBarco = (patch: Partial<Premissas['barco']>) =>
    set((x) => ({ ...x, barco: { ...x.barco, ...patch } }))
  const upReserva = (patch: Partial<Premissas['reservaEmergencia']>) =>
    set((x) => ({ ...x, reservaEmergencia: { ...x.reservaEmergencia, ...patch } }))
  const upExtra = (id: string, patch: Partial<Compra>) =>
    set((x) => ({ ...x, extras: x.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  const upFluxo = (id: string, patch: Partial<FluxoPosParar>) =>
    set((x) => ({ ...x, fluxosPosParar: x.fluxosPosParar.map((f) => (f.id === id ? { ...f, ...patch } : f)) }))
  const soRendaPassiva = p.estrategiaPosParar === 'renda_passiva'
  const metaReserva = p.despesaMensal * p.reservaEmergencia.mesesDespesa
  const faltaReserva = Math.max(0, metaReserva - p.reservaEmergencia.saldoInicial)
  const progressoReserva = metaReserva > 0
    ? Math.min(1, p.reservaEmergencia.saldoInicial / metaReserva)
    : 1

  return (
    <aside id="premissas" className="painel" aria-label="Premissas da simulação">
      <a className="btn primario voltar-resultados" href="#resultados">
        ↑ Ver resultados atualizados
      </a>
      <div className="modo-painel">
        <span className="modo-painel-rotulo">Nível de detalhe</span>
        <Segmentado
          rotulo="Nível de detalhe das premissas"
          valor={modo}
          onChange={onModo}
          opcoes={[
            { id: 'simples', nome: 'Simples' },
            { id: 'avancado', nome: 'Avançado' },
          ]}
        />
        <p>
          {modo === 'simples'
            ? 'Só as decisões principais. Configurações avançadas existentes continuam valendo.'
            : 'Todas as hipóteses do modelo ficam disponíveis.'}
        </p>
      </div>
      <Secao titulo="Você" icone="usuario">
        <CampoTexto rotulo="Nome" valor={p.nome} onChange={(v) => up('nome', v)} />
        <Campo rotulo="Idade hoje" valor={p.idadeAtual} min={18} max={70} sufixo="anos" onChange={(v) => up('idadeAtual', v)} />
        <Campo
          rotulo="Parar de trabalhar aos"
          valor={p.idadeParar}
          min={p.idadeAtual}
          max={80}
          sufixo="anos"
          ajuda={soRendaPassiva
            ? 'Até aqui, aportes e rendimentos ficam investidos. Depois, você usa somente a renda distribuída.'
            : 'Até aqui você aporta; depois disso pode fazer retiradas do patrimônio.'}
          onChange={(v) => up('idadeParar', v)}
        />
        {modo === 'avancado' && <Campo rotulo="Planejar até" valor={p.idadeFinal} min={Math.max(60, p.idadeParar + 1)} max={105} sufixo="anos" onChange={(v) => up('idadeFinal', v)} />}
      </Secao>

      <Secao titulo="Renda e patrimônio de hoje" icone="renda">
        <Campo rotulo="Patrimônio investido hoje" valor={p.patrimonioInicial} min={0} max={1000000} passo={5000} prefixo="R$" maxDigitavel={1e9} onChange={(v) => up('patrimonioInicial', v)} />
        <Campo rotulo="Salário líquido mensal" valor={p.salarioMensal} min={1000} max={60000} passo={250} prefixo="R$" maxDigitavel={1e7} onChange={(v) => up('salarioMensal', v)} />
        {modo === 'avancado' && (
          <>
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
          </>
        )}
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
            {modo === 'avancado' && <Campo rotulo="Crescimento real do aporte" valor={p.aumentoRealAporte} min={0} max={8} passo={0.1} sufixo="% a.a." onChange={(v) => up('aumentoRealAporte', v)} />}
          </>
        )}
      </Secao>

      <Secao titulo="Reserva de emergência" icone="investimentos">
        <Interruptor
          rotulo="Separar a reserva do patrimônio investido"
          valor={p.reservaEmergencia.ativa}
          onChange={(v) => upReserva({ ativa: v })}
        />
        {p.reservaEmergencia.ativa && (
          <>
            <div className="estrategia-nota" role="note">
              <Icone nome="investimentos" />
              <p>
                Esta reserva fica protegida e fora dos investimentos de longo prazo. Ela recebe prioridade no aporte,
                acompanha apenas a inflação e não paga despesas planejadas, metas ou déficits após você parar.
              </p>
            </div>
            <Campo
              rotulo="Saldo da reserva hoje"
              valor={p.reservaEmergencia.saldoInicial}
              min={0}
              max={300000}
              passo={500}
              prefixo="R$"
              maxDigitavel={1e9}
              ajuda="Não repita este valor no patrimônio investido acima."
              onChange={(v) => upReserva({ saldoInicial: v })}
            />
            <Campo
              rotulo="Meta em meses de despesa"
              valor={p.reservaEmergencia.mesesDespesa}
              min={1}
              max={36}
              passo={1}
              sufixo="meses"
              ajuda="Usa a despesa mensal permanente informada no plano."
              onChange={(v) => upReserva({ mesesDespesa: v })}
            />
            <Campo
              rotulo="Completar por mês"
              valor={p.reservaEmergencia.aporteMensal}
              min={0}
              max={30000}
              passo={100}
              prefixo="R$"
              maxDigitavel={1e7}
              ajuda="Sai primeiro do aporte disponível. Ao completar a meta, o valor volta automaticamente aos investimentos."
              onChange={(v) => upReserva({ aporteMensal: v })}
            />
            <div className="reserva-status" aria-live="polite">
              <div>
                <span>Meta protegida</span>
                <strong>{fmtBRLCompacto(metaReserva)}</strong>
              </div>
              <div className="barra" role="progressbar" aria-label="Progresso da reserva de emergência" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressoReserva * 100)}>
                <span style={{ width: `${progressoReserva * 100}%` }} />
              </div>
              <p>{faltaReserva > 0 ? `Faltam ${fmtBRLCompacto(faltaReserva)} hoje.` : 'A meta já está completa hoje.'}</p>
            </div>
          </>
        )}
      </Secao>

      {modo === 'simples' ? (
        <div className="resumo-premissas-avancadas">
          <Icone nome="investimentos" />
          <p>
            O cálculo usa inflação de <strong>{p.inflacao.toLocaleString('pt-BR')}%</strong> e retorno Base líquido de{' '}
            <strong>{p.cenarios.base.rentAnual.toLocaleString('pt-BR')}% a.a.</strong>
            {p.fluxosPosParar.length > 0 && <> Também considera <strong>{p.fluxosPosParar.length} {p.fluxosPosParar.length === 1 ? 'fase temporária' : 'fases temporárias'}</strong> após parar.</>}{' '}
            Abra o modo avançado para alterar.
          </p>
        </div>
      ) : <Secao titulo="Investimentos e inflação" icone="investimentos">
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
      </Secao>}

      <Secao titulo="Liberdade financeira" icone="liberdade">
        <Segmentado
          rotulo="Estratégia depois de parar de trabalhar"
          valor={p.estrategiaPosParar}
          onChange={(v) => up('estrategiaPosParar', v)}
          opcoes={[
            { id: 'renda_passiva', nome: 'Só renda passiva' },
            { id: 'retirada', nome: 'Renda + retiradas' },
          ]}
        />
        <div className="estrategia-nota" role="note">
          <Icone nome={soRendaPassiva ? 'investimentos' : 'liberdade'} />
          <p>
            {soRendaPassiva
              ? 'Enquanto você trabalha, 100% dos rendimentos é reinvestido. Depois, dividendos e juros pagam as despesas; se faltar renda, o principal não é vendido.'
              : 'Depois de parar, os rendimentos e retiradas programadas do patrimônio podem pagar as despesas.'}
          </p>
        </div>
        <Campo rotulo="Despesa mensal desejada" valor={p.despesaMensal} min={1000} max={40000} passo={250} prefixo="R$" maxDigitavel={1e7} ajuda="Em R$ de hoje." onChange={(v) => up('despesaMensal', v)} />
        {soRendaPassiva ? (
          <Campo
            rotulo="Renda passiva líquida esperada"
            valor={p.taxaRendaPassiva}
            min={0.1}
            max={15}
            passo={0.1}
            sufixo="% a.a."
            ajuda="Parcela do retorno total paga como dividendos ou juros. Não é somada novamente à rentabilidade dos cenários."
            onChange={(v) => up('taxaRendaPassiva', v)}
          />
        ) : (
          <Campo
            rotulo="Taxa de retirada sustentável"
            valor={p.taxaRetirada}
            min={2}
            max={6}
            passo={0.1}
            sufixo="% a.a."
            ajuda="Pode combinar rendimentos com a venda gradual de ativos."
            onChange={(v) => up('taxaRetirada', v)}
          />
        )}
        {modo === 'avancado' && (
          <Campo rotulo="Outra renda após parar" valor={p.outraRendaPosParar} min={0} max={20000} passo={250} prefixo="R$" maxDigitavel={1e7} ajuda="INSS, aluguel, pensão… (R$ de hoje)." onChange={(v) => up('outraRendaPosParar', v)} />
        )}
        <p className="destaque-num">
          {soRendaPassiva ? 'Patrimônio para viver só da renda' : 'Número da liberdade'}:{' '}
          <strong>{fmtBRLCompacto(numeroLiberdade(p))}</strong> <span>(em R$ de hoje)</span>
        </p>
      </Secao>

      {modo === 'avancado' && (
        <Secao titulo="Fases após parar" icone="renda" aberta={false}>
          <div className="estrategia-nota" role="note">
            <Icone nome="renda" />
            <p>
              Adicione rendas ou despesas que existam apenas por alguns anos. As fases valem da idade inicial até a véspera da idade final, em R$ de hoje; fases simultâneas são somadas. Elas mudam a projeção, mas não reduzem o patrimônio-alvo permanente.
            </p>
          </div>
          {p.fluxosPosParar.length === 0 && (
            <p className="estado-vazio">Nenhuma fase temporária. O plano usa apenas a despesa e a outra renda permanentes.</p>
          )}
          <div aria-live="polite" className="sr-only">
            {p.fluxosPosParar.length} {p.fluxosPosParar.length === 1 ? 'fase configurada' : 'fases configuradas'}.
          </div>
          {p.fluxosPosParar.map((fluxo) => (
            <div key={fluxo.id} className={`fase-card fase-${fluxo.tipo}`}>
              <p className="fase-resumo">
                <strong>{fluxo.tipo === 'renda' ? 'Renda temporária' : 'Despesa temporária'}</strong>
                <span>dos {fluxo.idadeInicio} aos {fluxo.idadeFim} anos</span>
              </p>
              <CampoTexto rotulo="Nome da fase" valor={fluxo.nome} onChange={(v) => upFluxo(fluxo.id, { nome: v })} />
              <Segmentado
                rotulo={`Tipo da fase ${fluxo.nome}`}
                valor={fluxo.tipo}
                onChange={(v) => upFluxo(fluxo.id, { tipo: v })}
                opcoes={[
                  { id: 'renda', nome: 'Renda' },
                  { id: 'despesa', nome: 'Despesa' },
                ]}
              />
              <Campo
                rotulo="Valor mensal"
                valor={fluxo.valorMensal}
                min={0}
                max={30000}
                passo={250}
                prefixo="R$"
                maxDigitavel={1e7}
                ajuda="Valor de hoje; será corrigido pela inflação."
                onChange={(v) => upFluxo(fluxo.id, { valorMensal: v })}
              />
              <Campo
                rotulo="Começa aos"
                valor={fluxo.idadeInicio}
                min={p.idadeParar}
                max={p.idadeFinal - 1}
                sufixo="anos"
                onChange={(v) => upFluxo(fluxo.id, { idadeInicio: v })}
              />
              <Campo
                rotulo="Termina aos"
                valor={fluxo.idadeFim}
                min={fluxo.idadeInicio + 1}
                max={p.idadeFinal}
                sufixo="anos"
                ajuda="A fase deixa de valer a partir desta idade."
                onChange={(v) => upFluxo(fluxo.id, { idadeFim: v })}
              />
              <button
                type="button"
                className="link-perigo"
                onClick={() => set((x) => ({ ...x, fluxosPosParar: x.fluxosPosParar.filter((f) => f.id !== fluxo.id) }))}
              >
                Remover fase
              </button>
            </div>
          ))}
          {p.fluxosPosParar.length < 8 && (
            <button
              type="button"
              className="btn"
              onClick={() => set((x) => ({
                ...x,
                fluxosPosParar: [...x.fluxosPosParar, novoFluxoPosParar(x.idadeParar, x.idadeFinal)],
              }))}
            >
              + Adicionar fase de renda ou despesa
            </button>
          )}
        </Secao>
      )}

      <Secao titulo="Meta: o barco" icone="barco">
        <Interruptor rotulo="Incluir o barco na simulação" valor={p.barco.ativo} onChange={(v) => upBarco({ ativo: v })} />
        {p.barco.ativo && (
          <>
            {modo === 'avancado' && <CampoTexto rotulo="Nome" valor={p.barco.nome} onChange={(v) => upBarco({ nome: v })} />}
            <Campo rotulo="Valor (R$ de hoje)" valor={p.barco.valor} min={10000} max={1500000} passo={5000} prefixo="R$" maxDigitavel={1e8} onChange={(v) => upBarco({ valor: v })} />
            <Campo rotulo="Comprar aos" valor={p.barco.idade} min={p.idadeAtual + 1} max={p.idadeFinal - 1} sufixo="anos" onChange={(v) => upBarco({ idade: v })} />
            {modo === 'avancado' && (
              <>
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
