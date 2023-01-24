export function indexSplit(index: number, width: number) {
    const x = index % width;
    const y = (index - x) / width
    return [x, y]
}