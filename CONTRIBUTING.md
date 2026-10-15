# Como contribuir

## Preparação

```bash
npm install
npm run dev
```

## Antes de abrir um pull request

```bash
npm run lint
npm test
npm run build
```

Atualize também:

- `docs/MODELO_FINANCEIRO.md` quando uma regra de cálculo mudar;
- `docs/ARQUITETURA.md` quando responsabilidades ou fluxo de dados mudarem;
- `docs/VALIDACAO.md` quando novos riscos ou casos de teste surgirem;
- `CHANGELOG.md` para toda mudança perceptível ao usuário.

## Regras do projeto

- Regras financeiras devem permanecer em `src/engine`, sem dependência da interface.
- Estado vindo de URL ou armazenamento deve passar por `sanear` e `normalizar`.
- Não apresente uma meta como realizada sem evidência de saldo suficiente.
- Não apresente resultado probabilístico antigo durante um recálculo.
- Toda correção do motor precisa de um teste de regressão.
- Controles novos precisam funcionar por teclado e ter alvo de toque adequado.
- Gráficos precisam de resumo textual ou alternativa tabular.
