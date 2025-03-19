class PlayerSnake extends Snake {
    constructor(initialPosition) {
        super(initialPosition, Direction.RIGHT, Config.COLORS.PLAYER_SNAKE);
        this.score = 0;
        this.setupControls();
    }

    setupControls() {
        // 键盘控制
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.setDirection(Direction.UP);
                    break;
                case 'ArrowDown':
                    this.setDirection(Direction.DOWN);
                    break;
                case 'ArrowLeft':
                    this.setDirection(Direction.LEFT);
                    break;
                case 'ArrowRight':
                    this.setDirection(Direction.RIGHT);
                    break;
            }
        });

        // 触摸控制 - 方向按钮
        const setupTouchControl = (buttonId, direction) => {
            const button = document.getElementById(buttonId);
            if (button) {
                // 处理按下事件
                const handlePress = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.setDirection(direction);
                };
                
                // 同时监听click和touchend事件
                button.addEventListener('click', handlePress);
                button.addEventListener('touchend', handlePress);
                
                // 防止触摸引起的滚动
                button.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                });
            }
        };

        // 设置移动方向控制
        setupTouchControl('upButton', Direction.UP);
        setupTouchControl('downButton', Direction.DOWN);
        setupTouchControl('leftButton', Direction.LEFT);
        setupTouchControl('rightButton', Direction.RIGHT);

        // 处理手势滑动
        if ('ontouchstart' in window) {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;

            document.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            });

            document.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
            });
        }
    }

    // 处理滑动手势
    handleSwipe(startX, startY, endX, endY) {
        const xDiff = endX - startX;
        const yDiff = endY - startY;

        // 只在滑动距离足够大时改变方向
        const minSwipeDistance = 30;
        
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            // 水平滑动
            if (Math.abs(xDiff) < minSwipeDistance) return;
            
            if (xDiff > 0) {
                this.setDirection(Direction.RIGHT);
            } else {
                this.setDirection(Direction.LEFT);
            }
        } else {
            // 垂直滑动
            if (Math.abs(yDiff) < minSwipeDistance) return;
            
            if (yDiff > 0) {
                this.setDirection(Direction.DOWN);
            } else {
                this.setDirection(Direction.UP);
            }
        }
    }

    addScore(points = 1) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    }
}