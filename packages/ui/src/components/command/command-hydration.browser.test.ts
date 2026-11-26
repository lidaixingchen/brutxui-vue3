import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createSSRApp, defineComponent, h, nextTick, onMounted, onUnmounted, ref, type App } from 'vue'
import Command from './Command.vue'
import CommandEmpty from './CommandEmpty.vue'
import CommandGroup from './CommandGroup.vue'
import CommandInput from './CommandInput.vue'
import CommandItem from './CommandItem.vue'
import CommandList from './CommandList.vue'

describe('Command SSR hydration', () => {
    let host: HTMLElement | undefined
    let app: App | undefined

    afterEach(() => {
        app?.unmount()
        host?.remove()
        app = undefined
        host = undefined
        vi.restoreAllMocks()
    })

    it.each([
        { query: '', visibleOnServer: true },
        { query: '设置', visibleOnServer: false },
    ])('hydrates grouped commands with query "$query"', async ({ query, visibleOnServer }) => {
        const selected: string[] = []
        let mounts = 0
        let unmounts = 0
        const labelId = 'command-hydration-label'
        const labelSelector = '#' + labelId
        const CustomLabel = defineComponent({
            setup() {
                onMounted(() => mounts++)
                onUnmounted(() => unmounts++)
                return () => h('span', { id: labelId }, '设置')
            },
        })
        const Root = defineComponent({
            setup() {
                const search = ref(query)
                return () => h(Command, {}, () => [
                    h(CommandInput, { modelValue: search.value, 'onUpdate:modelValue': value => { search.value = value } }),
                    h(CommandList, {}, () => [
                        h(CommandGroup, { title: '系统' }, () => [
                            h(CommandItem, { value: 'settings', onSelect: value => selected.push(value) }, () => h(CustomLabel)),
                        ]),
                        h(CommandEmpty),
                    ]),
                ])
            },
        })

        const serverHtml = await renderToString(createSSRApp(Root))
        host = document.body.appendChild(document.createElement('div'))
        host.innerHTML = serverHtml
        const serverLabel = host.querySelector(labelSelector)
        expect(serverLabel?.textContent).toBe('设置')
        expect(host.querySelectorAll(labelSelector)).toHaveLength(1)
        const option = page.getByRole('option', { name: '设置', exact: true })
        if (visibleOnServer)
            await expect.element(option).toBeVisible()
        else
            await expect.element(option).not.toBeInTheDocument()
        expect(mounts).toBe(0)

        const warning = vi.fn()
        const consoleError = vi.spyOn(console, 'error')
        app = createSSRApp(Root)
        app.config.warnHandler = warning
        app.mount(host)

        await expect.element(option).toBeVisible()
        expect(host.querySelector(labelSelector)).toBe(serverLabel)
        expect(host.querySelectorAll(labelSelector)).toHaveLength(1)
        expect(mounts).toBe(1)
        expect(unmounts).toBe(0)
        expect(warning).not.toHaveBeenCalled()
        expect(consoleError).not.toHaveBeenCalled()

        const input = host.querySelector<HTMLInputElement>('[role="searchbox"]')!
        input.focus()
        await userEvent.keyboard('{ArrowDown}{Enter}')
        expect(input.getAttribute('aria-activedescendant')).toBe(host.querySelector('[role="option"]')?.id)
        expect(selected).toEqual(['settings'])

        await userEvent.clear(input)
        host.firstElementChild?.dispatchEvent(new PointerEvent('pointerleave'))
        await userEvent.type(input, '偏好')
        await expect.element(option).not.toBeInTheDocument()
        expect(input.hasAttribute('aria-activedescendant')).toBe(false)
        await userEvent.keyboard('{ArrowDown}{Enter}')
        expect(selected).toEqual(['settings'])

        host.querySelector<HTMLElement>('[role="listbox"]')?.focus()
        await nextTick()
        expect(input.hasAttribute('aria-activedescendant')).toBe(false)

        await userEvent.clear(input)
        await expect.element(option).toBeVisible()
        expect(host.querySelector(labelSelector)).toBe(serverLabel)
        expect(mounts).toBe(1)
        expect(unmounts).toBe(0)
        expect(warning).not.toHaveBeenCalled()
        expect(consoleError).not.toHaveBeenCalled()
    })
})
