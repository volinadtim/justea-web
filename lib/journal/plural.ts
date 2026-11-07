/** «1 пролив», «4 пролива», «6 проливов» — обычное русское склонение. */
export function pluralSteeps(count: number): string {
    const abs = Math.abs(count) % 100;
    const last = abs % 10;

    if (abs > 10 && abs < 20) {
        return `${count} проливов`;
    }

    if (last === 1) {
        return `${count} пролив`;
    }

    if (last >= 2 && last <= 4) {
        return `${count} пролива`;
    }

    return `${count} проливов`;
}
