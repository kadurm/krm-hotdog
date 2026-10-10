# Visualização Imersiva do Cardápio - Nuu Prensado!!

Este documento registra a arquitetura, o comportamento e os parâmetros completos da **Visualização Imersiva** (Slider de Produtos) implementada no Nuu Prensado, permitindo que ela seja reativada no futuro a qualquer momento.

---

## 1. Motivação da Desativação Inicial

Para a inauguração e início de operação, optou-se por iniciar o cardápio **100% na Visualização em Grade**, ocultando temporariamente o modo imersivo e os botões de alternância. O objetivo é:
- Facilitar a adaptação e familiarização dos clientes com o cardápio em um formato clássico de delivery/e-commerce.
- Reduzir atritos de navegação nas primeiras semanas de vendas.
- Manter todo o código da experiência imersiva intacto e pronto para ser ativado com 1 linha de configuração.

---

## 2. Como Reativar a Visualização Imersiva

Toda a alternância agora é centralizada no arquivo:
📂 `src/config/viewConfig.js`

### Cenário A: Permitir que o cliente escolha entre Grade e Imersivo (botão visível)
No arquivo `src/config/viewConfig.js`:
```javascript
export const VIEW_CONFIG = {
  ENABLE_IMMERSIVE_VIEW: true,  // <-- Altere para true
  DEFAULT_VIEW_MODE: 'grid',     // Inicia em grade, mas cliente pode alternar para imersivo
  // ...
};
```

### Cenário B: Tornar a Visualização Imersiva o padrão da loja
No arquivo `src/config/viewConfig.js`:
```javascript
export const VIEW_CONFIG = {
  ENABLE_IMMERSIVE_VIEW: true,  // <-- Habilita
  DEFAULT_VIEW_MODE: 'slider',  // <-- Inicia direto no modo imersivo
  // ...
};
```

---

## 3. Especificações da Visualização Imersiva Atual

### Elementos da Tela Imersiva
1. **Contador e Indicador de Categoria (Canto inferior esquerdo)**:
   - Exibe o ícone e rótulo da categoria atual (ex: `🌭 PRENSADOS`).
   - Numeração padronizada no formato `001 / 006`.
2. **Dots de Navegação (Lateral esquerda)**:
   - Marcadores verticais indicando a posição do item na lista de produtos.
   - Permite clique direto para saltar para o item.
3. **Área Central (Imagem 4:3 e Floaties)**:
   - Contêiner de imagem em proporção mantida 4:3.
   - Badge flutuante no topo com o ícone e nome da categoria.
   - Emojis flutuantes animados com delays distintos (ex: `🌭`, `🧀`, `🥓`).
4. **Painel de Ação e Detalhes (Lateral direita)**:
   - Nome do produto e preço formatado.
   - Descrição detalhada dos ingredientes.
   - Controle de quantidade (`+` / `-`).
   - Botão de ação direta: "Pedir Agora" ou "Loja Fechada" (baseado no horário de funcionamento).
5. **Transição de Categoria e Toast**:
   - Ao rolar ou avançar para a próxima categoria, um toast animado surge no topo: *"Você entrou em: [Ícone] [Nome]"*.
   - Ao atingir o último item de uma categoria, um botão de transição rápida surge: *"A seguir: [Próxima Categoria] ⌄"*.
6. **Setas e Gestos**:
   - Setas circulares na lateral direita para avançar e retroceder.
   - Suporte completo a navegação pelas setas do teclado (`↑`, `↓`, `←`, `→`).
   - Suporte a swipe/arraste touch no celular.

### Identidade Visual e Categorias
- **Prensados**: Cor `#eab308` (Amarelo vibrante), Ícone `🌭`, Floaties `['🌭', '🧀', '🥓']`
- **Bebidas**: Cor `#06b6d4` (Ciano refrescante), Ícone `🥤`, Floaties `['🥤', '🧊', '🍋']`
- **Acompanhamentos**: Cor `#f97316` (Laranja marcante), Ícone `🍟`, Floaties `['🍟', '🧀', '🥓']`
- **Sobremesas**: Cor `#ec4899` (Rosa doce), Ícone `🍫`, Floaties `['🍫', '🍓', '✨']`

---

## 4. Arquivos Envolvidos
- `src/config/viewConfig.js`: Flags centrais de ativação (`ENABLE_IMMERSIVE_VIEW`, `DEFAULT_VIEW_MODE`).
- `src/App.jsx`: Estado do header e botão superior de alternância.
- `src/views/delivery/DeliveryView.jsx`: Renderização do slider imersivo e tela em grade.
- `src/index.css`: Estilização e keyframes de animação (`.immersive-slider`, `.float-element`, `.slider-info-panel`).
