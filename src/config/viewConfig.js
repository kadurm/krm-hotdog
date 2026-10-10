/**
 * CONFIGURAÇÃO DE VISUALIZAÇÃO DO CARDÁPIO (DELIVERY) - NUU PRENSADO
 * 
 * Histórico e Objetivo:
 * A visualização imersiva é uma experiência inovadora tipo "feed/slider" com elementos flutuantes (floaties),
 * navegação por gestos/teclado, contadores por categoria e badges vibrantes.
 * 
 * Para a fase inicial da operação da loja, o cardápio está configurado para operar EXCLUSIVAMENTE
 * na VISUALIZAÇÃO EM GRADE (tradicional de e-commerce e delivery), facilitando a familiarização dos clientes.
 * 
 * Como reativar a visualização imersiva no futuro:
 * 1. Para permitir que o cliente escolha entre Grade e Imersivo:
 *    Mude `ENABLE_IMMERSIVE_VIEW: true`
 * 2. Para tornar a visualização Imersiva a padrão ao abrir o site:
 *    Mude `DEFAULT_VIEW_MODE: 'slider'`
 */

export const VIEW_CONFIG = {
  /**
   * Habilita ou desabilita o acesso à visualização imersiva (slider).
   * false = Oculta botões de alternância e força a exibição em grade.
   * true  = Exibe os botões de alternância e permite alternar entre slider e grid.
   */
  ENABLE_IMMERSIVE_VIEW: false,

  /**
   * Modo de visualização inicial ao carregar o cardápio:
   * 'grid'   = Grade de produtos organizada por categorias (padrão atual).
   * 'slider' = Slider imersivo com fotos grandes e elementos temáticos.
   */
  DEFAULT_VIEW_MODE: 'grid',

  /**
   * Metadados e parâmetros da experiência imersiva registrados para restauração futura:
   */
  IMMERSIVE_SETTINGS: {
    // Proporção de imagens dos produtos
    aspectRatio: '4:3',
    // Ícones e cores temáticas por categoria
    categories: {
      prensados: {
        label: 'Prensados Especiais',
        shortLabel: 'Prensados',
        accentColor: '#eab308',
        icon: '🌭',
        floaties: ['🌭', '🧀', '🥓']
      },
      bebidas: {
        label: 'Bebidas Geladas',
        shortLabel: 'Bebidas',
        accentColor: '#06b6d4',
        icon: '🥤',
        floaties: ['🥤', '🧊', '🍋']
      },
      acompanhamentos: {
        label: 'Porções & Acompanhamentos',
        shortLabel: 'Acompanhamentos',
        accentColor: '#f97316',
        icon: '🍟',
        floaties: ['🍟', '🧀', '🥓']
      },
      sobremesas: {
        label: 'Sobremesas',
        shortLabel: 'Sobremesas',
        accentColor: '#ec4899',
        icon: '🍫',
        floaties: ['🍫', '🍓', '✨']
      }
    },
    // Controles de navegação do slider
    controls: {
      enableKeyboardNav: true,  // Setas do teclado cima/baixo e esquerda/direita
      enableTouchSwipe: true,   // Gestos de arrastar na tela (touch mobile)
      enableNavDots: true,      // Indicadores circulares laterais
      enableNavArrows: true,    // Botões circulares de anterior/próximo
      enableCategoryToast: true // Notificação ao trocar de categoria
    }
  }
};
