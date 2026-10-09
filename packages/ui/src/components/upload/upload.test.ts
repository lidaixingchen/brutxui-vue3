import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { zhCN } from '@/locales'
import Upload from './Upload.vue'
import UploadFileItem from './UploadFileItem.vue'
import UploadFileList from './UploadFileList.vue'
import UploadTrigger from './UploadTrigger.vue'
import type { UploadError, UploadFile, UploadRequestOptions } from './upload-types'

type UploadListType = 'text' | 'picture' | 'picture-card'
const LATE_PROGRESS_PERCENT: number = 80

interface UploadExposed {
    handleFileSelect: (files: FileList | File[]) => Promise<void>
    handleFileRemove: (file: UploadFile) => Promise<void>
    retryUpload: (file: UploadFile) => Promise<void>
}

interface UploadTriggerSlotProps {
    selectFiles: (files: FileList | File[]) => Promise<void>
    drag: boolean
    multiple: boolean
    accept: string | undefined
}

interface UploadFileListSlotProps {
    files: UploadFile[]
    listType: UploadListType
    remove: (file: UploadFile) => Promise<void>
    retry: (file: UploadFile) => Promise<void>
}

function getExposed(wrapper: VueWrapper): UploadExposed {
    return wrapper.vm as unknown as UploadExposed
}

function createUploadSlots() {
    return {
        trigger: (slot: UploadTriggerSlotProps) => h(UploadTrigger, {
            accept: slot.accept,
            drag: slot.drag,
            multiple: slot.multiple,
            onSelect: (files: File[]) => slot.selectFiles(files),
        }),
        'file-list': (slot: UploadFileListSlotProps) => h(UploadFileList, {
            files: slot.files,
            listType: slot.listType,
            onRemove: (file: UploadFile) => slot.remove(file),
            onRetry: (file: UploadFile) => slot.retry(file),
        }),
    }
}

function createFile(name: string, type: string): File {
    return new File(['content'], name, { type })
}

