export default class ShapeGrid {
  constructor(mountElement, options = {}) {
    this.mount = mountElement;
    this.props = {
      direction: 'right',
      speed: 1,
      borderColor: '#999',
      squareSize: 40,
      hoverFillColor: '#222',
      shape: 'square', // square, hexagon, circle, triangle
      hoverTrailAmount: 0,
      ...options
    };

    this.numSquaresX = 0;
    this.numSquaresY = 0;
    this.gridOffset = { x: 0, y: 0 };
    this.hoveredSquare = null;
    this.trailCells = [];
    this.cellOpacities = new Map();

    this.init();
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'shapegrid-canvas';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '-1';
    
    this.mount.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas = this.resizeCanvas.bind(this);
    window.addEventListener('resize', this.resizeCanvas);
    this.resizeCanvas();

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);

    this.animate = this.animate.bind(this);
    this.requestRef = requestAnimationFrame(this.animate);
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.numSquaresX = Math.ceil(this.canvas.width / this.props.squareSize) + 1;
    this.numSquaresY = Math.ceil(this.canvas.height / this.props.squareSize) + 1;
  }

  drawHex(cx, cy, size) {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const vx = cx + size * Math.cos(angle);
      const vy = cy + size * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(vx, vy);
      else this.ctx.lineTo(vx, vy);
    }
    this.ctx.closePath();
  }

  drawCircle(cx, cy, size) {
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    this.ctx.closePath();
  }

  drawTriangle(cx, cy, size, flip) {
    this.ctx.beginPath();
    if (flip) {
      this.ctx.moveTo(cx, cy + size / 2);
      this.ctx.lineTo(cx + size / 2, cy - size / 2);
      this.ctx.lineTo(cx - size / 2, cy - size / 2);
    } else {
      this.ctx.moveTo(cx, cy - size / 2);
      this.ctx.lineTo(cx + size / 2, cy + size / 2);
      this.ctx.lineTo(cx - size / 2, cy + size / 2);
    }
    this.ctx.closePath();
  }

  drawGrid() {
    const { shape, squareSize, hoverFillColor, borderColor } = this.props;
    const isHex = shape === 'hexagon';
    const isTri = shape === 'triangle';
    const hexHoriz = squareSize * 1.5;
    const hexVert = squareSize * Math.sqrt(3);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (isHex) {
      const colShift = Math.floor(this.gridOffset.x / hexHoriz);
      const offsetX = ((this.gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
      const offsetY = ((this.gridOffset.y % hexVert) + hexVert) % hexVert;

      const cols = Math.ceil(this.canvas.width / hexHoriz) + 3;
      const rows = Math.ceil(this.canvas.height / hexVert) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * hexHoriz + offsetX;
          const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            this.ctx.globalAlpha = alpha;
            this.drawHex(cx, cy, squareSize);
            this.ctx.fillStyle = hoverFillColor;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
          }

          this.drawHex(cx, cy, squareSize);
          this.ctx.strokeStyle = borderColor;
          this.ctx.stroke();
        }
      }
    } else if (isTri) {
      const halfW = squareSize / 2;
      const colShift = Math.floor(this.gridOffset.x / halfW);
      const rowShift = Math.floor(this.gridOffset.y / squareSize);
      const offsetX = ((this.gridOffset.x % halfW) + halfW) % halfW;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const cols = Math.ceil(this.canvas.width / halfW) + 4;
      const rows = Math.ceil(this.canvas.height / squareSize) + 4;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * halfW + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;
          const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            this.ctx.globalAlpha = alpha;
            this.drawTriangle(cx, cy, squareSize, flip);
            this.ctx.fillStyle = hoverFillColor;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
          }

          this.drawTriangle(cx, cy, squareSize, flip);
          this.ctx.strokeStyle = borderColor;
          this.ctx.stroke();
        }
      }
    } else if (shape === 'circle') {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const cols = Math.ceil(this.canvas.width / squareSize) + 3;
      const rows = Math.ceil(this.canvas.height / squareSize) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * squareSize + squareSize / 2 + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            this.ctx.globalAlpha = alpha;
            this.drawCircle(cx, cy, squareSize);
            this.ctx.fillStyle = hoverFillColor;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
          }

          this.drawCircle(cx, cy, squareSize);
          this.ctx.strokeStyle = borderColor;
          this.ctx.stroke();
        }
      }
    } else {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const cols = Math.ceil(this.canvas.width / squareSize) + 3;
      const rows = Math.ceil(this.canvas.height / squareSize) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const sx = col * squareSize + offsetX;
          const sy = row * squareSize + offsetY;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = hoverFillColor;
            this.ctx.fillRect(sx, sy, squareSize, squareSize);
            this.ctx.globalAlpha = 1;
          }

          this.ctx.strokeStyle = borderColor;
          this.ctx.strokeRect(sx, sy, squareSize, squareSize);
        }
      }
    }

    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      Math.sqrt(this.canvas.width ** 2 + this.canvas.height ** 2) / 2
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    // Adding fade around the edges for neat effect
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  updateCellOpacities() {
    const targets = new Map();

    if (this.hoveredSquare) {
      targets.set(`${this.hoveredSquare.x},${this.hoveredSquare.y}`, 1);
    }

    if (this.props.hoverTrailAmount > 0) {
      for (let i = 0; i < this.trailCells.length; i++) {
        const t = this.trailCells[i];
        const key = `${t.x},${t.y}`;
        if (!targets.has(key)) {
          targets.set(key, (this.trailCells.length - i) / (this.trailCells.length + 1));
        }
      }
    }

    for (const [key] of targets) {
      if (!this.cellOpacities.has(key)) {
        this.cellOpacities.set(key, 0);
      }
    }

    for (const [key, opacity] of this.cellOpacities) {
      const target = targets.get(key) || 0;
      const next = opacity + (target - opacity) * 0.15;
      if (next < 0.005) {
        this.cellOpacities.delete(key);
      } else {
        this.cellOpacities.set(key, next);
      }
    }
  }

  animate() {
    const { speed, direction, shape, squareSize } = this.props;
    const effectiveSpeed = Math.max(speed, 0.1);
    
    const isHex = shape === 'hexagon';
    const isTri = shape === 'triangle';
    const hexHoriz = squareSize * 1.5;
    const hexVert = squareSize * Math.sqrt(3);

    const wrapX = isHex ? hexHoriz * 2 : squareSize;
    const wrapY = isHex ? hexVert : isTri ? squareSize * 2 : squareSize;

    switch (direction) {
      case 'right':
        this.gridOffset.x = (this.gridOffset.x - effectiveSpeed + wrapX) % wrapX;
        break;
      case 'left':
        this.gridOffset.x = (this.gridOffset.x + effectiveSpeed + wrapX) % wrapX;
        break;
      case 'up':
        this.gridOffset.y = (this.gridOffset.y + effectiveSpeed + wrapY) % wrapY;
        break;
      case 'down':
        this.gridOffset.y = (this.gridOffset.y - effectiveSpeed + wrapY) % wrapY;
        break;
      case 'diagonal':
        this.gridOffset.x = (this.gridOffset.x - effectiveSpeed + wrapX) % wrapX;
        this.gridOffset.y = (this.gridOffset.y - effectiveSpeed + wrapY) % wrapY;
        break;
      default:
        break;
    }

    this.updateCellOpacities();
    this.drawGrid();
    this.requestRef = requestAnimationFrame(this.animate);
  }

  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const { shape, squareSize, hoverTrailAmount } = this.props;
    const isHex = shape === 'hexagon';
    const isTri = shape === 'triangle';
    const hexHoriz = squareSize * 1.5;
    const hexVert = squareSize * Math.sqrt(3);

    let col, row;

    if (isHex) {
      const colShift = Math.floor(this.gridOffset.x / hexHoriz);
      const offsetX = ((this.gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
      const offsetY = ((this.gridOffset.y % hexVert) + hexVert) % hexVert;
      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      col = Math.round(adjustedX / hexHoriz);
      const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0;
      row = Math.round((adjustedY - rowOffset) / hexVert);
    } else if (isTri) {
      const halfW = squareSize / 2;
      const offsetX = ((this.gridOffset.x % halfW) + halfW) % halfW;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;
      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      col = Math.round(adjustedX / halfW);
      row = Math.floor(adjustedY / squareSize);
    } else if (shape === 'circle') {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;
      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      col = Math.round(adjustedX / squareSize);
      row = Math.round(adjustedY / squareSize);
    } else {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;
      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      col = Math.floor(adjustedX / squareSize);
      row = Math.floor(adjustedY / squareSize);
    }

    if (!this.hoveredSquare || this.hoveredSquare.x !== col || this.hoveredSquare.y !== row) {
      if (this.hoveredSquare && hoverTrailAmount > 0) {
        this.trailCells.unshift({ ...this.hoveredSquare });
        if (this.trailCells.length > hoverTrailAmount) this.trailCells.length = hoverTrailAmount;
      }
      this.hoveredSquare = { x: col, y: row };
    }
  }

  handleMouseLeave() {
    if (this.hoveredSquare && this.props.hoverTrailAmount > 0) {
      this.trailCells.unshift({ ...this.hoveredSquare });
      if (this.trailCells.length > this.props.hoverTrailAmount) this.trailCells.length = this.props.hoverTrailAmount;
    }
    this.hoveredSquare = null;
  }

  destroy() {
    window.removeEventListener('resize', this.resizeCanvas);
    cancelAnimationFrame(this.requestRef);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
      if (this.mount && this.mount.contains(this.canvas)) {
        this.mount.removeChild(this.canvas);
      }
    }
  }
}
