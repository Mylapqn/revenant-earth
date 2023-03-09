export function indexSplit(index: number, width: number) {
    const x = index % width;
    const y = (index - x) / width
    return [x, y]
}

export function random(min: number, max: number) {
    return (Math.random() * (max - min) + min);
}

export function randomInt(min: number, max: number) {
    return Math.floor(random(min, max));
}