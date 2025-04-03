# 🏰 Tower Defense Game

Um jogo de Tower Defense desenvolvido em JavaScript puro, onde você deve defender seu território construindo torres estratégicas para impedir que os inimigos cheguem ao final do caminho. 
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
- JavaScript Vanilla
- Canvas API

## 📁 Estrutura do Projeto

```
towers/
├── index.html      # Página principal do jogo
├── game.js         # Lógica principal do jogo
└── .gitignore      # Arquivos ignorados pelo Git
```

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

1. Clone o repositório
2. Abra o arquivo `index.html` em seu navegador
3. Clique em "Iniciar Jogo" para começar

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