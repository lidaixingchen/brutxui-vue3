import { describe, it, expect } from 'vitest'
import { useUpload } from './useUpload'

function createFile(name: string, size: number, type = 'text/plain'): File {
    const buffer = new ArrayBuffer(size)
    return new File([buffer], name, { type })
}

describe('useUpload', () => {
    describe('validateFileSize', () => {
        it('returns true when maxSize is undefined', () => {
            const { validateFileSize } = useUpload()
            expect(validateFileSize(createFile('a.txt', 9999))).toBe(true)
        })

        it('returns true when file size is within maxSize', () => {
            const { validateFileSize } = useUpload({ maxSize: 2048 })
            expect(validateFileSize(createFile('a.txt', 1024))).toBe(true)
        })

        it('returns true when file size equals maxSize boundary', () => {
            const { validateFileSize } = useUpload({ maxSize: 1024 })
            expect(validateFileSize(createFile('a.txt', 1024))).toBe(true)
        })

        it('returns false when file size exceeds maxSize', () => {
            const { validateFileSize } = useUpload({ maxSize: 2048 })
            expect(validateFileSize(createFile('a.txt', 4096))).toBe(false)
        })

        it('accepts maxSize of 0 and only allows empty files', () => {
            const { validateFileSize } = useUpload({ maxSize: 0 })
            expect(validateFileSize(createFile('empty.txt', 0))).toBe(true)
            expect(validateFileSize(createFile('non-empty.txt', 1))).toBe(false)
        })

        it('reacts to maxSize getter changes', () => {
            let limit = 1000
            const { validateFileSize } = useUpload({ maxSize: () => limit })
            expect(validateFileSize(createFile('a.txt', 500))).toBe(true)
            limit = 100
            expect(validateFileSize(createFile('a.txt', 500))).toBe(false)
        })
    })

    describe('matchesAccept', () => {
        it('returns true when accept is undefined', () => {
            const { matchesAccept } = useUpload()
            expect(matchesAccept(createFile('a.txt', 10))).toBe(true)
        })

        it('returns true when accept is empty string', () => {
            const { matchesAccept } = useUpload({ accept: '' })
            expect(matchesAccept(createFile('a.txt', 10))).toBe(true)
        })

        it('matches by extension', () => {
            const { matchesAccept } = useUpload({ accept: '.pdf,.doc' })
            expect(matchesAccept(createFile('doc.pdf', 10, 'application/pdf'))).toBe(true)
            expect(matchesAccept(createFile('doc.doc', 10))).toBe(true)
            expect(matchesAccept(createFile('doc.txt', 10))).toBe(false)
        })

        it('matches case-insensitively by extension', () => {
            const { matchesAccept } = useUpload({ accept: '.PDF' })
            expect(matchesAccept(createFile('doc.pdf', 10))).toBe(true)
        })

        it('matches by exact mime type', () => {
            const { matchesAccept } = useUpload({ accept: 'text/plain' })
            expect(matchesAccept(createFile('a.txt', 10, 'text/plain'))).toBe(true)
            expect(matchesAccept(createFile('a.txt', 10, 'text/csv'))).toBe(false)
        })

        it('matches by wildcard mime type', () => {
            const { matchesAccept } = useUpload({ accept: 'image/*' })
            expect(matchesAccept(createFile('a.png', 10, 'image/png'))).toBe(true)
            expect(matchesAccept(createFile('a.jpg', 10, 'image/jpeg'))).toBe(true)
            expect(matchesAccept(createFile('a.txt', 10, 'text/plain'))).toBe(false)
        })

        it('matches any token in a comma-separated list', () => {
            const { matchesAccept } = useUpload({ accept: '.pdf, image/*, text/plain' })
            expect(matchesAccept(createFile('a.pdf', 10, 'application/pdf'))).toBe(true)
            expect(matchesAccept(createFile('a.png', 10, 'image/png'))).toBe(true)
            expect(matchesAccept(createFile('a.txt', 10, 'text/plain'))).toBe(true)
            expect(matchesAccept(createFile('a.csv', 10, 'text/csv'))).toBe(false)
        })

        it('ignores empty tokens in accept string', () => {
            const { matchesAccept } = useUpload({ accept: ', ,' })
            expect(matchesAccept(createFile('a.txt', 10))).toBe(true)
        })
    })

    describe('isFileValid', () => {
        it('returns true only when both size and accept pass', () => {
            const { isFileValid } = useUpload({ maxSize: 2048, accept: '.txt' })
            expect(isFileValid(createFile('a.txt', 1024, 'text/plain'))).toBe(true)
            expect(isFileValid(createFile('a.txt', 4096, 'text/plain'))).toBe(false)
            expect(isFileValid(createFile('a.pdf', 1024, 'application/pdf'))).toBe(false)
        })
    })

    describe('filterValidFiles', () => {
        it('filters out files exceeding maxSize', () => {
            const { filterValidFiles } = useUpload({ maxSize: 2048 })
            const small = createFile('small.txt', 1024)
            const large = createFile('large.txt', 4096)
            expect(filterValidFiles([small, large])).toEqual([small])
        })

        it('filters out files not matching accept', () => {
            const { filterValidFiles } = useUpload({ accept: '.pdf' })
            const pdf = createFile('a.pdf', 10, 'application/pdf')
            const txt = createFile('a.txt', 10, 'text/plain')
            expect(filterValidFiles([pdf, txt])).toEqual([pdf])
        })

        it('returns all files when no constraints set', () => {
            const { filterValidFiles } = useUpload()
            const a = createFile('a.txt', 100)
            const b = createFile('b.txt', 99999)
            expect(filterValidFiles([a, b])).toEqual([a, b])
        })

        it('returns empty array when all files invalid', () => {
            const { filterValidFiles } = useUpload({ maxSize: 512 })
            expect(filterValidFiles([createFile('a.txt', 1024)])).toEqual([])
        })
    })

    describe('selectedFiles / addFiles', () => {
        it('initializes selectedFiles empty by default', () => {
            const { selectedFiles } = useUpload()
            expect(selectedFiles.value).toEqual([])
        })

        it('initializes selectedFiles from initialFiles', () => {
            const initial = [createFile('a.txt', 10)]
            const { selectedFiles } = useUpload({ initialFiles: initial })
            expect(selectedFiles.value).toEqual(initial)
        })

        it('addFiles appends valid files when multiple is true', () => {
            const { selectedFiles, addFiles } = useUpload({ maxSize: 2048 })
            const small = createFile('small.txt', 1024)
            const large = createFile('large.txt', 4096)
            const added = addFiles([small, large])
            expect(added).toEqual([small])
            expect(selectedFiles.value).toEqual([small])
        })

        it('addFiles keeps only the first valid file when multiple is false', () => {
            const { selectedFiles, addFiles } = useUpload({ multiple: false })
            const a = createFile('a.txt', 10)
            const b = createFile('b.txt', 20)
            const added = addFiles([a, b])
            expect(added).toEqual([a])
            expect(selectedFiles.value).toEqual([a])
        })

        it('addFiles replaces the list on each call when multiple is false', () => {
            const { selectedFiles, addFiles } = useUpload({ multiple: false })
            addFiles([createFile('a.txt', 10)])
            addFiles([createFile('b.txt', 20)])
            expect(selectedFiles.value).toHaveLength(1)
            expect(selectedFiles.value[0].name).toBe('b.txt')
        })

        it('addFiles preserves existing file when all new files are invalid in single mode', () => {
            const { selectedFiles, addFiles } = useUpload({ multiple: false, maxSize: 100, accept: '.pdf' })
            const validPdf = createFile('valid.pdf', 50, 'application/pdf')
            addFiles([validPdf])
            expect(selectedFiles.value).toEqual([validPdf])

            const oversizedTxt = createFile('bad.txt', 999, 'text/plain')
            addFiles([oversizedTxt])
            expect(selectedFiles.value).toEqual([validPdf])
        })

        it('addFiles accepts FileList input', () => {
            const dt = new DataTransfer()
            dt.items.add(createFile('a.txt', 10))
            const { selectedFiles, addFiles } = useUpload()
            const added = addFiles(dt.files)
            expect(added).toHaveLength(1)
            expect(selectedFiles.value).toHaveLength(1)
        })
    })

    describe('removeFile / clearFiles', () => {
        it('removeFile removes the matching file reference', () => {
            const a = createFile('a.txt', 10)
            const b = createFile('b.txt', 20)
            const { selectedFiles, addFiles, removeFile } = useUpload()
            addFiles([a, b])
            removeFile(a)
            expect(selectedFiles.value).toEqual([b])
        })

        it('removeFile does nothing when file is not present', () => {
            const a = createFile('a.txt', 10)
            const other = createFile('other.txt', 20)
            const { selectedFiles, addFiles, removeFile } = useUpload()
            addFiles([a])
            removeFile(other)
            expect(selectedFiles.value).toEqual([a])
        })

        it('clearFiles empties selectedFiles', () => {
            const { selectedFiles, addFiles, clearFiles } = useUpload()
            addFiles([createFile('a.txt', 10)])
            clearFiles()
            expect(selectedFiles.value).toEqual([])
        })
    })

    describe('handleFileChange', () => {
        it('returns added files and resets input value', () => {
            const input = document.createElement('input')
            input.type = 'file'
            const file = createFile('a.txt', 10)
            Object.defineProperty(input, 'files', { value: [file], writable: false })
            const event = new Event('change')
            Object.defineProperty(event, 'target', { value: input, writable: false })
            const { handleFileChange } = useUpload()
            const added = handleFileChange(event)
            expect(added).toEqual([file])
            expect(input.value).toBe('')
        })

        it('returns empty array when target is not an input element', () => {
            const { handleFileChange } = useUpload()
            const added = handleFileChange(new Event('change'))
            expect(added).toEqual([])
        })
    })

    describe('selectedFiles is readonly', () => {
        it('cannot be mutated directly', () => {
            const { selectedFiles, addFiles } = useUpload()
            addFiles([createFile('a.txt', 10)])
            const originalLength = selectedFiles.value.length
            // @ts-expect-error testing readonly
            selectedFiles.value = []
            expect(selectedFiles.value.length).toBe(originalLength)
        })
    })
})
