// 方向枚举
const Direction = {
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

// 游戏状态枚举
const GameState = {
    READY: 'READY',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};

// 难度级别枚举
const Difficulty = {
    EASY: 0,    // 简单
    MEDIUM: 1,  // 中等
    HARD: 2     // 困难
};

// 设备检测
const Device = {
    isMobile: function() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }
};

// 游戏配置
const Config = {
    // 桌面版默认尺寸
    DESKTOP: {
        CANVAS_WIDTH: 600,
        CANVAS_HEIGHT: 400,
        GRID_SIZE: 20,
        GAME_SPEED: 150
    },
    // 移动版默认尺寸
    MOBILE: {
        // 移动版屏幕更小，网格也相应减小
        GRID_SIZE: 15,
        GAME_SPEED: 180
    },
    // 动态计算画布大小
    get CANVAS_WIDTH() {
        if (Device.isMobile()) {
            // 移动设备下，宽度自适应屏幕，但不超过最大值
            return Math.min(window.innerWidth - 20, 400);
        }
        return this.DESKTOP.CANVAS_WIDTH;
    },
    get CANVAS_HEIGHT() {
        if (Device.isMobile()) {
            // 移动设备下，高度自适应屏幕，以保持合适的比例
            return Math.min(window.innerHeight * 0.5, 350);
        }
        return this.DESKTOP.CANVAS_HEIGHT;
    },
    get GRID_SIZE() {
        return Device.isMobile() ? this.MOBILE.GRID_SIZE : this.DESKTOP.GRID_SIZE;
    },
    get GAME_SPEED() {
        return Device.isMobile() ? this.MOBILE.GAME_SPEED : this.DESKTOP.GAME_SPEED;
    },
    INITIAL_SNAKE_LENGTH: 3,
    COLORS: {
        PLAYER_SNAKE: '#4CAF50', // 玩家蛇颜色 - 绿色
        AI_SNAKE: '#2196F3',     // AI蛇颜色 - 蓝色
        FOOD: '#FFC107',         // 食物颜色 - 黄色
        BACKGROUND: '#FFFFFF',   // 背景颜色 - 白色
        GRID: '#CCCCCC'          // 网格颜色 - 灰色
    },
    // 默认难度为简单
    DIFFICULTY: Difficulty.EASY,
    // 不同难度的AI智能水平
    AI_INTELLIGENCE: {
        // 简单难度下的AI设置 - 极度降低难度
        [Difficulty.EASY]: {
            PATH_FINDING_CHANCE: 0.05,  // AI 几乎不使用寻路(进一步降低)
            RANDOM_MOVE_CHANCE: 0.85,   // 大幅提高随机移动概率(进一步提高)
            SIGHT_DISTANCE: 1,          // 视野范围极小(进一步降低)
            UPDATE_RATE: 6              // 决策更新频率极慢(进一步提高)
        },
        // 中等难度下的AI设置
        [Difficulty.MEDIUM]: {
            PATH_FINDING_CHANCE: 0.8,   // AI 有80%概率直接寻路
            RANDOM_MOVE_CHANCE: 0.1,    // 随机移动的概率
            SIGHT_DISTANCE: 10,         // AI能"看到"的距离
            UPDATE_RATE: 1              // 每次移动都决策
        },
        // 困难难度下的AI设置
        [Difficulty.HARD]: {
            PATH_FINDING_CHANCE: 1.0,   // AI 总是直接寻路
            RANDOM_MOVE_CHANCE: 0,      // 不随机移动
            SIGHT_DISTANCE: 20,         // AI能看很远
            UPDATE_RATE: 1              // 每次移动都决策
        }
    }
};

// 点类
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    // 检查是否碰到墙
    isOutOfBounds() {
        // 获取实际画布
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return true;
        
        // 使用实际画布的尺寸来计算边界
        const cols = Math.floor(canvas.width / Config.GRID_SIZE);
        const rows = Math.floor(canvas.height / Config.GRID_SIZE);
        
        return this.x < 0 || this.x >= cols || this.y < 0 || this.y >= rows;
    }
}

