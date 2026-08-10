import { type DeepReadonly, type MaybeRefOrGetter, type Ref, readonly, ref, toRaw, toValue } from 'vue'

export interface UseUploadOptions {
    maxSize?: MaybeRefOrGetter<number | undefined>
    accept?: MaybeRefOrGetter<string | undefined>
    multiple?: MaybeRefOrGetter<boolean | undefined>
    initialFiles?: MaybeRefOrGetter<File[]>
}

export interface UseUploadReturn {
    selectedFiles: DeepReadonly<Ref<File[]>>
    validateFileSize: (file: File) => boolean
    matchesAccept: (file: File) => boolean
    isFileValid: (file: File) => boolean
    filterValidFiles: (files: File[]) => File[]
    addFiles: (files: FileList | File[]) => File[]
    removeFile: (file: File) => void
    clearFiles: () => void
    handleFileChange: (event: Event) => File[]
}

export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
    // 初始文件同样经 isFileValid 校验（与 addFiles 行为一致），
    // 避免 initialFiles 绕过 maxSize/accept 约束展示非法文件
    const initialFiles = toValue(options.initialFiles)
    const selectedFiles = ref<File[]>(initialFiles ? initialFiles.filter(isFileValid) : [])

    function validateFileSize(file: File): boolean {
        const max = toValue(options.maxSize)
        if (max === undefined) return true
        return file.size <= max
    }

    function matchesAccept(file: File): boolean {
        const acceptStr = toValue(options.accept)
        if (acceptStr === undefined || acceptStr === '') return true
        const tokens = acceptStr
            .split(',')
            .map((token) => token.trim().toLowerCase())
            .filter(Boolean)
        if (tokens.length === 0) return true
        const fileType = file.type.toLowerCase()
        const fileName = file.name.toLowerCase()
        return tokens.some((token) => {
            if (token.startsWith('.')) return fileName.endsWith(token)
            // HTML 规范的通配 MIME 类型：接受任意文件类型（*/* 落到 endsWith('/*')
            // 分支会执行 fileType.startsWith('*') 恒为 false，全部误拒绝，需特判）
            if (token === '*/*') return true
            if (token.endsWith('/*')) return fileType.startsWith(token.slice(0, -1))
            return fileType === token
        })
    }

    function isFileValid(file: File): boolean {
        return validateFileSize(file) && matchesAccept(file)
    }

    function filterValidFiles(files: File[]): File[] {
        return files.filter(isFileValid)
    }

    function addFiles(files: FileList | File[]): File[] {
        const isMultiple = toValue(options.multiple) ?? true
        const valid = filterValidFiles(Array.from(files))
        // 多选模式按 name+size+lastModified 标识去重：handleFileChange 已重置 input.value，
        // 同一文件可再次触发 change 事件，不去重会导致列表出现重复项
        const toAdd = isMultiple
            ? valid.filter(
                (file) => !selectedFiles.value.some(
                    (item) => file.name === item.name
                        && file.size === item.size
                        && file.lastModified === item.lastModified,
                ),
            )
            : valid.slice(0, 1)
        if (isMultiple) {
            selectedFiles.value.push(...toAdd)
        } else if (toAdd.length > 0) {
            selectedFiles.value = toAdd
        }
        return toAdd
    }

    function removeFile(file: File): void {
        const rawTarget = toRaw(file)
        const index = selectedFiles.value.findIndex((item) => toRaw(item) === rawTarget)
        if (index > -1) selectedFiles.value.splice(index, 1)
    }

    function clearFiles(): void {
        selectedFiles.value = []
    }

    function handleFileChange(event: Event): File[] {
        const target = event.target
        if (!(target instanceof HTMLInputElement)) return []
        const added = addFiles(target.files ?? [])
        target.value = ''
        return added
    }

    return {
        selectedFiles: readonly(selectedFiles),
        validateFileSize,
        matchesAccept,
        isFileValid,
        filterValidFiles,
        addFiles,
        removeFile,
        clearFiles,
        handleFileChange,
    }
}
