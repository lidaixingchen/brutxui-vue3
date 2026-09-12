import { describe, it, expect } from 'vitest'
import { hasSelectionValue } from './selection-value'

describe('hasSelectionValue', () => {
    it('returns false for null and undefined', () => {
        expect(hasSelectionValue(null)).toBe(false)
        expect(hasSelectionValue(undefined)).toBe(false)
    })

    it('returns false for empty string and empty array', () => {
        expect(hasSelectionValue('')).toBe(false)
        expect(hasSelectionValue([])).toBe(false)
    })

    it('returns false for NaN', () => {
        expect(hasSelectionValue(NaN)).toBe(false)
        expect(hasSelectionValue(Number.NaN)).toBe(false)
    })

    it('returns true for non-empty string including whitespace', () => {
        expect(hasSelectionValue('hello')).toBe(true)
        expect(hasSelectionValue(' ')).toBe(true)
        expect(hasSelectionValue('\t')).toBe(true)
    })

    it('returns true for array with elements', () => {
        expect(hasSelectionValue([1])).toBe(true)
        expect(hasSelectionValue([''])).toBe(true)
    })

    it('returns true for numeric zero and boolean false', () => {
        expect(hasSelectionValue(0)).toBe(true)
        expect(hasSelectionValue(false)).toBe(true)
    })

    it('returns true for objects and symbols', () => {
        expect(hasSelectionValue({})).toBe(true)
        expect(hasSelectionValue({ a: 1 })).toBe(true)
        expect(hasSelectionValue(Symbol('test'))).toBe(true)
    })
})
