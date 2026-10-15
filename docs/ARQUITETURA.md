# Arquitetura do Horizonte

## Objetivo

O Horizonte é uma aplicação web estática. Não possui backend, autenticação nem banco de dados. Todo cálculo e toda persistência acontecem no navegador.

## Fluxo principal

```text
Premissas do usuário
        │
        ├── normalização e saneamento
        │        └── localStorage + hash compartilhável
        │
        ├── projeção determinística mensal
        │        ├── KPIs
        │        ├── diagnóstico e alternativas calculadas
        │        ├── metas
        │        ├── gráficos
        │        └── tabela/CSV
        │
        └── Web Worker Monte Carlo
                 ├── probabilidades
                 ├── percentis
                 └── chance de realizar metas
```

## Módulos

- `src/engine`: regras financeiras puras, sem dependência de React ou DOM.
- `src/estado`: persistência, compartilhamento e ciclo de vida do Web Worker.
- `src/worker`: ponto de entrada isolado do Monte Carlo.
- `src/componentes`: formulários, KPIs, metas, gráficos e tabela.
- `src/App.tsx`: composição da aplicação e coordenação dos estados.

`src/engine/diagnostico.ts` deriva o diagnóstico e as alternativas do mesmo motor mensal usado pelos gráficos. A interface apenas apresenta essas respostas e aplica uma alteração quando a pessoa confirma o botão correspondente.

## Decisões de confiabilidade

### Dados externos

Hash de URL e `localStorage` nunca são aceitos diretamente. O estado passa por mesclagem com valores padrão, limites numéricos, ids únicos e regras de coerência entre idades. Nomes e ids dos cenários são canônicos. Atributos que não existem na interface de metas extras não podem ser ativados por um link.

Links novos usam um envelope versionado. Links antigos continuam compatíveis. Uma versão desconhecida ou um conteúdo inválido carrega o exemplo padrão e exibe um aviso; dados locais não substituem silenciosamente um link defeituoso.

### Cálculo pesado

O Monte Carlo roda em um Web Worker. Ao alterar uma premissa, o Worker anterior é encerrado antes de iniciar outro. Resultados antigos são removidos imediatamente e nunca são exibidos como se pertencessem às novas premissas.

### Carregamento

Os gráficos e a tabela são carregados por `React.lazy`. Isso mantém o núcleo interativo e os KPIs no pacote inicial e move o Recharts para um chunk separado.

## Privacidade

- Nenhuma premissa é enviada para servidor.
- O hash da URL não é enviado pelo navegador em requisições HTTP.
- Quem receber um link compartilhado verá as premissas codificadas nele.
- A versão de referência usada na comparação fica somente no `localStorage` e não entra no link compartilhado.
- Extensões do navegador, histórico local e capturas de tela continuam sendo responsabilidades do ambiente do usuário.

## Publicação

O workflow de GitHub Pages executa, nesta ordem:

1. instalação reproduzível com `npm ci`;
2. lint;
3. testes;
4. typecheck e build pelo script `npm run build`;
5. publicação do diretório `dist`.
