class Color {
    r = 0;
    g = 0;
    b = 0;
    a = 255;
    constructor(r, g, b, a) {
        this.r = r ?? 0;
        this.g = g ?? 0;
        this.b = b ?? 0;
        this.a = a ?? 255;
    }
    toCSS() {
        return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
    }
    randomise(amount) {
        return new Color(clampRound(this.r + random(-amount, amount)), clampRound(this.g + random(-amount, amount)), clampRound(this.b + random(-amount, amount)))
    }
    add(color) {
        return new Color(clamp(this.r + color.r), clamp(this.g + color.g), clamp(this.b + color.b), clamp(this.a + color.a));
    }
    copy() {
        return new Color(this.r, this.g, this.b, this.a);
    }
    static grayscale(val) {
        return new Color(val, val, val);
    }
}
Color.Red = new Color(255, 0, 0);
Color.Blue = new Color(0, 0, 255);

function clampRound(x) {
    return clamp(Math.round(x));
}

function clamp(x) {
    return Math.max(0, Math.min(255, x));
}