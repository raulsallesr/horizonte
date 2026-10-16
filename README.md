# ⛵ Horizonte

**Simulador de liberdade financeira — e do seu barquinho.**
Descubra com que idade você poderia parar de trabalhar, quanto o seu dinheiro rende por mês e o que a compra de um barco (ou de qualquer sonho caro) faz com essa data.

Tudo roda **no seu navegador**: sem servidor, sem cadastro, sem enviar dado nenhum para lugar nenhum.

> Os valores que aparecem ao abrir são **fictícios** (a "Marina", 30 anos). Mude qualquer número no painel e tudo recalcula na hora.

## ▶️ Como usar (escolha um caminho)

### Caminho 1 — Só abrir o site (não instala nada)

👉 **https://raulsallesr.github.io/horizonte/**

Abra no navegador (computador ou celular), mude os números no painel e veja tudo recalcular na hora. É o jeito para quem só quer usar.

### Caminho 2 — Rodar no seu computador (para editar o código)

Só precisa disso se você quer **mexer no projeto**. Siga na ordem, **no Windows**:

**Passo 1 — Instalar o Node.js (uma vez só).** Baixe a versão **LTS** em https://nodejs.org, instale clicando em "Próximo" até o fim e **feche e abra de novo** o terminal.

**Passo 2 — Baixar o projeto.** Opção A, com Git:

```bash
git clone https://github.com/raulsallesr/horizonte.git
```

Opção B, sem Git: na página do repositório clique em **Code → Download ZIP** e extraia a pasta.

**Passo 3 — Abrir o terminal dentro da pasta do projeto.**

```bash
cd horizonte
```

**Passo 4 — Instalar as dependências (uma vez só, leva ~1 minuto).**

```bash
npm install
```

**Passo 5 — Ligar o projeto.**

```bash
npm run dev
```

O terminal mostra algo como `Local: http://localhost:5173/`. **Abra esse endereço no navegador.** Pronto: ao salvar qualquer arquivo, a página atualiza sozinha. Para desligar, volte ao terminal e aperte `Ctrl + C`.

**Outros comandos úteis:**

```bash
npm test
```

Roda os testes do motor de cálculo, diagnóstico, entradas e compartilhamento.

```bash
npm run lint
```

Verifica problemas estáticos no código.

```bash
npm run build
```

Gera o site pronto na pasta `dist/`.

```bash
npm run test:e2e:install
npm run test:e2e
npm run test:lighthouse
```

Instala o Chromium de teste uma vez, valida os fluxos em desktop/mobile e confere os orçamentos Lighthouse. Os relatórios ficam em `playwright-report/` e `artifacts/`.

> **Deu erro?** `npm não é reconhecido` = o Node não foi instalado ou o terminal não foi reaberto depois da instalação. `porta 5173 em uso` = já há outro Horizonte rodando; feche-o ou aperte `Ctrl + C` no terminal dele.

## O que ele faz

- **Três cenários lado a lado** (pessimista, base, otimista), cada um com a sua rentabilidade líquida.
- **Duas estratégias pós-trabalho**: viver somente da renda passiva, sem vender ativos para completar despesas, ou combinar renda com retiradas graduais do patrimônio.
- **Bola de neve explícita**: enquanto você trabalha, todos os rendimentos permanecem reinvestidos junto com os aportes.
- **Fases após parar**: programe renda ou despesa por idade para representar trabalho parcial, INSS começando depois, aluguel temporário ou custos maiores por alguns anos.
- **Número da liberdade**: quanto patrimônio precisa gerar a renda mensal desejada na estratégia escolhida — e a idade em que você chega lá.
- **Inflação e valor real**: veja tudo em *R$ de hoje* ou em valores nominais (futuros).
- **Quanto rende por mês (ou por ano)**: gráfico de aportes × rendimento, com o "ponto de virada" em que o dinheiro passa a trabalhar mais do que você.
- **Fases da vida**: aumento real de salário, 13º, aporte em % do salário ou valor fixo, idade de parar e fluxos temporários na fase pós-trabalho.
- **Metas**: o barco (à vista ou com caixinha separada, com custo de manutenção) e outras metas pontuais. Mostra **quanto o barco adia a sua liberdade** e avisa quando não há saldo para realizar uma compra.
- **Probabilidades (Monte Carlo)**: 5.000 futuros possíveis com a oscilação dos mercados → chance de ter a liberdade na idade desejada, de sustentar a estratégia escolhida e de cada meta ser realizada.
- **Link compartilhável**: as premissas ficam no endereço da página; copie e mande a simulação para alguém.
- **Modo simples ou avançado**: comece pelas decisões essenciais e abra as hipóteses técnicas quando precisar.
- **Diagnóstico do plano**: identifica liberdade fora do prazo, déficit de renda passiva, esgotamento por retiradas e metas sem recursos.
- **Ajustes calculados**: estima aporte mínimo, primeira idade viável, despesa sustentável e alternativas para metas — sempre com confirmação antes de mudar o plano.
- **Comparação local**: salve uma versão de referência no navegador e compare os principais indicadores antes e depois.
- **Instalável e offline**: depois do primeiro acesso, a PWA abre e mantém as simulações disponíveis mesmo sem conexão.
- Tabela ano a ano com exportação em CSV, tema claro/escuro e layout para celular.

