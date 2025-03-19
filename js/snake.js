class Snake {
    constructor(initialPosition, initialDirection, color) {
        this.body = [initialPosition];
        this.direction = initialDirection;
        this.color = color;
        this.growing = false;

        // 初始化蛇身
        for (let i = 1; i < Config.INITIAL_SNAKE_LENGTH; i++) {
            this.body.push(new Point(
                initialPosition.x - (initialDirection === Direction.RIGHT ? i : (initialDirection === Direction.LEFT ? -i : 0)),
                initialPosition.y - (initialDirection === Direction.DOWN ? i : (initialDirection === Direction.UP ? -i : 0))
            ));
        }
    }

    move() {
        const head = this.body[0];
        let newHead;

        // 获取画布尺寸
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            return; // 如果画布不存在，不进行移动
        }
        
        const cols = Math.floor(canvas.width / Config.GRID_SIZE);
        const rows = Math.floor(canvas.height / Config.GRID_SIZE);

        // 基于方向计算新的头部位置
        switch (this.direction) {
            case Direction.UP:
                newHead = new Point(head.x, head.y - 1);
                break;
            case Direction.DOWN:
                newHead = new Point(head.x, head.y + 1);
                break;
            case Direction.LEFT:
                newHead = new Point(head.x - 1, head.y);
                break;
            case Direction.RIGHT:
                newHead = new Point(head.x + 1, head.y);
                break;
        }

        // 检查是否越界，如果越界则不进行移动
        if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
            // 已经越界，不添加新头部
            return;
        }

        this.body.unshift(newHead);

        if (!this.growing) {
            this.body.pop();
        } else {
            this.growing = false;
        }
    }

    setDirection(newDirection) {
        if (this.direction !== Utils.getOppositeDirection(newDirection)) {
            this.direction = newDirection;
        }
    }

    grow() {
        this.growing = true;
    }

    checkCollision(otherSnake) {
        const head = this.body[0];

        // 检查边界碰撞
        if (head.isOutOfBounds()) {
            return true;
        }

        // 检查自身碰撞
        for (let i = 1; i < this.body.length; i++) {
            if (head.equals(this.body[i])) {
                return true;
            }
        }

        // 检查与其他蛇的碰撞
        if (otherSnake) {
            return Utils.pointInArray(head, otherSnake.body);
        }

        return false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        this.body.forEach(point => {
            ctx.fillRect(
                point.x * Config.GRID_SIZE,
                point.y * Config.GRID_SIZE,
                Config.GRID_SIZE,
                Config.GRID_SIZE
            );
        });
    }
}