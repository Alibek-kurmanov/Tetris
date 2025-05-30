class Tetris {
    constructor() {
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gameInterval = null;

        this.pieces = {
            I: [
                [[1,1,1,1]],
                [[1],[1],[1],[1]]
            ],
            O: [
                [[1,1],[1,1]]
            ],
            T: [
                [[0,1,0],[1,1,1]],
                [[1,0],[1,1],[1,0]],
                [[1,1,1],[0,1,0]],
                [[0,1],[1,1],[0,1]]
            ],
            S: [
                [[0,1,1],[1,1,0]],
                [[1,0],[1,1],[0,1]]
            ],
            Z: [
                [[1,1,0],[0,1,1]],
                [[0,1],[1,1],[1,0]]
            ],
            J: [
                [[1,0,0],[1,1,1]],
                [[1,1],[1,0],[1,0]],
                [[1,1,1],[0,0,1]],
                [[0,1],[0,1],[1,1]]
            ],
            L: [
                [[0,0,1],[1,1,1]],
                [[1,0],[1,0],[1,1]],
                [[1,1,1],[1,0,0]],
                [[1,1],[0,1],[0,1]]
            ]
        };

        this.pieceTypes = Object.keys(this.pieces);
        this.initializeGrid();
        this.loadHighScore();
        this.setupEventListeners();
        this.generateNextPiece();
    }

    initializeGrid() {
        const gameGrid = document.getElementById('game-grid');
        gameGrid.innerHTML = '';
        
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                gameGrid.appendChild(cell);
            }
        }

        const nextGrid = document.getElementById('next-grid');
        nextGrid.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'next-cell';
            nextGrid.appendChild(cell);
        }
    }

    loadHighScore() {
        const saved = localStorage.getItem('tetris-high-score');
        const highScore = saved ? parseInt(saved) : 0;
        document.getElementById('high-score').textContent = highScore;
    }

    saveHighScore() {
        const currentHigh = parseInt(document.getElementById('high-score').textContent);
        if (this.score > currentHigh) {
            localStorage.setItem('tetris-high-score', this.score.toString());
            document.getElementById('high-score').textContent = this.score;
            return true;
        }
        return false;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                case ' ':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
            }
        });

        // Мобильные кнопки
        document.getElementById('left-btn').addEventListener('click', () => this.movePiece(-1, 0));
        document.getElementById('right-btn').addEventListener('click', () => this.movePiece(1, 0));
        document.getElementById('down-btn').addEventListener('click', () => this.movePiece(0, 1));
        document.getElementById('rotate-btn').addEventListener('click', () => this.rotatePiece());
        document.getElementById('drop-btn').addEventListener('click', () => this.dropPiece());

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
    }

    generatePiece() {
        const type = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        return {
            type: type,
            shape: this.pieces[type][0],
            rotation: 0,
            x: Math.floor((10 - this.pieces[type][0][0].length) / 2),
            y: 0
        };
    }

    generateNextPiece() {
        this.nextPiece = this.generatePiece();
        this.drawNextPiece();
    }

    drawNextPiece() {
        const nextCells = document.querySelectorAll('#next-grid .next-cell');
        nextCells.forEach(cell => {
            cell.className = 'next-cell';
        });

        if (this.nextPiece) {
            const shape = this.nextPiece.shape;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const index = row * 4 + col;
                        if (nextCells[index]) {
                            nextCells[index].classList.add(this.nextPiece.type);
                        }
                    }
                }
            }
        }
    }

    startGame() {
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = true;
        
        this.currentPiece = this.nextPiece;
        this.generateNextPiece();
        
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('pause-btn').style.display = 'block';
        
        this.updateDisplay();
        this.gameLoop();
    }

    pauseGame() {
        if (this.gameRunning) {
            this.gameRunning = false;
            clearInterval(this.gameInterval);
            document.getElementById('pause-btn').textContent = 'Продолжить';
        } else {
            this.gameRunning = true;
            this.gameLoop();
            document.getElementById('pause-btn').textContent = 'Пауза';
        }
    }

    gameLoop() {
        if (!this.gameRunning) return;
        
        this.gameInterval = setInterval(() => {
            if (!this.movePiece(0, 1)) {
                this.placePiece();
                this.clearLines();
                this.currentPiece = this.nextPiece;
                this.generateNextPiece();
                
                if (this.checkGameOver()) {
                    this.endGame();
                }
            }
            this.draw();
        }, Math.max(50, 500 - (this.level - 1) * 50));
    }

    movePiece(dx, dy) {
        if (!this.currentPiece) return false;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (this.canPlacePiece(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        return false;
    }

    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotations = this.pieces[this.currentPiece.type];
        const nextRotation = (this.currentPiece.rotation + 1) % rotations.length;
        const newShape = rotations[nextRotation];
        
        if (this.canPlacePiece(newShape, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = newShape;
            this.currentPiece.rotation = nextRotation;
        }
    }

    dropPiece() {
        if (!this.currentPiece) return;
        
        while (this.movePiece(0, 1)) {
            // Продолжаем двигать вниз пока можем
        }
    }

    canPlacePiece(shape, x, y) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= 10 || newY >= 20 || 
                        (newY >= 0 && this.grid[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placePiece() {
        if (!this.currentPiece) return;
        
        const shape = this.currentPiece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;
                    if (y >= 0) {
                        this.grid[y][x] = this.currentPiece.type;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let row = 19; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== 0)) {
                // Анимация исчезновения линии
                const cells = document.querySelectorAll(`[data-row="${row}"]`);
                cells.forEach(cell => cell.classList.add('line-complete'));
                
                setTimeout(() => {
                    this.grid.splice(row, 1);
                    this.grid.unshift(Array(10).fill(0));
                }, 200);
                
                linesCleared++;
                row++; // Проверяем ту же строку снова
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.updateDisplay();
        }
    }

    checkGameOver() {
        return !this.canPlacePiece(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y);
    }

    endGame() {
        this.gameRunning = false;
        clearInterval(this.gameInterval);
        
        const isNewRecord = this.saveHighScore();
        
        document.getElementById('final-score').textContent = `Ваш счёт: ${this.score}`;
        document.getElementById('high-score-message').textContent = 
            isNewRecord ? 'Новый рекорд! 🎉' : '';
        
        document.getElementById('game-over').style.display = 'flex';
        
        document.getElementById('start-btn').style.display = 'block';
        document.getElementById('pause-btn').style.display = 'none';
    }

    updateDisplay() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
    }

    draw() {
        // Очищаем поле
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell';
        });
        
        // Рисуем зафиксированные фигуры
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                if (this.grid[row][col]) {
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        cell.classList.add('filled', this.grid[row][col]);
                    }
                }
            }
        }
        
        // Рисуем текущую фигуру
        if (this.currentPiece) {
            const shape = this.currentPiece.shape;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = this.currentPiece.x + col;
                        const y = this.currentPiece.y + row;
                        if (y >= 0 && y < 20 && x >= 0 && x < 10) {
                            const cell = document.querySelector(`[data-row="${y}"][data-col="${x}"]`);
                            if (cell) {
                                cell.classList.add('filled', this.currentPiece.type);
                            }
                        }
                    }
                }
            }
        }
    }
}

let tetris;

function startNewGame() {
    document.getElementById('game-over').style.display = 'none';
    tetris = new Tetris();
    tetris.startGame();
}

// Инициализация игры
window.addEventListener('load', () => {
    tetris = new Tetris();
});

// Предотвращение скролла на мобильных устройствах
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });