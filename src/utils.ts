export function indexSplit(index: number, width: number) {
    const x = index % width;
    const y = (index - x) / width
    return [x, y]
}

export function random(min: number, max: number) {
    return (Math.random() * (max - min) + min);
}

export function randomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomBool(probability = .5) {
    return Math.random() < probability;
}

export function rotateAngle(from: number, to: number, amount: number) {
    amount = Math.min(1, Math.max(-1, amount))
    // Get the difference between the current angle and the target angle
    let netAngle = (from - to + Math.PI * 2) % (Math.PI * 2);
    let delta = Math.min(Math.abs(netAngle - Math.PI * 2), netAngle, amount);
    let sign = (netAngle - Math.PI) >= 0 ? 1 : -1;
    // Turn in the closest direction to the target
    from += sign * delta + Math.PI * 2;
    from %= Math.PI * 2;
    return from;
}

export function lerp(from: number, to: number, ratio = 0.5) {
    return from * (1 - ratio) + to * ratio;
}