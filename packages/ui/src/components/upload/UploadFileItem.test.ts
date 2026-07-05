import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import UploadFileItem from './UploadFileItem.vue'
import type { UploadFile } from './index'

function createImageFile(name = 'a.png', size = 100): File {
    return new File([new ArrayBuffer(size)], name, { type: 'image/png' })
}

function createUploadFile(overrides: Partial<UploadFile> = {}): UploadFile {
    return {
        id: 'file-1',
        name: 'a.png',
        size: 100,
        type: 'image/png',
        status: 'ready',
        progress: 0,
        raw: createImageFile(),
        ...overrides,
    }
}

describe('UploadFileItem previewUrl object URL lifecycle', () => {
    let createSpy: ReturnType<typeof vi.spyOn>
    let revokeSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
        revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    })

    afterEach(() => {
        createSpy.mockRestore()
        revokeSpy.mockRestore()
    })

    it('creates an object URL when raw image is present and no explicit url', async () => {
        const wrapper = mount(UploadFileItem, {
            props: { file: createUploadFile(), listType: 'picture' },
        })
        await nextTick()
        expect(createSpy).toHaveBeenCalledTimes(1)
        expect(wrapper.find('img').attributes('src')).toBe('blob:mock-url')
        wrapper.unmount()
    })

    it('revokes object URL on unmount', async () => {
        const wrapper = mount(UploadFileItem, {
            props: { file: createUploadFile(), listType: 'picture' },
        })
        await nextTick()
        expect(createSpy).toHaveBeenCalledTimes(1)
        wrapper.unmount()
        expect(revokeSpy).toHaveBeenCalledTimes(1)
        expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url')
    })

    it('revokes object URL when file.url is set after raw preview', async () => {
        const file = createUploadFile()
        const wrapper = mount(UploadFileItem, {
            props: { file, listType: 'picture' },
        })
        await nextTick()
        expect(createSpy).toHaveBeenCalledTimes(1)
        expect(revokeSpy).not.toHaveBeenCalled()

        await wrapper.setProps({ file: { ...file, url: 'https://cdn/x.png' } })
        await nextTick()

        expect(revokeSpy).toHaveBeenCalledTimes(1)
        expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url')
        expect(wrapper.find('img').attributes('src')).toBe('https://cdn/x.png')
        wrapper.unmount()
    })

    it('revokes object URL when file type changes away from image', async () => {
        const file = createUploadFile()
        const wrapper = mount(UploadFileItem, {
            props: { file, listType: 'picture' },
        })
        await nextTick()
        expect(createSpy).toHaveBeenCalledTimes(1)

        await wrapper.setProps({ file: { ...file, type: 'text/plain', raw: new File([new ArrayBuffer(1)], 'a.txt', { type: 'text/plain' }) } })
        await nextTick()

        expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url')
        wrapper.unmount()
    })

    it('revokes previous object URL when raw changes', async () => {
        const file = createUploadFile()
        const wrapper = mount(UploadFileItem, {
            props: { file, listType: 'picture' },
        })
        await nextTick()
        expect(createSpy).toHaveBeenCalledTimes(1)

        createSpy.mockReturnValue('blob:mock-url-2')
        await wrapper.setProps({ file: { ...file, raw: createImageFile('b.png') } })
        await nextTick()

        expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url')
        expect(createSpy).toHaveBeenCalledTimes(2)
        wrapper.unmount()
    })

    it('does not create object URL for non-image files', async () => {
        const wrapper = mount(UploadFileItem, {
            props: {
                file: createUploadFile({
                    type: 'text/plain',
                    raw: new File([new ArrayBuffer(1)], 'a.txt', { type: 'text/plain' }),
                }),
                listType: 'picture',
            },
        })
        await nextTick()
        expect(createSpy).not.toHaveBeenCalled()
        expect(wrapper.find('img').exists()).toBe(false)
        wrapper.unmount()
    })
})
