import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function abrir(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Horizonte', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /O plano Base|O plano precisa|O plano está perto/ })).toBeVisible()
}

test('carrega o plano sem rolagem horizontal', async ({ page }) => {
  await abrir(page)
  const dimensoes = await page.evaluate(() => ({ largura: innerWidth, conteudo: document.documentElement.scrollWidth }))
  expect(dimensoes.conteudo).toBeLessThanOrEqual(dimensoes.largura)
})

test('alterna entre premissas simples e avançadas', async ({ page }) => {
  await abrir(page)
  await expect(page.getByText('Só as decisões principais.')).toBeVisible()
  await page.getByRole('button', { name: 'Avançado' }).click()
  await expect(page.getByText('Todas as hipóteses do modelo ficam disponíveis.')).toBeVisible()
  await expect(page.getByText('Planejar até', { exact: true })).toBeVisible()
})

test('distingue renda passiva sem venda da retirada do patrimônio', async ({ page }) => {
  await abrir(page)
  const rendaPassiva = page.getByRole('button', { name: 'Só renda passiva' })
  await expect(rendaPassiva).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Renda passiva líquida esperada', { exact: true })).toBeVisible()
  await expect(page.getByText(/100% dos rendimentos é reinvestido/)).toBeVisible()
  await expect(page.getByText(/o principal não é vendido/)).toBeVisible()

  await page.getByRole('button', { name: 'Renda + retiradas' }).click()
  await expect(page.getByRole('button', { name: 'Renda + retiradas' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Taxa de retirada sustentável', { exact: true })).toBeVisible()
  await expect(page.getByText(/venda gradual de ativos/)).toBeVisible()
})

test('configura uma fase temporária de renda ou despesa após parar', async ({ page }) => {
  await abrir(page)
  await page.getByRole('button', { name: 'Avançado' }).click()
  await page.getByText('Fases após parar', { exact: true }).click()
  await expect(page.getByText('Nenhuma fase temporária.')).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar fase de renda ou despesa' }).click()
  await expect(page.getByText('Renda temporária', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Renda', exact: true })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Despesa', exact: true }).click()
  await expect(page.getByText('Despesa temporária', { exact: true })).toBeVisible()
  const dimensoes = await page.evaluate(() => ({ largura: innerWidth, conteudo: document.documentElement.scrollWidth }))
  expect(dimensoes.conteudo).toBeLessThanOrEqual(dimensoes.largura)
})

test('recalcula diagnóstico e oferece ações para um plano inviável', async ({ page }) => {
  await abrir(page)
  const grupo = page.locator('.campo').filter({ has: page.getByText('Parar de trabalhar aos', { exact: true }) })
  const entrada = grupo.locator('input[type="text"]')
  await entrada.fill('35')
  await entrada.press('Enter')

  await expect(page.getByRole('heading', { name: 'O plano precisa de ajustes para durar' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ajustes calculados' })).toBeVisible()
  await expect(page.locator('.recomendacao')).not.toHaveCount(0)
})

test('salva e compara uma versão de referência', async ({ page }) => {
  await abrir(page)
  await page.getByText('Comparar versões do plano', { exact: true }).click()
  await page.getByRole('button', { name: 'Salvar plano como referência' }).click()

  await expect(page.getByRole('table', { name: 'Comparação com o plano de referência' })).toBeVisible()
  await expect(page.locator('.comparacao-linha')).toHaveCount(5)
})

test('carrega gráficos e tabela quando se aproximam da tela', async ({ page }) => {
  await abrir(page)
  await page.locator('.detalhes-sob-demanda').scrollIntoViewIfNeeded()
  await expect(page.getByRole('heading', { name: 'Seu patrimônio ao longo da vida' })).toBeVisible()
  await expect(page.getByText('Tabela ano a ano', { exact: true })).toBeVisible()
})

test('adapta a paisagem, texto ampliado e movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 812, height: 375 })
  await abrir(page)
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto')

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  const dimensoes = await page.evaluate(() => ({
    largura: document.documentElement.clientWidth,
    conteudo: document.documentElement.scrollWidth,
  }))
  expect(dimensoes.conteudo).toBeLessThanOrEqual(dimensoes.largura)
})

test('não apresenta violações WCAG A ou AA detectáveis', async ({ page }) => {
  await abrir(page)
  const analise = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(analise.violations).toEqual([])
})

test('continua funcional e informa quando fica offline', async ({ page, context }) => {
  await abrir(page)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()

  try {
    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await expect(page.getByText('Você está offline.')).toBeVisible()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Você está offline.')).toBeVisible()
    await expect(page.getByRole('heading', { name: /O plano Base|O plano precisa|O plano está perto/ })).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
