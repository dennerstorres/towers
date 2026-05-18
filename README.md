# 🏰 Tower Defense Game

[![Deploy static content to Pages](https://github.com/dennerstorres/towers/actions/workflows/deploy.yml/badge.svg)](https://github.com/dennerstorres/towers/actions/workflows/deploy.yml)

Um jogo de Tower Defense desenvolvido em JavaScript puro, onde você deve defender seu território construindo torres estratégicas para impedir que os inimigos cheguem ao final do caminho. 

### 🎮 [JOGAR AGORA](https://dennerstorres.github.io/towers/)
Uma tentativa de recriar um jogo em flash que era jogado no navegador mas foi perdido com o tempo.

## 🎮 Como Jogar

1. Clique no botão "Iniciar Jogo" para começar
2. Use o mouse para clicar no grid e construir torres
3. Cada torre custa $50
4. Impedir que os inimigos cheguem ao final do caminho
5. Cada inimigo que chega ao final reduz suas vidas
6. Sobreviva ao maior número de ondas possível!

## 🛠️ Funcionalidades

- Sistema de ondas progressivas
- Diferentes tipos de inimigos com velocidades variadas
- Sistema de economia (dinheiro)
- Interface visual com grid e caminho
- Barra de vida para inimigos
- Sistema de pontuação baseado em ondas sobrevividas

## 🎯 Mecânicas do Jogo

- **Torres**
  - Alcance fixo
  - Dano por tiro
  - Tempo de recarga entre tiros
  - Custo de $50 por torre

- **Inimigos**
  - Velocidade aumenta a cada 3 ondas
  - Barra de vida visível
  - Seguem um caminho pré-definido
  - Quantidade aumenta a cada onda

- **Ondas**
  - Número de inimigos aumenta progressivamente
  - Recompensa em dinheiro ao completar cada onda
  - Dificuldade aumenta com o tempo

## 🚀 Tecnologias Utilizadas

- **Cursor IA**
- HTML5
- CSS3
- JavaScript Vanilla (ES6+)
- Canvas API
- Módulos ES6

## 📁 Estrutura do Projeto

```
towers/
├── src/
│   ├── game/
│   │   ├── core/
│   │   │   ├── Game.js       # Classe principal do jogo
│   │   │   ├── Config.js     # Configurações do jogo
│   │   │   └── Utils.js      # Funções utilitárias
│   │   ├── entities/
│   │   │   ├── Tower.js      # Classe das torres
│   │   │   └── Enemy.js      # Classe dos inimigos
│   │   └── managers/
│   │       ├── WaveManager.js # Gerenciador de ondas
│   │       ├── TowerManager.js # Gerenciador de torres
│   │       └── EnemyManager.js # Gerenciador de inimigos
│   ├── ui/
│   │   ├── GameUI.js         # Interface do usuário
│   │   └── CanvasRenderer.js # Renderização do canvas
│   └── main.js               # Ponto de entrada
├── assets/                   # Recursos (imagens, sons, etc)
├── index.html               # Página principal
└── README.md                # Documentação
```

## 🏗️ Arquitetura

O projeto segue uma arquitetura modular e orientada a objetos, com as seguintes características:

- **Separação de Responsabilidades**: Cada classe tem uma responsabilidade única e bem definida
- **Modularidade**: Código organizado em módulos ES6 para melhor manutenção
- **Configuração Centralizada**: Todas as configurações do jogo em um único lugar
- **Gerenciadores Dedicados**: Classes específicas para gerenciar diferentes aspectos do jogo
- **Renderização Separada**: Lógica de renderização isolada da lógica do jogo

## 🎨 Interface

- Grid visual para posicionamento de torres
- Caminho visível para os inimigos
- Interface de usuário mostrando:
  - Dinheiro disponível
  - Número de vidas
  - Fase atual
  - Contagem de inimigos

## 🎯 Objetivo

O objetivo do jogo é sobreviver ao maior número de ondas possível, gerenciando seus recursos e posicionando torres estrategicamente para impedir que os inimigos cheguem ao final do caminho.

## 🎮 Controles

- **Mouse**: Clique para construir torres
- **Botão Iniciar**: Começa uma nova partida

## 📊 Sistema de Pontuação

- Cada onda completada aumenta sua pontuação
- O jogo termina quando suas vidas chegam a zero
- A pontuação final é baseada no número de ondas sobrevividas

## 🛠️ Como Executar

### Online
Acesse o jogo diretamente pelo seu navegador: [https://dennerstorres.github.io/towers/](https://dennerstorres.github.io/towers/)

### Localmente
1. Clone o repositório
2. Recomenda-se o uso de um servidor local (como a extensão Live Server do VS Code ou `python3 -m http.server`) devido ao uso de módulos ES6.
3. Abra o endereço do servidor no seu navegador.
4. Clique em "Iniciar Jogo" para começar.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📝 Licença

Este projeto está licenciado sob a [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/).

Você é livre para:
- Compartilhar — copiar e redistribuir o material em qualquer meio ou formato
- Adaptar — remixar, transformar e criar a partir do material

Sob os seguintes termos:
- Atribuição — Você deve dar o crédito apropriado, fornecer um link para a licença e indicar se foram feitas alterações
- Não Comercial — Você não pode usar o material para fins comerciais

Sem restrições adicionais — Você não pode aplicar termos legais ou medidas tecnológicas que restrinjam legalmente outros de fazerem qualquer coisa que a licença permita. 