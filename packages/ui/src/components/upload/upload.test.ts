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
})
