class AISnake extends Snake {
    constructor(initialPosition) {
        super(initialPosition, Direction.LEFT, Config.COLORS.AI_SNAKE);
        this.pathToFood = [];
        this.moveCounter = 0;
        this.lastDecisionUpdate = 0;
        this.lastRandomTurn = 0; // 上次随机转向的时间
        this.wrongDirectionCounter = 0; // 用于在简单难度下跟踪错误方向的持续时间
        this.decisionCounter = 0;
    }

    decideNextMove(food, playerSnake) {
        // 增加决策计数器
        this.decisionCounter++;
        this.moveCounter++;
        
        // 获取当前难度的AI设置
        const aiSettings = Config.AI_INTELLIGENCE[Config.DIFFICULTY];
        
        let difficultyText = '';
        switch(Config.DIFFICULTY) {
            case Difficulty.EASY: difficultyText = '简单'; break;
            case Difficulty.MEDIUM: difficultyText = '中等'; break;
            case Difficulty.HARD: difficultyText = '困难'; break;
        }
        
        if (this.moveCounter % 10 === 0) {
            console.log(`🤖 AI (${difficultyText}难度) - 智能设置: `, aiSettings);
        }

        // 仅在指定的更新率下更新决策
        if (this.moveCounter - this.lastDecisionUpdate < aiSettings.UPDATE_RATE) {
            if (Config.DIFFICULTY === Difficulty.EASY && this.moveCounter % 15 === 0) {
                console.log(`⏱️ 简单AI: 由于更新率限制(${aiSettings.UPDATE_RATE})，保持当前方向`);
            }
            return this.direction; // 保持当前方向
        }
        this.lastDecisionUpdate = this.moveCounter;

        // 对于简单难度，增加极多随机性和明显错误的判断
        if (Config.DIFFICULTY === Difficulty.EASY) {
            console.log("--------------------------------");
            console.log(`🤖 简单AI第${this.decisionCounter}次决策 (蛇长度: ${this.body.length})`);
            // 随机挂起 - 30%概率连续3-5步不改变方向，无视任何危险
            if (this.moveCounter % 15 === 0 && Math.random() < 0.3) {
                console.log("😴 简单AI: 随机挂起，持续不变方向5步");
                return this.direction;
            }
            
            // 50%概率完全随机移动，无视食物
            if (Math.random() < 0.5) {
                console.log("🎲 简单AI: 完全随机移动");
                this.direction = this.moveRandomly();
                return this.direction;
            }
            
            // 60%概率反向行动(故意远离食物)
            if (Math.random() < 0.6) {
                console.log("↩️ 简单AI: 故意远离食物");
                this.direction = this.moveAwayFromFood(food);
                return this.direction;
            }
            
            // 70%概率做出危险移动，可能导致死亡
            if (Math.random() < 0.7) {
                const unsafeMove = this.makeUnsafeMove(food, playerSnake);
                if (unsafeMove) {
                    console.log("⚠️ 简单AI: 做出危险移动");
                    this.direction = unsafeMove;
                    return this.direction;
                }
            }
            
            // 每7步强制进行随机转向
            if (this.decisionCounter % 7 === 0) {
                console.log("🔄 简单AI: 强制随机转向");
                this.direction = this.makeRandomTurn();
                return this.direction;
            }
            
            // 在接近食物时(距离<3)，有80%的概率故意走反方向
            const head = this.body[0];
            const foodPos = food.position;
            const distanceToFood = Math.abs(head.x - foodPos.x) + Math.abs(head.y - foodPos.y);
            if (distanceToFood < 3 && Math.random() < 0.8) {
                console.log("🚫 简单AI: 非常接近食物，故意走开");
                this.direction = this.moveAwayFromFood(food);
                return this.direction;
            }
            
            // 故意在错误的方向上持续移动 - 朝着死亡方向前进
            if (Math.random() < 0.4) {
                const suicideMove = this.makeSuicideMove();
                if (suicideMove) {
                    console.log("💀 简单AI: 故意朝死亡方向移动");
                    this.direction = suicideMove;
                    return this.direction;
                }
            }
            
            // 95%概率使用简单移动，而不是寻路
            if (Math.random() > aiSettings.PATH_FINDING_CHANCE) {
                console.log("👣 简单AI: 使用简单移动方法");
                this.direction = this.moveTowardsFoodSimple(food);
                return this.direction;
            }
            
            // 即使用寻路，也有80%概率只看一步以内
            let sightDistance = aiSettings.SIGHT_DISTANCE;
            if (Math.random() < 0.8) {
                sightDistance = 1;
                console.log("👁️ 简单AI: 视野极度受限，只能看到1步远");
            }
            
            // 尝试寻找到食物的路径
            const path = this.findPathToFood(food.position, playerSnake, sightDistance);
            
            // 即使找到路径也有70%概率不遵循
            if (path.length > 0 && Math.random() > 0.7) {
                const nextPos = path[0];
                const head = this.body[0];
                const dir = this.getDirectionToTarget(head, nextPos);
                
                // 即使选择了正确路径也有40%概率随机改变方向
                if (Math.random() < 0.4) {
                    console.log("🔀 简单AI: 找到路径但随机改变方向");
                    this.direction = this.moveRandomly();
                    return this.direction;
                }
                
                this.direction = dir;
                return this.direction;
            } else {
                // 如果没有找到路径或者选择不遵循路径
                console.log("❌ 简单AI: 没找到路径或选择不遵循");
                this.direction = this.moveTowardsFoodSimple(food);
                return this.direction;
            }
        }
        
        // 中等难度，增加大量随机性和故意错误的判断
        else if (Config.DIFFICULTY === Difficulty.MEDIUM) {
            // 有10%的概率随机移动
            if (Math.random() < aiSettings.RANDOM_MOVE_CHANCE) {
                this.direction = this.moveRandomly();
                return this.direction;
            }
            
            // 80%的概率使用寻路
            if (Math.random() < aiSettings.PATH_FINDING_CHANCE) {
                const path = this.findPathToFood(food.position, playerSnake, aiSettings.SIGHT_DISTANCE);
                if (path.length > 0) {
                    const nextPos = path[0];
                    const head = this.body[0];
                    this.direction = this.getDirectionToTarget(head, nextPos);
                    return this.direction;
                }
            }
            
            // 如果没有找到路径，使用简单方法移动
            this.direction = this.moveTowardsFoodSimple(food);
            return this.direction;
        }
        
        // 困难模式的AI - 使用最佳策略
        else if (Config.DIFFICULTY === Difficulty.HARD) {
            // 始终尝试使用寻路
            const path = this.findPathToFood(food.position, playerSnake, aiSettings.SIGHT_DISTANCE);
            if (path.length > 0) {
                const nextPos = path[0];
                const head = this.body[0];
                this.direction = this.getDirectionToTarget(head, nextPos);
                return this.direction;
            }
            
            // 如果无法找到路径，使用简单方法朝食物移动
            this.direction = this.moveTowardsFoodSimple(food);
            return this.direction;
        }
        
        // 默认行为 - 使用简单方法移动向食物
        this.direction = this.moveTowardsFoodSimple(food);
        return this.direction;
    }
    