// 工具函数
const Utils = {
    // 获取随机整数
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 获取随机位置
    getRandomPosition() {
        // 获取实际画布
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            return new Point(0, 0); // 出错时返回默认位置
        }
        
        // 使用实际画布尺寸
        const cols = Math.floor(canvas.width / Config.GRID_SIZE);
        const rows = Math.floor(canvas.height / Config.GRID_SIZE);
        
        return new Point(
            Utils.getRandomInt(0, cols - 1),
            Utils.getRandomInt(0, rows - 1)
        );
    },

    // 计算两点之间的曼哈顿距离
    getManhattanDistance(p1, p2) {
        return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
    },

    // 检查点是否在数组中
    pointInArray(point, array) {
        return array.some(p => p.equals(point));
    },

    // 获取相反方向
    getOppositeDirection(direction) {
        switch (direction) {
            case Direction.UP: return Direction.DOWN;
            case Direction.DOWN: return Direction.UP;
            case Direction.LEFT: return Direction.RIGHT;
            case Direction.RIGHT: return Direction.LEFT;
        }
    },

    // 自适应画布大小
    resizeCanvas(canvas) {
        // 获取视口宽度和高度
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 基于设备类型设置画布尺寸
        if (Device.isMobile()) {
            // 移动设备尺寸计算
            const isLandscape = viewportWidth > viewportHeight;
            
            if (isLandscape) {
                // 横屏模式
                canvas.width = Math.min(viewportWidth * 0.6, Config.DESKTOP.CANVAS_WIDTH);
                canvas.height = Math.min(viewportHeight * 0.7, Config.DESKTOP.CANVAS_HEIGHT);
                Config.MOBILE.GRID_SIZE = 15; // 横屏使用较大网格
            } else {
                // 竖屏模式 - 确保边界合理
                canvas.width = viewportWidth; // 宽度占满屏幕宽度
                
                // 根据屏幕高度动态调整比例和网格大小
                let heightPercent;
                
                if (viewportHeight <= 480) {
                    // 极小屏幕设备
                    heightPercent = 0.20;
                    Config.MOBILE.GRID_SIZE = 8; // 非常小的网格
                } else if (viewportHeight <= 550) {
                    // 较小屏幕
                    heightPercent = 0.22;
                    Config.MOBILE.GRID_SIZE = 10;
                } else if (viewportHeight <= 600) {
                    // 小屏幕
                    heightPercent = 0.25;
                    Config.MOBILE.GRID_SIZE = 12;
                } else if (viewportHeight <= 700) {
                    heightPercent = 0.30;
                    Config.MOBILE.GRID_SIZE = 12;
                } else if (viewportHeight <= 800) {
                    heightPercent = 0.32;
                    Config.MOBILE.GRID_SIZE = 15;
                } else {
                    heightPercent = 0.35;
                    Config.MOBILE.GRID_SIZE = 15;
                }
                
                canvas.height = Math.floor(viewportHeight * heightPercent);
                
                // 设置最大高度限制
                const maxHeight = viewportHeight <= 480 ? 120 : 
                                  viewportHeight <= 550 ? 140 : 
                                  viewportHeight <= 600 ? 180 : 
                                  viewportHeight <= 700 ? 220 : 250;
                
                canvas.height = Math.min(canvas.height, maxHeight);
            }
        } else {
            // 桌面设备使用固定尺寸
            canvas.width = Config.DESKTOP.CANVAS_WIDTH;
            canvas.height = Config.DESKTOP.CANVAS_HEIGHT;
        }
        
        // 调整网格大小以适应新画布尺寸
        const gridSize = Device.isMobile() ? Config.MOBILE.GRID_SIZE : Config.DESKTOP.GRID_SIZE;
        
        // 确保画布的宽度和高度是网格大小的整数倍
        canvas.width = Math.floor(canvas.width / gridSize) * gridSize;
        canvas.height = Math.floor(canvas.height / gridSize) * gridSize;
        
        // 确认最小尺寸
        canvas.width = Math.max(canvas.width, gridSize * 8);
        canvas.height = Math.max(canvas.height, gridSize * 6);
        
        console.log(`Canvas resized to: ${canvas.width}x${canvas.height}, grid size: ${gridSize}, device height: ${viewportHeight}`);
    }
};

// 添加窗口大小改变的监听
window.addEventListener('resize', function() {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        Utils.resizeCanvas(canvas);
    }
});