## Como os números são calculados

Passo **mensal**; taxas anuais viram mensais por `(1 + a)^(1/12) − 1`.

1. Em cada mês, o saldo rende. Enquanto você trabalha, todo o retorno continua investido e o aporte entra depois; após parar, a estratégia escolhida define quanto pode sair.
2. Salário e aporte crescem com a inflação mais o aumento real informado.
3. A rentabilidade é **nominal e líquida** (já descontados IR e custos).
4. No modo **só renda passiva**, dividendos e juros são tratados como parte do retorno total, nunca somados novamente. Depois de parar, a despesa usa somente a renda distribuída; se ela não bastar, o déficit aparece e o principal não é vendido.
5. No modo **renda + retiradas**, a despesa líquida pode consumir gradualmente o patrimônio, como nas versões anteriores.
6. Depois de parar, fases temporárias de renda reduzem a necessidade do mês e fases de despesa a aumentam. Elas começam na idade inicial, deixam de valer na idade final e são somadas quando coincidem.
7. **Número da liberdade** = (despesa mensal − outra renda permanente) × 12 ÷ taxa da estratégia. Fluxos temporários entram na projeção e no diagnóstico, mas não reduzem esse alvo permanente. A idade da liberdade é o primeiro mês a partir do qual o patrimônio, em R$ de hoje, **permanece** acima desse número até o fim do horizonte — seguindo trabalhando e aportando para calcular essa data.
8. **Rendimento em R$ de hoje** desconta a inflação: é o ganho acima da manutenção do poder de compra.
9. Uma meta só é comprada se o patrimônio disponível cobrir o custo integral na idade planejada. Se faltar saldo, nenhuma dívida é criada: a meta é marcada como não realizada e o déficit fica visível.
10. **Monte Carlo**: retornos mensais normais com a média e a volatilidade do cenário Base, semente fixa (resultado reproduzível), rodando em um Web Worker cancelável. Metas sem saldo não são compradas e têm sua própria probabilidade de realização.
11. As buscas iterativas das recomendações também rodam em um Worker; a leitura essencial do plano permanece imediata.

O motor de cálculo fica em [`src/engine`](src/engine) (TypeScript puro, com testes em `engine.test.ts`).

## Documentação técnica

- [Contexto para continuidade entre sessões](CONTEXT.md)
- [Arquitetura e fluxo de dados](docs/ARQUITETURA.md)
- [Regras do modelo financeiro](docs/MODELO_FINANCEIRO.md)
- [Estratégia de testes e validação](docs/VALIDACAO.md)
- [Registro das melhorias de confiabilidade](docs/REGISTRO_MELHORIAS_2026-10-15.md)
- [Roadmap e situação das próximas etapas](docs/ROADMAP.md)
- [Governança, CI e processo de release](docs/GITHUB.md)
- [Como contribuir](CONTRIBUTING.md)

## Publicando no GitHub Pages

O repositório já traz o fluxo de publicação em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Crie um repositório público no GitHub e envie o código (`git push -u origin main`).
2. No repositório, abra **Settings → Pages** e em **Source** escolha **GitHub Actions**.
3. A cada `push` na `main`, o GitHub roda lint, testes unitários, E2E, Lighthouse e build antes de publicar em `https://<seu-usuario>.github.io/<nome-do-repo>/`.

## Aviso

Ferramenta **educacional e de simulação**. Não é recomendação de investimento, consultoria financeira nem promessa de resultado: as premissas são hipóteses e o futuro não segue o passado. Para decisões reais, procure um profissional habilitado.

## Licença

[MIT](LICENSE)