    // 随机转向方法
    makeRandomTurn() {
        // 可能的方向，除了当前方向的反方向
        const possibleDirections = [];
        
        if (this.direction !== Direction.DOWN) possibleDirections.push(Direction.UP);
        if (this.direction !== Direction.UP) possibleDirections.push(Direction.DOWN);
        if (this.direction !== Direction.RIGHT) possibleDirections.push(Direction.LEFT);
        if (this.direction !== Direction.LEFT) possibleDirections.push(Direction.RIGHT);
        
        // 随机选择一个新方向
        const randomIndex = Math.floor(Math.random() * possibleDirections.length);
        const newDirection = possibleDirections[randomIndex];
        
        console.log(`AI做出随机转向: 从 ${this.direction} 到 ${newDirection}`);
        
        // 记录最后一次随机转向的时间
        this.lastRandomTurn = this.moveCounter;
        
        return newDirection;
    }
    
    // 随机移动方法
    moveRandomly() {
        // 可能的方向，除了会导致碰撞的方向
        const possibleDirections = [];
        const head = this.body[0];
        
        // 检查上方
        if (this.direction !== Direction.DOWN && head.y > 0) { 
            possibleDirections.push(Direction.UP);
        }
        
        // 检查下方
        if (this.direction !== Direction.UP && head.y < Config.GRID_SIZE - 1) {
            possibleDirections.push(Direction.DOWN);
        }
        
        // 检查左方
        if (this.direction !== Direction.RIGHT && head.x > 0) {
            possibleDirections.push(Direction.LEFT);
        }
        
        // 检查右方
        if (this.direction !== Direction.LEFT && head.x < Config.GRID_SIZE - 1) {
            possibleDirections.push(Direction.RIGHT);
        }
        
        // 如果没有安全方向，直接返回当前方向
        if (possibleDirections.length === 0) {
            return this.direction;
        }
        
        // 随机选择一个可行方向
        const randomIndex = Math.floor(Math.random() * possibleDirections.length);
        return possibleDirections[randomIndex];
    }
    
