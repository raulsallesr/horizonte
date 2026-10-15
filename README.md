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

Roda os testes do motor de cálculo.

```bash
npm run build
```

Gera o site pronto na pasta `dist/`.

> **Deu erro?** `npm não é reconhecido` = o Node não foi instalado ou o terminal não foi reaberto depois da instalação. `porta 5173 em uso` = já há outro Horizonte rodando; feche-o ou aperte `Ctrl + C` no terminal dele.

## O que ele faz

- **Três cenários lado a lado** (pessimista, base, otimista), cada um com a sua rentabilidade líquida.
- **Número da liberdade**: quanto patrimônio sustenta a sua despesa mensal com uma taxa de retirada segura (padrão 4% ao ano) — e a idade em que você chega lá.
- **Inflação e valor real**: veja tudo em *R$ de hoje* ou em valores nominais (futuros).
- **Quanto rende por mês (ou por ano)**: gráfico de aportes × rendimento, com o "ponto de virada" em que o dinheiro passa a trabalhar mais do que você.
- **Fases da vida**: aumento real de salário, 13º, aporte em % do salário ou valor fixo, idade de parar de trabalhar e fase de saque.
- **Metas**: o barco (à vista ou com caixinha separada, com custo de manutenção) e outras metas pontuais. Mostra **quanto o barco adia a sua liberdade** em cada cenário.
- **Probabilidades (Monte Carlo)**: 5.000 futuros possíveis com a oscilação dos mercados → chance de ter a liberdade na idade que você quer e chance de o dinheiro durar até o fim.
- **Link compartilhável**: as premissas ficam no endereço da página; copie e mande a simulação para alguém.
- Tabela ano a ano com exportação em CSV, tema claro/escuro e layout para celular.

## Como os números são calculados

Passo **mensal**; taxas anuais viram mensais por `(1 + a)^(1/12) − 1`.

1. Em cada mês, o saldo rende; depois entram o aporte (enquanto você trabalha) ou a retirada (depois de parar) e as compras.
2. Salário e aporte crescem com a inflação mais o aumento real informado.
3. A rentabilidade é **nominal e líquida** (já descontados IR e custos).
4. **Número da liberdade** = (despesa mensal − outra renda) × 12 ÷ taxa de retirada. A idade da liberdade é quando o patrimônio, em R$ de hoje, cruza esse número — **seguindo trabalhando e aportando**, independentemente da idade em que você escolheu parar.
5. **Rendimento em R$ de hoje** desconta a inflação: é o ganho acima da manutenção do poder de compra.
6. **Monte Carlo**: retornos mensais normais com a média e a volatilidade do cenário Base, semente fixa (resultado reproduzível), rodando em um Web Worker.

O motor de cálculo fica em [`src/engine`](src/engine) (TypeScript puro, com testes em `engine.test.ts`).

## Publicando no GitHub Pages

O repositório já traz o fluxo de publicação em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Crie um repositório público no GitHub e envie o código (`git push -u origin main`).
2. No repositório, abra **Settings → Pages** e em **Source** escolha **GitHub Actions**.
3. A cada `push` na `main`, o GitHub roda os testes, gera o site e publica em `https://<seu-usuario>.github.io/<nome-do-repo>/`.

## Aviso

Ferramenta **educacional e de simulação**. Não é recomendação de investimento, consultoria financeira nem promessa de resultado: as premissas são hipóteses e o futuro não segue o passado. Para decisões reais, procure um profissional habilitado.

## Licença

[MIT](LICENSE)
