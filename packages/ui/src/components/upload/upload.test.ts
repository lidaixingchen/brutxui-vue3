import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Upload from './Upload.vue'
import type { UploadError, UploadFile } from './upload-types'

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

        await (wrapper.vm as unknown as {
            handleFileSelect: (files: File[]) => Promise<void>
        }).handleFileSelect([
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

        const vm = wrapper.vm as unknown as {
            handleFileRemove: (file: UploadFile) => Promise<void>
        }
        await vm.handleFileRemove(uploadingFile)

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

        const vm = wrapper.vm as unknown as {
            handleFileSelect: (files: File[]) => Promise<void>
        }

        await vm.handleFileSelect([
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

        const httpRequest = vi.fn(async ({ file, onSuccess }: { file: File; onSuccess: (res: unknown) => void }) => {
            activeUploads.push(file.name)
            maxConcurrent = Math.max(maxConcurrent, activeUploads.length)
            await new Promise(resolve => setTimeout(resolve, 20))
            activeUploads.splice(activeUploads.indexOf(file.name), 1)
            onSuccess({ ok: true })
        })

        const wrapper = mount(Upload, {
            props: {
                autoUpload: true,
                httpRequest,
            },
        })

        const vm = wrapper.vm as unknown as {
            handleFileSelect: (files: File[]) => Promise<void>
        }

        await vm.handleFileSelect([
            createFile('f1.txt', 'text/plain'),
            createFile('f2.txt', 'text/plain'),
        ])

        expect(httpRequest).toHaveBeenCalledTimes(2)
        expect(maxConcurrent).toBe(2)
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

        const vm = wrapper.vm as unknown as {
            retryUpload: (file: UploadFile) => Promise<void>
        }

        const failedFile: UploadFile = {
            id: 'failed-1',
            name: 'f.txt',
            size: 100,
            type: 'text/plain',
            status: 'error',
            progress: 0,
            retryCount: 2,
        }

        await vm.retryUpload(failedFile)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0][0].message).toContain('已达到最大重试次数')
        expect(wrapper.emitted('file-error')).toBeTruthy()
    })

    it('cleans up abortController when upload completes or errors', async () => {
        let savedOptions: { onSuccess: (res: unknown) => void } | null = null
        const httpRequest = vi.fn(async (options: { onSuccess: (res: unknown) => void }) => {
            savedOptions = options
        })

        const wrapper = mount(Upload, {
            props: {
                autoUpload: true,
                httpRequest,
            },
        })

        const vm = wrapper.vm as unknown as {
            handleFileSelect: (files: File[]) => Promise<void>
        }

        await vm.handleFileSelect([createFile('f.txt', 'text/plain')])
        const files = wrapper.emitted('update:fileList')![0][0] as UploadFile[]
        const file = files[0]

        expect(file.status).toBe('uploading')
        expect(file.abortController).toBeDefined()

        savedOptions!.onSuccess({ ok: true })
        expect(file.status).toBe('success')
        expect(file.abortController).toBeUndefined()
    })

    it('preserves uploading status when external fileList updates', async () => {
        let savedOptions: { onSuccess: (res: unknown) => void } | null = null
        const httpRequest = vi.fn(async (options: { onSuccess: (res: unknown) => void }) => {
            savedOptions = options
        })

        const wrapper = mount(Upload, {
            props: {
                autoUpload: true,
                httpRequest,
            },
        })

        const vm = wrapper.vm as unknown as {
            handleFileSelect: (files: File[]) => Promise<void>
        }

        await vm.handleFileSelect([createFile('sync.txt', 'text/plain')])
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
})


