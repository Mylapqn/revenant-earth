export class Vector {
    x: number;
    y: number;
    constructor(x: number = 0, y: number = 0) {
        /**@type {number} X coordinate */
        this.x = x;
        /**@type {number} Y coordinate */
        this.y = y;
    }

    xy(): [number, number] {
        return [this.x, this.y];
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    distance(vector: Vector): number {
        let v = new Vector(Math.abs(this.x - vector.x), Math.abs(this.y - vector.y));
        return v.length();
    }

    add(vector: Vector): Vector {
        this.x = this.x + vector.x;
        this.y = this.y + vector.y;
        return this;
    }

    sub(vector: Vector): Vector {
        this.x = this.x - vector.x;
        this.y = this.y - vector.y;
        return this;
    }

    diff(vector: Vector): Vector {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    mult(magnitude: number): Vector {
        this.x = this.x * magnitude;
        this.y = this.y * magnitude;
        return this;
    }

    normalize(length: number): Vector {
        length = length || 1;
        let total = this.length();
        this.x = (this.x / total) * length;
        this.y = (this.y / total) * length;
        return this;
    }

    toAngle(): number {
        return Math.atan2(this.y, this.x);
    }

    result() {
        return new Vector(this.x, this.y);
    }

    inbound(bound: number): boolean {
        return this.x < bound && this.x > -bound && this.y < bound && this.y > -bound;
    }

    toString(): string {
        return "[X: " + this.x.toFixed(3) + " Y: " + this.y.toFixed(3) + "]";
    }

    /**
     * @param {Vector} v1
     * @param {Vector} v2
     * @param {Vector} v3
     * @return {Vector} (v1 x v2) x v3
     */
    static tripleCross(v1: Vector, v2: Vector, v3: Vector): Vector {
        let cross = v1.x * v2.y - v1.y * v2.x;
        return new Vector(-v3.y * cross, v3.x * cross);
    }

    static fromAngle(r: number): Vector {
        return new Vector(Math.cos(r), Math.sin(r));
    }

    static cross(v1: Vector, v2: Vector): number {
        return v1.x * v2.y - v1.y * v2.x;
    }

    static add(v1: Vector, v2: Vector): Vector {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    /**
     * @param {Vector} v1
     * @param {Vector} v2
     * @returns {Number}
     */
    static dot(v1: Vector, v2: Vector): number {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /**
     * @param {Vector} A point on line
     * @param {Vector} B point on line
     * @param {Vector} C distanced point
     * @return {number}
     * https://www.youtube.com/watch?v=KHuI9bXZS74
     */
    static distanceToLine(A: Vector, B: Vector, C: Vector): number {
        return (
            Math.abs((C.x - A.x) * (-B.y + A.y) + (C.y - A.y) * (B.x - A.x)) /
            Math.sqrt((-B.y + A.y) * (-B.y + A.y) + (B.x - A.x) * (B.x - A.x))
        );
    }

    /**
     * @param {Vector} v1
     * @param {Vector} v2
     * @return {boolean} two vectors have same values
     */
    static equals(v1: Vector, v2: Vector): boolean {
        return v1.x == v2.x && v1.y == v2.y;
    }
}