import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateMenuImages() {
  console.log('Iniciando navegador Chromium para renderizar imagens em alta resolução (1080x1920)...');
  
  // Usa o Google Chrome instalado na máquina do usuário
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 2 // Renderiza com 2x de densidade (qualidade Retina/Ultra HD)
  });

  const page = await context.newPage();

  // 1. Renderiza Cardápio de Lanches
  const lanchesUrl = 'file:///' + path.resolve(__dirname, 'template_lanches.html').replace(/\\/g, '/');
  console.log(`Carregando template de lanches: ${lanchesUrl}`);
  await page.goto(lanchesUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); // Garante fontes e imagens carregadas

  const lanchesOutputPath = path.resolve(__dirname, 'Cardapio_Lanches_NuuPrensado.png');
  await page.screenshot({
    path: lanchesOutputPath,
    clip: { x: 0, y: 0, width: 1080, height: 1920 }
  });
  console.log(`✓ Cardápio de Lanches gerado com sucesso em: ${lanchesOutputPath}`);

  // 2. Renderiza Cardápio de Bebidas
  const bebidasUrl = 'file:///' + path.resolve(__dirname, 'template_bebidas.html').replace(/\\/g, '/');
  console.log(`Carregando template de bebidas: ${bebidasUrl}`);
  await page.goto(bebidasUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const bebidasOutputPath = path.resolve(__dirname, 'Cardapio_Bebidas_NuuPrensado.png');
  await page.screenshot({
    path: bebidasOutputPath,
    clip: { x: 0, y: 0, width: 1080, height: 1920 }
  });
  console.log(`✓ Cardápio de Bebidas gerado com sucesso em: ${bebidasOutputPath}`);

  await browser.close();
  console.log('Concluído com sucesso!');
}

generateMenuImages().catch(err => {
  console.error('Erro ao gerar imagens:', err);
  process.exit(1);
});