describe('Upload', () => {
    it('rejects files that do not match accept before adding them', async () => {
        const onError = vi.fn<(error: UploadError, file: UploadFile) => void>()
        const wrapper = mount(Upload, {
            props: {
                accept: 'image/*',
                autoUpload: false,
                onError,
            },
        })

        await getExposed(wrapper).handleFileSelect([
            createFile('notes.txt', 'text/plain'),
            createFile('photo.png', 'image/png'),
        ])

        const emitted = wrapper.emitted('update:fileList')
        expect(emitted).toBeTruthy()
        const files = emitted![0][0] as UploadFile[]
        expect(files).toHaveLength(1)
        expect(files[0].name).toBe('photo.png')
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0][1].name).toBe('notes.txt')
    })

    it('marks an uploading file as canceled when removed', async () => {
        const uploadingFile: UploadFile = {
            id: 'f1',
            name: 'photo.png',
            size: 1024,
            type: 'image/png',
            status: 'uploading',
            progress: 42,
        }
        const wrapper = mount(Upload, {
            props: {
                fileList: [uploadingFile],
                autoUpload: false,
            },
        })

        await getExposed(wrapper).handleFileRemove(uploadingFile)

        expect(uploadingFile.status).toBe('canceled')

        const files = wrapper.emitted('update:fileList')!.at(-1)![0] as UploadFile[]
        expect(files.some(f => f.id === 'f1')).toBe(false)
    })

    it('handles limit quota individually without discarding valid files', async () => {
        const onError = vi.fn<(error: UploadError, file: UploadFile) => void>()
        const wrapper = mount(Upload, {
            props: {
                limit: 2,
                autoUpload: false,
                onError,
            },
        })

        await getExposed(wrapper).handleFileSelect([
            createFile('f1.txt', 'text/plain'),
            createFile('f2.txt', 'text/plain'),
            createFile('f3.txt', 'text/plain'),
        ])

        const emitted = wrapper.emitted('update:fileList')
        expect(emitted).toBeTruthy()
        const files = emitted!.at(-1)![0] as UploadFile[]
        expect(files).toHaveLength(2)
        expect(files.map(f => f.name)).toEqual(['f1.txt', 'f2.txt'])
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0][1].name).toBe('f3.txt')
    })

    it('uploads files concurrently when autoUpload is true', async () => {
        const activeUploads: string[] = []
        let maxConcurrent = 0
        interface PendingUpload {
            resolve: () => void
        }
        const pendingUploads = new Map<string, PendingUpload>()

        const httpRequest = vi.fn((options: UploadRequestOptions): Promise<void> => new Promise<void>((resolve) => {
            activeUploads.push(options.file.name)
            maxConcurrent = Math.max(maxConcurrent, activeUploads.length)
            pendingUploads.set(options.file.name, {
                resolve: () => {
                    activeUploads.splice(activeUploads.indexOf(options.file.name), 1)
                    options.onSuccess({ ok: true })
                    resolve()
                },
            })
        }))

        const wrapper = mount(Upload, {
            props: {
                autoUpload: true,
                httpRequest,
            },
        })

        const selectionPromise = getExposed(wrapper).handleFileSelect([
            createFile('f1.txt', 'text/plain'),
            createFile('f2.txt', 'text/plain'),
        ])

        await flushPromises()

        expect(httpRequest).toHaveBeenCalledTimes(2)
        expect(maxConcurrent).toBe(2)

        for (const pendingUpload of pendingUploads.values()) {
            pendingUpload.resolve()
        }
        await selectionPromise
    })

    it('provides feedback when retry exceeds maxRetries', async () => {
        const onError = vi.fn<(error: UploadError, file: UploadFile) => void>()
        const wrapper = mount(Upload, {
            props: {
                maxRetries: 2,
                autoUpload: false,
                onError,
            },
        })

        const failedFile: UploadFile = {
            id: 'failed-1',
            name: 'f.txt',
            size: 100,
            type: 'text/plain',
            status: 'error',
            progress: 0,
            retryCount: 2,
        }

        await getExposed(wrapper).retryUpload(failedFile)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0][0].message).toContain('已达到最大重试次数')
        expect(wrapper.emitted('file-error')).toBeTruthy()
    })

    it('cleans up abortController when upload completes or errors', async () => {
        let savedOptions: Pick<UploadRequestOptions, 'onSuccess'> | null = null
        const httpRequest = vi.fn(async (options: UploadRequestOptions): Promise<void> => {
            savedOptions = options
        })

        const wrapper = mount(Upload, {
            props: {
                autoUpload: true,
                httpRequest,
            },
        })

        await getExposed(wrapper).handleFileSelect([createFile('f.txt', 'text/plain')])
        const files = wrapper.emitted('update:fileList')![0][0] as UploadFile[]
        const file = files[0]

        expect(file.status).toBe('uploading')
        expect(file.abortController).toBeDefined()

        savedOptions!.onSuccess({ ok: true })
        expect(file.status).toBe('success')
        expect(file.abortController).toBeUndefined()
    })

    it('preserves uploading status when external fileList updates', async () => {
        let savedOptions: Pick<UploadRequestOptions, 'onSuccess' | 'signal'> | null = null
        const httpRequest = vi.fn(async (options: UploadRequestOptions): Promise<void> => {
            savedOptions = options
        })

        const wrapper = mount(Upload, {
            props: {
                autoUpload: true,
                httpRequest,
            },
        })

        await getExposed(wrapper).handleFileSelect([createFile('sync.txt', 'text/plain')])
        const files = wrapper.emitted('update:fileList')![0][0] as UploadFile[]
        const file = files[0]
        expect(file.status).toBe('uploading')

        // 外部父组件传入旧状态数组
        await wrapper.setProps({
            fileList: [{ ...file, status: 'ready' }],
        })

        expect(file.status).toBe('uploading')
        expect(file.abortController).toBeDefined()
        expect(savedOptions!.signal.aborted).toBe(false)

        savedOptions!.onSuccess({ ok: true })
        expect(file.status).toBe('success')
    })

    it('aborts an active request when the controlled fileList removes it', async (): Promise<void> => {
        let savedOptions: UploadRequestOptions | undefined
        let rejectRequest!: (reason: Error) => void
        const onError: (error: UploadError, file: UploadFile) => void = vi.fn()
        const httpRequest: (options: UploadRequestOptions) => Promise<void> = vi.fn((options: UploadRequestOptions): Promise<void> => new Promise<void>((_resolve: (value: void | PromiseLike<void>) => void, reject: (reason?: unknown) => void): void => {
            savedOptions = options
            rejectRequest = reject
        }))
        const wrapper: VueWrapper = mount(Upload, {
            props: {
                fileList: [],
                httpRequest,
                onError,
            },
        })

        const selectionPromise: Promise<void> = getExposed(wrapper).handleFileSelect([createFile('controlled.txt', 'text/plain')])
        await flushPromises()
        const selectedFiles: UploadFile[] = wrapper.emitted('update:fileList')![0][0] as UploadFile[]
        const file: UploadFile = selectedFiles[0]
        expect(savedOptions!.signal.aborted).toBe(false)

        await wrapper.setProps({ fileList: selectedFiles })
        expect(savedOptions!.signal.aborted).toBe(false)

        await wrapper.setProps({ fileList: [] })
        expect(savedOptions!.signal.aborted).toBe(true)
        expect(file.status).toBe('canceled')

        savedOptions!.onProgress(LATE_PROGRESS_PERCENT)
        savedOptions!.onSuccess({ ok: true })
        savedOptions!.onError({ message: 'late failure' })
        rejectRequest(new Error('late rejection'))
        await selectionPromise

        expect(file.progress).toBe(0)
        expect(file.status).toBe('canceled')
        expect(wrapper.emitted('file-success')).toBeUndefined()
        expect(wrapper.emitted('file-error')).toBeUndefined()
        expect(onError).not.toHaveBeenCalled()
    })

    it('keeps a newer same-id request active when an older request settles late', async (): Promise<void> => {
        const savedOptions: UploadRequestOptions[] = []
        const rejectRequests: Array<(reason: Error) => void> = []
        const resolveRequests: Array<() => void> = []
        const httpRequest: (options: UploadRequestOptions) => Promise<void> = vi.fn((options: UploadRequestOptions): Promise<void> => new Promise<void>((resolve: (value: void | PromiseLike<void>) => void, reject: (reason?: unknown) => void): void => {
            savedOptions.push(options)
            rejectRequests.push(reject)
            resolveRequests.push(resolve)
        }))
        const onError: (error: UploadError, file: UploadFile) => void = vi.fn()
        const wrapper: VueWrapper = mount(Upload, { props: { httpRequest, onError } })

        const selectionPromise: Promise<void> = getExposed(wrapper).handleFileSelect([createFile('retry-same-id.txt', 'text/plain')])
        await flushPromises()
        const file: UploadFile = (wrapper.emitted('update:fileList')![0][0] as UploadFile[])[0]
        const firstOptions: UploadRequestOptions = savedOptions[0]

        const retryPromise: Promise<void> = getExposed(wrapper).retryUpload(file)
        await flushPromises()
        const secondOptions: UploadRequestOptions = savedOptions[1]

        expect(firstOptions.signal.aborted).toBe(true)
        expect(secondOptions.signal.aborted).toBe(false)
        firstOptions.onSuccess({ ok: true })
        firstOptions.onError({ message: 'late failure' })
        rejectRequests[0](new Error('late rejection'))
        await selectionPromise

        expect(file.status).toBe('uploading')
        expect(file.abortController?.signal).toBe(secondOptions.signal)
        expect(wrapper.emitted('file-success')).toBeUndefined()
        expect(wrapper.emitted('file-error')).toBeUndefined()
        expect(onError).not.toHaveBeenCalled()

        secondOptions.onSuccess({ ok: true })
        resolveRequests[1]()
        await retryPromise

        expect(file.status).toBe('success')
        expect(file.abortController).toBeUndefined()
        expect(wrapper.emitted('file-success')).toHaveLength(1)
    })

    it('connects real input and drop events to the parent file list', async () => {
        const wrapper = mount(Upload, {
            props: { autoUpload: false },
            slots: createUploadSlots(),
        })
        const trigger = wrapper.findComponent(UploadTrigger)
        const input = trigger.get('input[type="file"]')
        const inputFile = createFile('input.txt', 'text/plain')
        const droppedFile = createFile('dropped.txt', 'text/plain')

        Object.defineProperty(input.element, 'files', {
            configurable: true,
            value: [inputFile],
        })
        await input.trigger('change')
        await flushPromises()

        const fileList = wrapper.findComponent(UploadFileList)
        expect(fileList.findAllComponents(UploadFileItem)).toHaveLength(1)
        expect(fileList.text()).toContain('input.txt')
        expect(wrapper.emitted('file-change')).toHaveLength(1)

        await trigger.get('[role="button"]').trigger('drop', {
            dataTransfer: { files: [droppedFile] },
        })
        await flushPromises()

        expect(fileList.findAllComponents(UploadFileItem)).toHaveLength(2)
        expect(fileList.text()).toContain('dropped.txt')
        expect(wrapper.emitted('file-change')).toHaveLength(2)
        expect(wrapper.emitted('update:fileList')!.at(-1)![0]).toHaveLength(2)
    })

    it('removes a selected file through the localized action button', async () => {
        const wrapper = mount(Upload, {
            props: { autoUpload: false },
            slots: createUploadSlots(),
        })
        const trigger = wrapper.findComponent(UploadTrigger)
        const input = trigger.get('input[type="file"]')
        const file = createFile('remove.txt', 'text/plain')

        Object.defineProperty(input.element, 'files', {
            configurable: true,
            value: [file],
        })
        await input.trigger('change')
        await flushPromises()

        await wrapper.get(`button[aria-label="${zhCN.upload.deleteFile}"]`).trigger('click')
        await flushPromises()

        expect(wrapper.findComponent(UploadFileItem).exists()).toBe(false)
        expect(wrapper.emitted('file-remove')).toHaveLength(1)
        expect(wrapper.emitted('update:fileList')!.at(-1)![0]).toEqual([])
    })

    it('retries a failed upload through the localized action button', async () => {
        let requestCount = 0
        const httpRequest = vi.fn(async (options: UploadRequestOptions): Promise<void> => {
            requestCount += 1
            if (requestCount === 1) {
                options.onError({ message: 'first failure' })
                return
            }
            options.onSuccess({ ok: true })
        })
        const wrapper = mount(Upload, {
            props: { autoUpload: true, httpRequest },
            slots: createUploadSlots(),
        })
        const input = wrapper.findComponent(UploadTrigger).get('input[type="file"]')
        const file = createFile('retry.txt', 'text/plain')

        Object.defineProperty(input.element, 'files', {
            configurable: true,
            value: [file],
        })
        await input.trigger('change')
        await flushPromises()

        expect(httpRequest).toHaveBeenCalledTimes(1)
        expect(wrapper.emitted('file-error')).toHaveLength(1)
        expect(wrapper.find(`button[aria-label="${zhCN.upload.retryUpload}"]`).exists()).toBe(true)

        await wrapper.get(`button[aria-label="${zhCN.upload.retryUpload}"]`).trigger('click')
        await flushPromises()

        expect(httpRequest).toHaveBeenCalledTimes(2)
        expect(wrapper.emitted('file-success')).toHaveLength(1)
        expect(wrapper.text()).toContain('[ UPLOADED ]')
        expect(wrapper.find(`button[aria-label="${zhCN.upload.retryUpload}"]`).exists()).toBe(false)
    })

    it('does not add or upload a file when beforeUpload resolves after unmount', async () => {
        let resolveBeforeUpload!: (allowed: boolean) => void
        let renderedFiles: UploadFile[] = []
        const beforeUpload = vi.fn((_file: File): Promise<boolean> => new Promise<boolean>((resolve) => {
            resolveBeforeUpload = resolve
        }))
        const httpRequest = vi.fn(async (_options: UploadRequestOptions): Promise<void> => {})
        const wrapper = mount(Upload, {
            props: { beforeUpload, httpRequest },
            slots: {
                'file-list': (slot: UploadFileListSlotProps) => {
                    renderedFiles = slot.files
                    return h('div')
                },
            },
        })

        const selectionPromise = getExposed(wrapper).handleFileSelect([createFile('pending.txt', 'text/plain')])
        await flushPromises()
        expect(beforeUpload).toHaveBeenCalledTimes(1)

        wrapper.unmount()
        resolveBeforeUpload(true)
        await selectionPromise

        expect(wrapper.emitted('update:fileList')).toBeUndefined()
        expect(wrapper.emitted('file-change')).toBeUndefined()
        expect(renderedFiles).toHaveLength(0)
        expect(httpRequest).not.toHaveBeenCalled()
    })

    it('aborts an active request and ignores its callbacks after unmount', async () => {
        let savedOptions: UploadRequestOptions | undefined
        let resolveRequest!: () => void
        const httpRequest = vi.fn((options: UploadRequestOptions): Promise<void> => new Promise<void>((resolve) => {
            savedOptions = options
            resolveRequest = resolve
        }))
        const wrapper = mount(Upload, { props: { httpRequest } })

        const selectionPromise = getExposed(wrapper).handleFileSelect([createFile('active.txt', 'text/plain')])
        await flushPromises()
        expect(httpRequest).toHaveBeenCalledTimes(1)

        wrapper.unmount()
        expect(savedOptions!.signal.aborted).toBe(true)
        savedOptions!.onSuccess({ ok: true })
        resolveRequest()
        await selectionPromise

        expect(wrapper.emitted('file-success')).toBeUndefined()
        expect(wrapper.emitted('file-error')).toBeUndefined()
    })

    it('does not remove a file when beforeRemove resolves after unmount', async () => {
        let resolveBeforeRemove!: (allowed: boolean) => void
        const beforeRemove = vi.fn((_file: UploadFile): Promise<boolean> => new Promise<boolean>((resolve) => {
            resolveBeforeRemove = resolve
        }))
        const file: UploadFile = {
            id: 'pending-remove',
            name: 'pending-remove.txt',
            size: 100,
            type: 'text/plain',
            status: 'uploading',
            progress: 0,
            abortController: new AbortController(),
        }
        const wrapper = mount(Upload, {
            props: { beforeRemove, fileList: [file], autoUpload: false },
        })

        const removePromise = getExposed(wrapper).handleFileRemove(file)
        await flushPromises()
        expect(beforeRemove).toHaveBeenCalledTimes(1)

        wrapper.unmount()
        resolveBeforeRemove(true)
        await removePromise

        expect(wrapper.emitted('update:fileList')).toBeUndefined()
        expect(wrapper.emitted('file-remove')).toBeUndefined()
        expect(file.status).toBe('uploading')
    })

    it('does not retry a file after unmount', async () => {
        const httpRequest = vi.fn(async (_options: UploadRequestOptions): Promise<void> => {})
        const onError = vi.fn<(error: UploadError, file: UploadFile) => void>()
        const wrapper = mount(Upload, {
            props: { autoUpload: false, httpRequest, maxRetries: 0, onError },
        })
        const file: UploadFile = {
            id: 'retry-after-unmount',
            name: 'retry.txt',
            size: 100,
            type: 'text/plain',
            status: 'error',
            progress: 0,
        }

        wrapper.unmount()
        await getExposed(wrapper).retryUpload(file)

        expect(file.retryCount).toBeUndefined()
        expect(onError).not.toHaveBeenCalled()
        expect(wrapper.emitted('file-error')).toBeUndefined()
        expect(httpRequest).not.toHaveBeenCalled()
    })
})
