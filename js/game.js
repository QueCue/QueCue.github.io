class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小
        this.resizeCanvas();
        
        this.gameState = GameState.READY;
        this.gameLoop = null;
        
        // 确保使用正确的默认难度
        console.log(`初始化游戏，默认难度设置为: ${Config.DIFFICULTY}`);
        
        this.initGame();
        this.setupEventListeners();
        
        // 设置UI中正确的默认难度选择器
        const difficultyOptions = document.querySelectorAll('.difficulty-option');
        difficultyOptions.forEach(option => {
            const optionDifficulty = parseInt(option.getAttribute('data-difficulty'));
            if (optionDifficulty === Config.DIFFICULTY) {
                // 移除所有active类
                difficultyOptions.forEach(opt => opt.classList.remove('active'));
                // 设置默认选中项
                option.classList.add('active');
            }
        });
        
        // 初始状态更新
        this.updateStatusDisplay();
        this.updateDifficultyDisplay();
    }

    resizeCanvas() {
        Utils.resizeCanvas(this.canvas);
        // 重绘当前状态
        if (this.playerSnake && this.aiSnake) {
            this.render();
        }
    }

    initGame() {
        const cols = Math.floor(this.canvas.width / Config.GRID_SIZE);
        const rows = Math.floor(this.canvas.height / Config.GRID_SIZE);

        // 确保有足够的空间生成蛇
        if (cols < 6 || rows < 6) {
            console.warn('画布太小，可能导致游戏异常');
        }
        
        // 限制在画布范围内
        const rightX = Math.min(Math.floor(cols * 3/4), cols - 2);
        const leftX = Math.max(Math.floor(cols / 4), 1);
        const midY = Math.floor(rows / 2);

        // 玩家蛇从右侧开始
        this.playerSnake = new PlayerSnake(new Point(rightX, midY));
        
        // AI蛇从左侧开始
        this.aiSnake = new AISnake(new Point(leftX, midY));
        
        this.food = new Food();
        
        // 确保食物不会生成在蛇身上
        this.respawnFoodIfNeeded();
    }

    respawnFoodIfNeeded() {
        while (
            Utils.pointInArray(this.food.position, this.playerSnake.body) || 
            Utils.pointInArray(this.food.position, this.aiSnake.body)
        ) {
            this.food.spawn();
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 设置难度选择事件
        const difficultyOptions = document.querySelectorAll('.difficulty-option');
        difficultyOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                // 移除所有选项的active类
                difficultyOptions.forEach(opt => opt.classList.remove('active'));
                // 为当前选中项添加active类
                e.target.classList.add('active');
                
                // 设置难度
                const difficulty = e.target.getAttribute('data-difficulty');
                Config.DIFFICULTY = parseInt(difficulty);
                console.log(`难度已设置为: ${difficulty}`);
                
                // 立即更新难度显示
                this.updateDifficultyDisplay();
                
                // 重置游戏以应用新的难度
                this.resetGame();
            });
        });
        
        // 设置开始按钮事件
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.gameState === GameState.READY || this.gameState === GameState.GAME_OVER) {
                    this.startGame();
                } else if (this.gameState === GameState.PLAYING) {
                    this.pauseGame();
                } else if (this.gameState === GameState.PAUSED) {
                    this.resumeGame();
                }
            });
        }
        
        // 设置重置按钮事件
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetGame();
            });
        }

        // 移动设备暂停/继续按钮
        const playPauseButton = document.getElementById('playPauseButton');
        if (playPauseButton) {
            // 使用更可靠的事件监听方式
            const handlePauseEvent = (e) => {
                // 阻止事件冒泡和默认行为
                e.stopPropagation();
                e.preventDefault();
                this.togglePause();
            };
            
            // 同时监听click和touchend事件以提高响应性
            playPauseButton.addEventListener('click', handlePauseEvent);
            playPauseButton.addEventListener('touchend', handlePauseEvent);
            
            // 防止触摸移动导致的滚动
            playPauseButton.addEventListener('touchmove', (e) => {
                e.preventDefault();
            });
        }
        
        // 设置移动端方向控制按钮
        const setupDirectionButton = (buttonId, direction) => {
            const button = document.getElementById(buttonId);
            if (button) {
                const handleDirectionEvent = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.playerSnake && this.gameState === GameState.PLAYING) {
                        this.playerSnake.setDirection(direction);
                        
                        // 添加按钮按下效果
                        button.classList.add('pressed');
                        setTimeout(() => {
                            button.classList.remove('pressed');
                        }, 150);
                    }
                };
                
                // 使用多种事件处理以提高响应性
                button.addEventListener('click', handleDirectionEvent);
                button.addEventListener('touchstart', handleDirectionEvent);
                button.addEventListener('mousedown', handleDirectionEvent);
                
                // 防止拖动和滚动
                button.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                });
            }
        };
        
        // 设置四个方向按钮
        setupDirectionButton('upButton', Direction.UP);
        setupDirectionButton('leftButton', Direction.LEFT);
        setupDirectionButton('rightButton', Direction.RIGHT);
        setupDirectionButton('downButton', Direction.DOWN);

        // 为画布添加触摸事件 - 允许通过滑动控制
        const canvas = document.getElementById('gameCanvas');
        if (canvas && Device.isMobile()) {
            let startX = 0;
            let startY = 0;
            let isSwipe = false;
            
            canvas.addEventListener('touchstart', (e) => {
                if (this.gameState === GameState.PLAYING) {
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                    isSwipe = true;
                }
            });
            
            canvas.addEventListener('touchmove', (e) => {
                if (!isSwipe || this.gameState !== GameState.PLAYING) return;
                
                e.preventDefault();
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                
                const diffX = currentX - startX;
                const diffY = currentY - startY;
                
                // 需要足够的移动距离才算滑动
                const swipeThreshold = 30;
                
                if (Math.abs(diffX) > swipeThreshold || Math.abs(diffY) > swipeThreshold) {
                    // 判断是水平还是垂直滑动
                    if (Math.abs(diffX) > Math.abs(diffY)) {
                        // 水平滑动
                        if (diffX > 0) {
                            this.playerSnake.setDirection(Direction.RIGHT);
                        } else {
                            this.playerSnake.setDirection(Direction.LEFT);
                        }
                    } else {
                        // 垂直滑动
                        if (diffY > 0) {
                            this.playerSnake.setDirection(Direction.DOWN);
                        } else {
                            this.playerSnake.setDirection(Direction.UP);
                        }
                    }
                    
                    // 重置起始位置，避免连续触发
                    startX = currentX;
                    startY = currentY;
                }
            });
            
            canvas.addEventListener('touchend', () => {
                isSwipe = false;
            });
            
            // 添加双击暂停/开始
            let lastTapTime = 0;
            canvas.addEventListener('touchend', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;
                
                if (tapLength < 300 && tapLength > 0) {
                    // 双击事件
                    e.preventDefault();
                    this.togglePause();
                }
                
                lastTapTime = currentTime;
            });
        }

        // 监听窗口大小和方向变化
        const handleResize = () => {
            // 记录当前游戏状态
            const currentState = this.gameState;
            
            // 如果游戏正在进行，暂停游戏以防止在调整大小时出现问题
            if (currentState === GameState.PLAYING) {
                this.pause();
            }
            
            // 调整画布大小
            this.resizeCanvas();
            
            // 重新初始化游戏，保持状态
            if (this.playerSnake && this.aiSnake) {
                this.respawnFoodIfNeeded();
                this.render();
            }
            
            // 如果游戏之前是在进行状态，恢复游戏
            if (currentState === GameState.PLAYING) {
                this.start();
            }
        };
        
        // 监听窗口调整大小事件
        window.addEventListener('resize', handleResize);
        
        // 监听屏幕方向变化
        window.addEventListener('orientationchange', () => {
            // 方向变化后需要少许延迟才能获取正确尺寸
            setTimeout(handleResize, 200);
        });

        // 适配移动设备的暂停行为 - 切换到其他应用或标签页时暂停游戏
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState === GameState.PLAYING) {
                this.pauseGame();
            }
        });
    }

    togglePause() {
        switch (this.gameState) {
            case GameState.READY:
                this.startGame();
                break;
            case GameState.PAUSED:
                this.resumeGame();
                break;
            case GameState.PLAYING:
                this.pauseGame();
                break;
            case GameState.GAME_OVER:
                this.resetGame();
                break;
        }

        this.updateStatusDisplay();
    }

    updateStatusDisplay() {
        const statusElement = document.getElementById('gameStatus');
        
        // 获取当前难度的中文表示
        let difficultyText = '';
        switch(Config.DIFFICULTY) {
            case Difficulty.EASY:
                difficultyText = '简单';
                break;
            case Difficulty.MEDIUM:
                difficultyText = '中等';
                break;
            case Difficulty.HARD:
                difficultyText = '困难';
                break;
        }
        
        // 更新Play/Pause按钮的文本和图标
        const playPauseButton = document.getElementById('playPauseButton');
        
        // 对于更紧凑的视图，使用更简短的状态文本
        const isCompactView = window.innerHeight < 700;
        
        switch (this.gameState) {
            case GameState.READY:
                // 简化指示文字
                if (isCompactView) {
                    statusElement.textContent = `点击开始`;
                } else {
                    statusElement.textContent = Device.isMobile() ? 
                        `点击开始按钮开始游戏` : `按空格键开始游戏`;
                }
                
                if (playPauseButton) {
                    playPauseButton.innerHTML = '<i class="fas fa-play"></i> 开始游戏';
                }
                break;
                
            case GameState.PLAYING:
                // 简化状态显示
                statusElement.textContent = isCompactView ? 
                    `游戏中` : `游戏进行中`;
                    
                if (playPauseButton) {
                    playPauseButton.innerHTML = '<i class="fas fa-pause"></i> 暂停';
                }
                break;
                
            case GameState.PAUSED:
                // 精简暂停提示
                statusElement.textContent = isCompactView ? 
                    `已暂停` : (Device.isMobile() ? `已暂停 - 点击继续` : `已暂停 - 按空格继续`);
                    
                if (playPauseButton) {
                    playPauseButton.innerHTML = '<i class="fas fa-play"></i> 继续';
                }
                break;
                
            case GameState.GAME_OVER:
                // 简化游戏结束提示
                statusElement.textContent = isCompactView ? 
                    `游戏结束!` : (Device.isMobile() ? `游戏结束! 点击重新开始` : `游戏结束! 按空格重新开始`);
                    
                if (playPauseButton) {
                    playPauseButton.innerHTML = '<i class="fas fa-redo"></i> 重新开始';
                }
                break;
        }
    }

    start() {
        if (this.gameLoop) return;
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.render();
        }, Config.GAME_SPEED);
    }

    pause() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    reset() {
        this.pause();
        this.initGame();
        this.gameState = GameState.READY;
        this.updateStatusDisplay();
        this.updateDifficultyDisplay();
        // 立即渲染新状态
        this.render();
    }

    update() {
        if (this.gameState !== GameState.PLAYING) return;

        // 更新AI蛇的移动方向
        this.aiSnake.decideNextMove(this.food, this.playerSnake);
        
        // 移动蛇
        this.playerSnake.move();
        this.aiSnake.move();
        
        // 检查碰撞
        if (this.playerSnake.checkCollision() || this.playerSnake.checkCollision(this.aiSnake)) {
            this.gameOver("You lost!");
            return;
        }
        
        if (this.aiSnake.checkCollision() || this.aiSnake.checkCollision(this.playerSnake)) {
            this.gameOver("You won!");
            return;
        }
        
        // 检查食物
        if (this.playerSnake.body[0].equals(this.food.position)) {
            this.playerSnake.grow();
            this.playerSnake.addScore();
            this.food.spawn();
            this.respawnFoodIfNeeded();
        }
        
        if (this.aiSnake.body[0].equals(this.food.position)) {
            this.aiSnake.grow();
            this.food.spawn();
            this.respawnFoodIfNeeded();
        }
    }

    gameOver(message) {
        this.gameState = GameState.GAME_OVER;
        const statusElement = document.getElementById('gameStatus');
        
        // 将消息翻译为中文
        let chineseMessage = '';
        if (message === "You won!") {
            chineseMessage = "你赢了！";
        } else if (message === "You lost!") {
            chineseMessage = "你输了！";
        } else {
            chineseMessage = message;
        }
        
        const difficultyText = Config.DIFFICULTY === Difficulty.EASY ? '简单' : 
                           (Config.DIFFICULTY === Difficulty.MEDIUM ? '中等' : '困难');
                           
        statusElement.textContent = `[${difficultyText}] ${chineseMessage} ${Device.isMobile() ? '点击重新开始' : '按空格重新开始'}`;
        this.pause();
    }

    render() {
        // 清空画布
        this.ctx.fillStyle = Config.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景图案
        this.drawBackground();
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制食物
        this.food.draw(this.ctx);
        
        // 绘制蛇
        this.drawSnake(this.playerSnake);
        this.drawSnake(this.aiSnake);
        
        // 更新方向控制按钮图标
        this.updateDirectionButtonsUI();
    }
    
    // 绘制游戏背景
    drawBackground() {
        // 绘制背景纹理
        this.ctx.save();
        
        // 设置透明度，创建淡雅的背景效果
        this.ctx.globalAlpha = 0.05;
        
        // 绘制点状图案
        const dotSize = 2;
        const spacing = 20;
        this.ctx.fillStyle = Config.COLORS.PLAYER_SNAKE;
        
        for (let x = 0; x < this.canvas.width; x += spacing) {
            for (let y = 0; y < this.canvas.height; y += spacing) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, dotSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.restore();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = Config.COLORS.GRID;
        this.ctx.lineWidth = 0.5;
        
        // 将线条绘制得更柔和
        this.ctx.globalAlpha = 0.15;
        
        // 垂直线
        for (let x = 0; x <= this.canvas.width; x += Config.GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y <= this.canvas.height; y += Config.GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // 重置透明度
        this.ctx.globalAlpha = 1.0;
    }

    drawSnake(snake) {
        const size = Config.GRID_SIZE;
        const radius = size / 4; // 圆角半径
        
        this.ctx.fillStyle = snake.color;
        
        // 遍历蛇的所有部分
        snake.body.forEach((point, index) => {
            // 计算位置
            const x = point.x * size;
            const y = point.y * size;
            
            // 如果是蛇头，画成圆形，其余部分画成圆角矩形
            if (index === 0) {
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2 - 1, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 画蛇眼睛
                this.ctx.fillStyle = '#FFF';
                
                // 根据方向确定眼睛位置
                let eyeOffsetX1, eyeOffsetY1, eyeOffsetX2, eyeOffsetY2;
                const eyeDistance = size / 3;
                
                switch (snake.direction) {
                    case Direction.UP:
                        eyeOffsetX1 = -eyeDistance/2;
                        eyeOffsetY1 = -eyeDistance/2;
                        eyeOffsetX2 = eyeDistance/2;
                        eyeOffsetY2 = -eyeDistance/2;
                        break;
                    case Direction.DOWN:
                        eyeOffsetX1 = -eyeDistance/2;
                        eyeOffsetY1 = eyeDistance/2;
                        eyeOffsetX2 = eyeDistance/2;
                        eyeOffsetY2 = eyeDistance/2;
                        break;
                    case Direction.LEFT:
                        eyeOffsetX1 = -eyeDistance/2;
                        eyeOffsetY1 = -eyeDistance/2;
                        eyeOffsetX2 = -eyeDistance/2;
                        eyeOffsetY2 = eyeDistance/2;
                        break;
                    case Direction.RIGHT:
                        eyeOffsetX1 = eyeDistance/2;
                        eyeOffsetY1 = -eyeDistance/2;
                        eyeOffsetX2 = eyeDistance/2;
                        eyeOffsetY2 = eyeDistance/2;
                        break;
                }
                
                // 画两个眼睛
                this.ctx.beginPath();
                this.ctx.arc(x + size/2 + eyeOffsetX1, y + size/2 + eyeOffsetY1, size/8, 0, Math.PI * 2);
                this.ctx.arc(x + size/2 + eyeOffsetX2, y + size/2 + eyeOffsetY2, size/8, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 重设填充颜色
                this.ctx.fillStyle = snake.color;
            } else {
                // 画身体部分为圆角方块
                this.ctx.beginPath();
                this.ctx.moveTo(x + radius, y);
                this.ctx.lineTo(x + size - radius, y);
                this.ctx.arc(x + size - radius, y + radius, radius, 3 * Math.PI / 2, 0);
                this.ctx.lineTo(x + size, y + size - radius);
                this.ctx.arc(x + size - radius, y + size - radius, radius, 0, Math.PI / 2);
                this.ctx.lineTo(x + radius, y + size);
                this.ctx.arc(x + radius, y + size - radius, radius, Math.PI / 2, Math.PI);
                this.ctx.lineTo(x, y + radius);
                this.ctx.arc(x + radius, y + radius, radius, Math.PI, 3 * Math.PI / 2);
                this.ctx.fill();
            }
        });
    }

    updateDifficultyDisplay() {
        // 获取或创建难度显示元素
        if (!this.difficultyDisplay) {
            // 将难度标签放在游戏信息区域里
            const gameInfo = document.querySelector('.game-info');
            this.difficultyDisplay = document.createElement('div');
            this.difficultyDisplay.id = 'difficultyDisplay';
            this.difficultyDisplay.classList.add('difficulty-display');
            gameInfo.appendChild(this.difficultyDisplay);
            
            // 应用样式
            this.difficultyDisplay.style.marginTop = '10px';
            this.difficultyDisplay.style.fontWeight = 'bold';
        }
        
        // 获取难度的文字描述
        let difficultyText = '';
        switch (Config.DIFFICULTY) {
            case Difficulty.EASY:
                difficultyText = '简单';
                this.difficultyDisplay.style.color = '#4CAF50'; // 绿色
                break;
            case Difficulty.MEDIUM:
                difficultyText = '中等';
                this.difficultyDisplay.style.color = '#FFC107'; // 黄色
                break;
            case Difficulty.HARD:
                difficultyText = '困难';
                this.difficultyDisplay.style.color = '#F44336'; // 红色
                break;
        }
        
        // 设置显示文本
        this.difficultyDisplay.textContent = `当前难度: ${difficultyText}`;
        console.log(`显示当前难度: ${difficultyText}`);
    }

    // 处理键盘事件
    handleKeyDown(event) {
        // 空格键暂停/恢复游戏
        if (event.code === 'Space') {
            this.togglePause();
        }
        
        // 方向键控制蛇的移动
        if (this.playerSnake && this.gameState === GameState.PLAYING) {
            switch (event.code) {
                case 'ArrowUp':
                    this.playerSnake.setDirection(Direction.UP);
                    break;
                case 'ArrowDown':
                    this.playerSnake.setDirection(Direction.DOWN);
                    break;
                case 'ArrowLeft':
                    this.playerSnake.setDirection(Direction.LEFT);
                    break;
                case 'ArrowRight':
                    this.playerSnake.setDirection(Direction.RIGHT);
                    break;
            }
        }
    }

    startGame() {
        this.gameState = GameState.PLAYING;
        this.start();
        this.updateStatusDisplay();
    }
    
    pauseGame() {
        this.gameState = GameState.PAUSED;
        this.pause();
        this.updateStatusDisplay();
    }
    
    resumeGame() {
        this.gameState = GameState.PLAYING;
        this.start();
        this.updateStatusDisplay();
    }
    
    resetGame() {
        this.reset();
        this.updateStatusDisplay();
    }

    // 更新方向控制按钮UI
    updateDirectionButtonsUI() {
        // 仅在移动设备上执行
        if (!Device.isMobile()) return;
        
        // 获取按钮元素
        const upButton = document.getElementById('upButton');
        const leftButton = document.getElementById('leftButton');
        const rightButton = document.getElementById('rightButton');
        const downButton = document.getElementById('downButton');
        
        // 为按钮添加或更新三角形图标
        if (upButton && !upButton.querySelector('svg')) {
            upButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 4L4 14H20L12 4Z"></path>
            </svg>`;
        }
        
        if (leftButton && !leftButton.querySelector('svg')) {
            leftButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12L14 4V20L4 12Z"></path>
            </svg>`;
        }
        
        if (rightButton && !rightButton.querySelector('svg')) {
            rightButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 12L10 4V20L20 12Z"></path>
            </svg>`;
        }
        
        if (downButton && !downButton.querySelector('svg')) {
            downButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20L4 10H20L12 20Z"></path>
            </svg>`;
        }
        
        // 高亮当前方向
        const buttons = [upButton, leftButton, rightButton, downButton];
        buttons.forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        if (this.playerSnake && this.gameState === GameState.PLAYING) {
            switch (this.playerSnake.direction) {
                case Direction.UP:
                    if (upButton) upButton.classList.add('active');
                    break;
                case Direction.LEFT:
                    if (leftButton) leftButton.classList.add('active');
                    break;
                case Direction.RIGHT:
                    if (rightButton) rightButton.classList.add('active');
                    break;
                case Direction.DOWN:
                    if (downButton) downButton.classList.add('active');
                    break;
            }
        }
    }
}

// 当页面加载完成后初始化游戏
window.onload = () => {
    new Game();
};