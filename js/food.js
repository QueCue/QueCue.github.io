class Food {
    constructor() {
        this.position = Utils.getRandomPosition();
        this.pulseAmount = 0;
        this.pulseDirection = 1;
    }

    spawn() {
        this.position = Utils.getRandomPosition();
    }

    draw(ctx) {
        const size = Config.GRID_SIZE;
        const x = this.position.x * size;
        const y = this.position.y * size;
        
        // 更新脉冲动画
        this.updatePulse();
        
        // 绘制食物
        ctx.save();
        
        // 基本填充
        ctx.fillStyle = Config.COLORS.FOOD;
        
        // 绘制带圆角的方形食物
        const cornerRadius = size / 4;
        const pulse = this.pulseAmount;
        
        // 缩小一点以便有空间添加高光效果
        const innerSize = size * 0.8;
        const offset = (size - innerSize) / 2;
        
        // 绘制主体
        ctx.beginPath();
        ctx.moveTo(x + offset + cornerRadius, y + offset);
        ctx.lineTo(x + offset + innerSize - cornerRadius, y + offset);
        ctx.quadraticCurveTo(x + offset + innerSize, y + offset, x + offset + innerSize, y + offset + cornerRadius);
        ctx.lineTo(x + offset + innerSize, y + offset + innerSize - cornerRadius);
        ctx.quadraticCurveTo(x + offset + innerSize, y + offset + innerSize, x + offset + innerSize - cornerRadius, y + offset + innerSize);
        ctx.lineTo(x + offset + cornerRadius, y + offset + innerSize);
        ctx.quadraticCurveTo(x + offset, y + offset + innerSize, x + offset, y + offset + innerSize - cornerRadius);
        ctx.lineTo(x + offset, y + offset + cornerRadius);
        ctx.quadraticCurveTo(x + offset, y + offset, x + offset + cornerRadius, y + offset);
        ctx.closePath();
        ctx.fill();
        
        // 添加高光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const highlightSize = innerSize * 0.6;
        const highlightOffset = offset + innerSize * 0.1;
        
        ctx.beginPath();
        ctx.arc(x + highlightOffset + highlightSize/3, y + highlightOffset + highlightSize/3, highlightSize/4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    updatePulse() {
        // 控制脉冲动画
        if (this.pulseDirection > 0) {
            this.pulseAmount += 0.04;
            if (this.pulseAmount >= 1) {
                this.pulseAmount = 1;
                this.pulseDirection = -1;
            }
        } else {
            this.pulseAmount -= 0.04;
            if (this.pulseAmount <= 0) {
                this.pulseAmount = 0;
                this.pulseDirection = 1;
            }
        }
    }
}