    // 远离食物移动方法 - 简单难度专用
    moveAwayFromFood(food) {
        const head = this.body[0];
        const foodPos = food.position;
        
        // 计算食物相对于蛇头的方向
        let xDir = 0;
        let yDir = 0;
        
        if (foodPos.x > head.x) xDir = 1;  // 食物在右边
        else if (foodPos.x < head.x) xDir = -1;  // 食物在左边
        
        if (foodPos.y > head.y) yDir = 1;  // 食物在下边
        else if (foodPos.y < head.y) yDir = -1;  // 食物在上边
        
        // 计算与食物相反的方向
        let awayDirection;
        
        // 优先选择x或y方向的远离
        if (Math.abs(foodPos.x - head.x) > Math.abs(foodPos.y - head.y)) {
            // x方向差距大，优先水平远离
            if (xDir === 1) awayDirection = Direction.LEFT;  // 食物在右边，向左移动
            else if (xDir === -1) awayDirection = Direction.RIGHT;  // 食物在左边，向右移动
            else {
                // 如果x方向没有差距，选择y方向
                if (yDir === 1) awayDirection = Direction.UP;  // 食物在下边，向上移动
                else if (yDir === -1) awayDirection = Direction.DOWN;  // 食物在上边，向下移动
                else awayDirection = this.direction;  // 保持当前方向
            }
        } else {
            // y方向差距大或相等，优先垂直远离
            if (yDir === 1) awayDirection = Direction.UP;  // 食物在下边，向上移动
            else if (yDir === -1) awayDirection = Direction.DOWN;  // 食物在上边，向下移动
            else {
                // 如果y方向没有差距，选择x方向
                if (xDir === 1) awayDirection = Direction.LEFT;  // 食物在右边，向左移动
                else if (xDir === -1) awayDirection = Direction.RIGHT;  // 食物在左边，向右移动
                else awayDirection = this.direction;  // 保持当前方向
            }
        }
        
        // 检查选择的方向是否安全（不会碰墙或咬到自己）
        const nextPos = this.getNextPosition(head, awayDirection);
        
        // 检查是否会撞墙
        if (nextPos.x < 0 || nextPos.x >= Config.GRID_SIZE || 
            nextPos.y < 0 || nextPos.y >= Config.GRID_SIZE) {
            // 如果不安全，使用随机移动
            return this.moveRandomly();
        }
        
        // 检查是否会咬到自己
        for (let i = 1; i < this.body.length; i++) {
            if (nextPos.x === this.body[i].x && nextPos.y === this.body[i].y) {
                // 如果不安全，使用随机移动
                return this.moveRandomly();
            }
        }
        
        return awayDirection;
    }

