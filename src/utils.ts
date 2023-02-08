export function indexSplit(index: number, width: number) {
    const x = index % width;
    const y = (index - x) / width
    return [x, y]
}

export function randomColor(min: number, max: number) {
    const diff = max - min;
    return Math.floor(Math.random() * diff + min) * 256 * 256 * 256
        + Math.floor(Math.random() * diff + min) * 256 * 256
        + Math.floor(Math.random() * diff + min) * 256 + 256
}