export function hasSelectionValue(value: unknown): boolean {
    if (value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) {
        return false
    }
    if (Array.isArray(value)) {
        return value.length > 0
    }
    return true
}
