class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;

        // 游戏状态
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameLoop = null;

        // 蛇的初始状态
        this.snake = [
            {x: 10, y: 10}
        ];
        this.dx = 0;
        this.dy = 0;

        // 食物位置
        this.food = {x: 15, y: 15};

        // 分数
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;

        this.initializeGame();
        this.setupEventListeners();
        this.updateScoreDisplay();
    }

    initializeGame() {
        this.drawGame();
    }

    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;

            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
            }
        });

        // 移动端触摸控制
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.gameRunning || this.gamePaused) return;

                const direction = btn.dataset.direction;
                switch(direction) {
                    case 'up':
                        if (this.dy !== 1) {
                            this.dx = 0;
                            this.dy = -1;
                        }
                        break;
                    case 'down':
                        if (this.dy !== -1) {
                            this.dx = 0;
                            this.dy = 1;
                        }
                        break;
                    case 'left':
                        if (this.dx !== 1) {
                            this.dx = -1;
                            this.dy = 0;
                        }
                        break;
                    case 'right':
                        if (this.dx !== -1) {
                            this.dx = 1;
                            this.dy = 0;
                        }
                        break;
                }
            });
        });

        // 游戏控制按钮
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
    }

    startGame() {
        if (this.gameRunning) return;

        this.gameRunning = true;
        this.gamePaused = false;

        // 设置初始移动方向（向右）
        if (this.dx === 0 && this.dy === 0) {
            this.dx = 1;
            this.dy = 0;
        }

        this.gameLoop = setInterval(() => {
            this.update();
            this.drawGame();
        }, 150);

        document.getElementById('start-btn').textContent = '游戏进行中...';
        document.getElementById('start-btn').disabled = true;
    }

    togglePause() {
        if (!this.gameRunning) return;

        this.gamePaused = !this.gamePaused;

        if (this.gamePaused) {
            clearInterval(this.gameLoop);
            document.getElementById('pause-btn').textContent = '继续';
        } else {
            this.gameLoop = setInterval(() => {
                this.update();
                this.drawGame();
            }, 150);
            document.getElementById('pause-btn').textContent = '暂停';
        }
    }

    update() {
        if (this.gamePaused) return;

        // 如果蛇还没有移动方向，不进行更新
        if (this.dx === 0 && this.dy === 0) return;

        // 移动蛇头
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};

        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScoreDisplay();
            this.generateFood();
        } else {
            this.snake.pop();
        }
    }

    checkCollision(head) {
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }

        // 检查自身碰撞
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                return true;
            }
        }

        return false;
    }

    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }

    drawGame() {
        // 清空画布
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        this.drawGrid();

        // 绘制蛇
        this.drawSnake();

        // 绘制食物
        this.drawFood();

        // 如果游戏暂停，显示暂停信息
        if (this.gamePaused) {
            this.drawPauseScreen();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#2d3748';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头
                this.ctx.fillStyle = '#38a169';
            } else {
                // 蛇身
                this.ctx.fillStyle = '#48bb78';
            }

            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );

            // 添加圆角效果
            this.ctx.beginPath();
            this.ctx.roundRect(
                segment.x * this.gridSize + 2,
                segment.y * this.gridSize + 2,
                this.gridSize - 4,
                this.gridSize - 4,
                3
            );
            this.ctx.fill();
        });
    }

    drawFood() {
        this.ctx.fillStyle = '#e53e3e';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
    }

    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
    }

    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);

        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateScoreDisplay();
        }

        // 显示游戏结束界面
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
    }

    restartGame() {
        // 重置游戏状态
        this.gameRunning = false;
        this.gamePaused = false;
        clearInterval(this.gameLoop);

        // 重置蛇
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;

        // 重置分数
        this.score = 0;
        this.updateScoreDisplay();

        // 重新生成食物
        this.generateFood();

        // 隐藏游戏结束界面
        document.getElementById('game-over').classList.add('hidden');

        // 重置按钮状态
        document.getElementById('start-btn').textContent = '开始游戏';
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').textContent = '暂停';

        // 重绘游戏
        this.drawGame();
    }

    updateScoreDisplay() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
    }
}

// 添加圆角矩形支持（如果浏览器不支持）
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