    // 简单地朝着食物移动的方法
    moveTowardsFoodSimple(food) {
        const head = this.body[0];
        const foodPos = food.position;
        
        // 计算食物相对于蛇头的方向
        const dx = foodPos.x - head.x;
        const dy = foodPos.y - head.y;
        
        // 决定移动的优先方向
        let newDirection = this.direction;  // 默认保持当前方向
        
        // 在简单难度下，增加随机性，有时候选择次优的移动方向
        const chooseBestDirection = Math.random() > 0.3 || Config.DIFFICULTY !== Difficulty.EASY;
        
        if (chooseBestDirection) {
            // 优先选择距离更大的方向
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平方向优先
                if (dx > 0 && this.direction !== Direction.LEFT) {
                    newDirection = Direction.RIGHT;
                } else if (dx < 0 && this.direction !== Direction.RIGHT) {
                    newDirection = Direction.LEFT;
                } else if (dy > 0 && this.direction !== Direction.UP) {
                    newDirection = Direction.DOWN;
                } else if (dy < 0 && this.direction !== Direction.DOWN) {
                    newDirection = Direction.UP;
                }
            } else {
                // 垂直方向优先或距离相等
                if (dy > 0 && this.direction !== Direction.UP) {
                    newDirection = Direction.DOWN;
                } else if (dy < 0 && this.direction !== Direction.DOWN) {
                    newDirection = Direction.UP;
                } else if (dx > 0 && this.direction !== Direction.LEFT) {
                    newDirection = Direction.RIGHT;
                } else if (dx < 0 && this.direction !== Direction.RIGHT) {
                    newDirection = Direction.LEFT;
                }
            }
        } else {
            // 选择次优的移动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                // 垂直方向次优
                if (dy > 0 && this.direction !== Direction.UP) {
                    newDirection = Direction.DOWN;
                } else if (dy < 0 && this.direction !== Direction.DOWN) {
                    newDirection = Direction.UP;
                } else if (dx > 0 && this.direction !== Direction.LEFT) {
                    newDirection = Direction.RIGHT;
                } else if (dx < 0 && this.direction !== Direction.RIGHT) {
                    newDirection = Direction.LEFT;
                }
            } else {
                // 水平方向次优
                if (dx > 0 && this.direction !== Direction.LEFT) {
                    newDirection = Direction.RIGHT;
                } else if (dx < 0 && this.direction !== Direction.RIGHT) {
                    newDirection = Direction.LEFT;
                } else if (dy > 0 && this.direction !== Direction.UP) {
                    newDirection = Direction.DOWN;
                } else if (dy < 0 && this.direction !== Direction.DOWN) {
                    newDirection = Direction.UP;
                }
            }
        }
        
        // 检查所选方向是否安全，如果不安全则选择随机方向
        const nextPos = this.getNextPosition(head, newDirection);
        if (this.isCollision(nextPos) && Config.DIFFICULTY !== Difficulty.EASY) {
            // 对于中等难度和困难难度，避免碰撞
            return this.moveRandomly();
        }
        
        return newDirection;
    }

    findPathToFood(foodPosition, playerSnake, maxDistance) {
        // 获取实际画布尺寸
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return [];
        
        const cols = Math.floor(canvas.width / Config.GRID_SIZE);
        const rows = Math.floor(canvas.height / Config.GRID_SIZE);
        
        const start = this.body[0];
        const goal = foodPosition;

        // 如果食物距离太远，不进行寻路
        if (Utils.getManhattanDistance(start, goal) > maxDistance) {
            return [];
        }
        
        // 简单难度下，有可能会提前结束寻路
        if (Config.DIFFICULTY === Difficulty.EASY) {
            // 60%的概率不进行路径规划(提高)
            if (Math.random() < 0.6) {
                // 返回一个不完整的路径，这会导致AI使用简单方法
                return [start];
            }
            
            // 如果食物是在对角线方向，有50%的概率不路径规划(新增)
            const dx = Math.abs(goal.x - start.x);
            const dy = Math.abs(goal.y - start.y);
            if (dx > 0 && dy > 0 && Math.random() < 0.5) {
                return [start];
            }
        }

        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        gScore.set(start.x + ',' + start.y, 0);
        fScore.set(start.x + ',' + start.y, Utils.getManhattanDistance(start, goal));

        while (openSet.length > 0) {
            let current = openSet[0];
            let lowestFScore = fScore.get(current.x + ',' + current.y);

            for (let i = 1; i < openSet.length; i++) {
                const fScoreI = fScore.get(openSet[i].x + ',' + openSet[i].y);
                if (fScoreI < lowestFScore) {
                    current = openSet[i];
                    lowestFScore = fScoreI;
                }
            }

            if (current.equals(goal)) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.splice(openSet.indexOf(current), 1);

            const neighbors = [
                new Point(current.x, current.y - 1),
                new Point(current.x, current.y + 1),
                new Point(current.x - 1, current.y),
                new Point(current.x + 1, current.y)
            ].filter(p => p.x >= 0 && p.x < cols && p.y >= 0 && p.y < rows);

            for (const neighbor of neighbors) {
                // 检查是否与蛇身体或玩家蛇碰撞
                if (Utils.pointInArray(neighbor, this.body.slice(1)) || 
                    Utils.pointInArray(neighbor, playerSnake.body)) {
                    continue;
                }

                const tentativeGScore = gScore.get(current.x + ',' + current.y) + 1;

                if (!gScore.has(neighbor.x + ',' + neighbor.y) || 
                    tentativeGScore < gScore.get(neighbor.x + ',' + neighbor.y)) {
                    cameFrom.set(neighbor.x + ',' + neighbor.y, current);
                    gScore.set(neighbor.x + ',' + neighbor.y, tentativeGScore);
                    fScore.set(neighbor.x + ',' + neighbor.y, tentativeGScore + 
                               Utils.getManhattanDistance(neighbor, goal));

                    if (!openSet.some(p => p.equals(neighbor))) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        // 没有找到路径
        return [];
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(current.x + ',' + current.y)) {
            current = cameFrom.get(current.x + ',' + current.y);
            path.unshift(current);
        }
        
        // 简单难度下，有可能会随机截断路径
        if (Config.DIFFICULTY === Difficulty.EASY) {
            // 在路径长度超过3格时，有50%的概率会截断路径(提高)
            if (path.length > 3 && Math.random() < 0.5) {
                // 只返回路径的一小部分，这会导致AI行为看起来更加不智能
                const truncateAt = Math.max(1, Math.floor(path.length / 3)); // 只保留三分之一的路径(减少)
                return path.slice(0, truncateAt);
            }
            
            // 有10%的概率只返回起点，完全放弃寻路(新增)
            if (Math.random() < 0.1) {
                return [path[0]];
            }
        }
        
        return path;
    }

    // 跟随玩家的方法 - 简单难度专用
    followPlayer(playerSnake) {
        // 如果玩家蛇为空或太短，则随机移动
        if (!playerSnake || playerSnake.body.length === 0) {
            this.moveRandomly();
            return;
        }
        
        const head = this.body[0];
        const playerHead = playerSnake.body[0];
        
        // 计算玩家头部相对于AI蛇头的方向
        const dx = playerHead.x - head.x;
        const dy = playerHead.y - head.y;
        
        // 玩家距离太远时，随机移动
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            this.moveRandomly();
            return;
        }
        
        // 随机选择是否跟随玩家
        // 有30%的概率往远离玩家的方向走
        if (Math.random() < 0.3) {
            // 往远离玩家的方向走
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平距离更大
                if (dx > 0 && this.direction !== Direction.RIGHT) {
                    this.setDirection(Direction.LEFT);
                } else if (dx < 0 && this.direction !== Direction.LEFT) {
                    this.setDirection(Direction.RIGHT);
                } else if (dy > 0 && this.direction !== Direction.DOWN) {
                    this.setDirection(Direction.UP);
                } else if (dy < 0 && this.direction !== Direction.UP) {
                    this.setDirection(Direction.DOWN);
                }
            } else {
                // 垂直距离更大或相等
                if (dy > 0 && this.direction !== Direction.DOWN) {
                    this.setDirection(Direction.UP);
                } else if (dy < 0 && this.direction !== Direction.UP) {
                    this.setDirection(Direction.DOWN);
                } else if (dx > 0 && this.direction !== Direction.RIGHT) {
                    this.setDirection(Direction.LEFT);
                } else if (dx < 0 && this.direction !== Direction.LEFT) {
                    this.setDirection(Direction.RIGHT);
                }
            }
            return;
        }
        
        // 往接近玩家的方向走
        if (Math.random() > 0.5) {
            // 水平移动
            if (dx > 0 && this.direction !== Direction.LEFT) {
                this.setDirection(Direction.RIGHT);
            } else if (dx < 0 && this.direction !== Direction.RIGHT) {
                this.setDirection(Direction.LEFT);
            } else if (dy > 0 && this.direction !== Direction.UP) {
                this.setDirection(Direction.DOWN);
            } else if (dy < 0 && this.direction !== Direction.DOWN) {
                this.setDirection(Direction.UP);
            } else {
                this.moveRandomly();
            }
        } else {
            // 垂直移动
            if (dy > 0 && this.direction !== Direction.UP) {
                this.setDirection(Direction.DOWN);
            } else if (dy < 0 && this.direction !== Direction.DOWN) {
                this.setDirection(Direction.UP);
            } else if (dx > 0 && this.direction !== Direction.LEFT) {
                this.setDirection(Direction.RIGHT);
            } else if (dx < 0 && this.direction !== Direction.RIGHT) {
                this.setDirection(Direction.LEFT);
            } else {
                this.moveRandomly();
            }
        }
    }

    // 新增方法：做出不安全的移动（可能导致碰撞）
    makeUnsafeMove(food, playerSnake) {
        // 获取当前头部位置
        const head = this.body[0];
        
        // 获取所有可能的移动方向
        const possibleDirections = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        
        // 从可能的方向中随机选择一个
        const shuffledDirections = this.shuffleArray([...possibleDirections]);
        
        // 寻找一个可能导致碰墙或自身碰撞的方向
        for (const dir of shuffledDirections) {
            // 模拟下一个位置
            const nextPos = this.getNextPosition(head, dir);
            
            // 检查这个位置是否靠近墙壁（距离为1）- 这是有风险的移动
            if (nextPos.x === 1 || nextPos.x === Config.GRID_SIZE - 2 ||
                nextPos.y === 1 || nextPos.y === Config.GRID_SIZE - 2) {
                return dir;
            }
            
            // 检查是否接近自己的身体 - 这是有风险的移动
            for (let i = 2; i < this.body.length; i++) {
                const segment = this.body[i];
                const distance = Math.abs(nextPos.x - segment.x) + Math.abs(nextPos.y - segment.y);
                if (distance === 1) {
                    return dir;
                }
            }
            
            // 检查是否接近玩家蛇 - 这是有风险的移动
            if (playerSnake) {
                for (const segment of playerSnake.body) {
                    const distance = Math.abs(nextPos.x - segment.x) + Math.abs(nextPos.y - segment.y);
                    if (distance === 1) {
                        return dir;
                    }
                }
            }
        }
        
        // 如果没有找到不安全的移动，返回null
        return null;
    }
    
    // 辅助方法：随机打乱数组
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 检查给定点是否会发生碰撞
    isCollision(point) {
        // 检查是否撞墙
        if (point.x < 0 || point.x >= Config.GRID_SIZE || 
            point.y < 0 || point.y >= Config.GRID_SIZE) {
            return true;
        }
        
        // 检查是否撞到自己的身体
        for (let i = 1; i < this.body.length; i++) {
            if (point.x === this.body[i].x && point.y === this.body[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 获取根据方向移动一格后的新位置
    getNextPosition(position, direction) {
        let newX = position.x;
        let newY = position.y;
        
        switch(direction) {
            case Direction.UP:
                newY -= 1;
                break;
            case Direction.DOWN:
                newY += 1;
                break;
            case Direction.LEFT:
                newX -= 1;
                break;
            case Direction.RIGHT:
                newX += 1;
                break;
        }
        
        return new Point(newX, newY);
    }
    
    // 获取从起点到目标的方向
    getDirectionToTarget(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        
        if (dx > 0) return Direction.RIGHT;
        if (dx < 0) return Direction.LEFT;
        if (dy > 0) return Direction.DOWN;
        if (dy < 0) return Direction.UP;
        
        // 默认保持当前方向
        return this.direction;
    }

    // 新增方法：故意做出自杀式移动
    makeSuicideMove() {
        const head = this.body[0];
        
        // 获取画布边界
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return null;
        
        const cols = Math.floor(canvas.width / Config.GRID_SIZE);
        const rows = Math.floor(canvas.height / Config.GRID_SIZE);
        
        // 如果蛇足够长，故意咬自己的尾巴
        if (this.body.length > 5) {
            // 寻找自己的尾部
            const tail = this.body[this.body.length - 1];
            
            // 如果尾部在头部附近，直接往那里移动
            const dx = tail.x - head.x;
            const dy = tail.y - head.y;
            
            if (Math.abs(dx) === 1 && dy === 0) {
                // 尾巴在头的左右
                console.log("🐍 简单AI: 故意咬自己的尾巴");
                return dx > 0 ? Direction.RIGHT : Direction.LEFT;
            }
            
            if (Math.abs(dy) === 1 && dx === 0) {
                // 尾巴在头的上下
                console.log("🐍 简单AI: 故意咬自己的尾巴");
                return dy > 0 ? Direction.DOWN : Direction.UP;
            }
        }
        
        // 尝试找到导致死亡的移动方向
        // 1. 移动到墙壁
        if (head.x <= 1) {
            return Direction.LEFT; // 故意撞左墙
        }
        if (head.x >= cols - 2) {
            return Direction.RIGHT; // 故意撞右墙
        }
        if (head.y <= 1) {
            return Direction.UP; // 故意撞上墙
        }
        if (head.y >= rows - 2) {
            return Direction.DOWN; // 故意撞下墙
        }
        
        // 2. 移动到自己的身体
        for (let i = 1; i < this.body.length; i++) {
            const segment = this.body[i];
            const dx = segment.x - head.x;
            const dy = segment.y - head.y;
            
            // 如果身体部分在头部附近
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                // 计算朝向身体的方向
                if (dx > 0) return Direction.RIGHT;
                if (dx < 0) return Direction.LEFT;
                if (dy > 0) return Direction.DOWN;
                if (dy < 0) return Direction.UP;
            }
        }
        
        return null; // 如果没有找到自杀方向
    }
}