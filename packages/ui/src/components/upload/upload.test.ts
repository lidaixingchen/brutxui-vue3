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

        savedOptions!.onSuccess({ ok: true })
        expect(file.status).toBe('success')
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
})
