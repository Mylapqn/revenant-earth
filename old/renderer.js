class Renderer {
    canvas;
    ctx;
    pixelData;
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.pixelData = Array.from(Array(dimensions.x), () => new Array(dimensions.y))
        for (let x = 0; x < dimensions.x; x++) {
            for (let y = 0; y < dimensions.y; y++) {
                this.pixelData[x][y] = { color: new Color(0, 0, 0, 0) };
            }
        }
    }

    fillRect(minX, minY, w, h, color) {
        const maxX = minX + w;
        const maxY = minY + h;
        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                this.setPixel(x, y, color);
            }
        }
    }

    addRect(minX, minY, w, h, color) {
        const maxX = minX + w;
        const maxY = minY + h;
        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                if (x >= 0 && x < dimensions.x && y >= 0 && y < dimensions.y) {
                    this.pixelData[x][y].color = this.pixelData[x][y].color.add(color);
                }
            }
        }
    }

    clearRect(minX, minY, w, h) {
        const maxX = minX + w;
        const maxY = minY + h;
        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                if (x >= 0 && x < dimensions.x && y >= 0 && y < dimensions.y) {
                    this.pixelData[x][y].color.a = 0;
                }
            }
        }
    }

    drawLine(x1, y1, x2, y2, color) {
        x1 = Math.round(x1);
        x2 = Math.round(x2);
        y1 = Math.round(y1);
        y2 = Math.round(y2);
        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        let sx = (x1 < x2) ? 1 : -1;
        let sy = (y1 < y2) ? 1 : -1;
        let err = dx - dy;

        while (x1 != x2 || y1 != y2) {
            this.setPixel(x1, y1, color);
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x1 += sx; }
            if (e2 < dx) { err += dx; y1 += sy; }
        }
    }
    drawThickLine(x1, y1, x2, y2, thickness, color) {
        if (thickness == 1) {
            this.drawLine(x1, y1, x2, y2, color);
        }
        else if (thickness > 0) {
            //this.fillRect(x1, y1, thickness, thickness, color);
            //this.fillRect(x2, y2, thickness, thickness, color);

            let x0 = x1;
            let y0 = y1;

            x2 -= x1;
            y2 -= y1;

            let xOff = x2;
            let yOff = y2;

            x1 = 0;
            y1 = 0;

            let dist = Math.hypot(x2, y2);
            if (dist == 0) dist = 1;

            let a = x2;
            x2 = y2 / dist;
            y2 = -a / dist;

            x1 -= x2;
            y1 -= y2;

            x1 *= Math.floor(thickness / 2);
            y1 *= Math.floor(thickness / 2);

            x2 *= Math.ceil(thickness / 2);
            y2 *= Math.ceil(thickness / 2);


            x1 = Math.round(x1);
            y1 = Math.round(y1);
            x2 = Math.round(x2);
            y2 = Math.round(y2);

            let dx = Math.abs(x2 - x1);
            let dy = Math.abs(y2 - y1);
            let sx = (x1 < x2) ? 1 : -1;
            let sy = (y1 < y2) ? 1 : -1;
            let err = dx - dy;
            while (x1 != x2 || y1 != y2) {
                this.drawLine(x1 + x0, y1 + y0, x1 + x0 + xOff, y1 + y0 + yOff, color)
                //this.setPixel(x1+x0,y1+y0,Color.Blue);
                let e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x1 += sx; }
                else if (e2 < dx) { err += dx; y1 += sy; }

            }
        }

    }

    setPixel(x, y, color) {
        if (x >= 0 && x < dimensions.x && y >= 0 && y < dimensions.y) {
            const p = this.pixelData[x][y];
            p.color.r = color.r;
            p.color.g = color.g;
            p.color.b = color.b;
            p.color.a = color.a;
        }
    }

    render() {
        const canvasImageData = this.ctx.createImageData(dimensions.x, dimensions.y);
        for (let x = 0; x < dimensions.x; x++) {
            for (let y = 0; y < dimensions.y; y++) {
                const p = this.pixelData[x][y];
                setCanvasPixel(canvasImageData, x, y, p.color);
            }
        }
        this.ctx.clearRect(0, 0, dimensions.x, dimensions.y);
        this.ctx.putImageData(canvasImageData, 0, 0);
    }
    clear() {
        this.clearRect(0, 0, dimensions.x, dimensions.y);
    }
}

function setCanvasPixel(canvasImageData, x, y, color) {
    const index = x + y * canvasImageData.width;
    canvasImageData.data[index * 4] = color.r;
    canvasImageData.data[index * 4 + 1] = color.g;
    canvasImageData.data[index * 4 + 2] = color.b;
    canvasImageData.data[index * 4 + 3] = color.a;
}

function getCanvasPixel(imageData, x, y) {
    const index = x + y * imageData.width;
    const color = new Color();
    color.r = imageData.data[index * 4];
    color.g = imageData.data[index * 4 + 1];
    color.b = imageData.data[index * 4 + 2];
    color.a = imageData.data[index * 4 + 3];
    return color;
}

const nRadius = 1;

function getPixelNeighbors(pixelData, x, y) {
    let ret = [];
    for (let dx = -nRadius; dx <= nRadius; dx++) {
        for (let dy = -nRadius; dy <= nRadius; dy++) {
            let nx = x + dx;
            let ny = y + dy;
            if (nx < dimensions.x && ny < dimensions.y && nx >= 0 && ny >= 0 && !(dx == 0 && dy == 0)) {
                ret.push(pixelData[nx][ny]);
            }
        }
    }
    return ret;
}