import { Game } from './game/core/Game';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const startButton = document.getElementById('startButton');
    const startScreen = document.getElementById('startScreen');
    
    const game = new Game(canvas);
    
    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        canvas.style.display = 'block';
        game.start();
    });
}); 