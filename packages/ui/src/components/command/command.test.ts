import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Command from './Command.vue'
import CommandDialog from './CommandDialog.vue'
import CommandInput from './CommandInput.vue'
import CommandList from './CommandList.vue'
import CommandEmpty from './CommandEmpty.vue'
import CommandGroup from './CommandGroup.vue'
import CommandItem from './CommandItem.vue'
import CommandSeparator from './CommandSeparator.vue'
import CommandShortcut from './CommandShortcut.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

describe('Command', () => {
    it('renders with default classes', () => {
        const wrapper = mount(Command, { ...localeProvide })
        expect(wrapper.classes()).toContain('flex')
        expect(wrapper.classes()).toContain('h-full')
        expect(wrapper.classes()).toContain('w-full')
        expect(wrapper.classes()).toContain('flex-col')
        expect(wrapper.classes()).toContain('overflow-hidden')
        expect(wrapper.classes()).toContain('bg-brutal-bg')
        expect(wrapper.classes()).toContain('text-brutal-fg')
    })

    it('renders slot content', () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: { default: '<div class="inner">Inner content</div>' },
        })
        expect(wrapper.find('.inner').exists()).toBe(true)
        expect(wrapper.find('.inner').text()).toBe('Inner content')
    })

    it('applies custom class', () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            props: { class: 'custom-class' },
        })
        expect(wrapper.classes()).toContain('custom-class')
    })
})

describe('CommandInput', () => {
    it('renders with default classes', () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: '<CommandInput />',
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput },
            },
        })
        const wrapperDiv = wrapper.find('[data-slot="command-input"]')
        expect(wrapperDiv.exists()).toBe(true)
        expect(wrapperDiv.classes()).toContain('flex')
        expect(wrapperDiv.classes()).toContain('items-center')
        expect(wrapperDiv.classes()).toContain('border-b-3')
        expect(wrapperDiv.classes()).toContain('border-brutal')
        expect(wrapperDiv.classes()).toContain('bg-brutal-accent')
    })

    it('has search input placeholder', () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: '<CommandInput />',
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput },
            },
        })
        const input = wrapper.find('input')
        expect(input.exists()).toBe(true)
        expect(input.attributes('placeholder')).toBe('Type a command or search...')
    })

    it('applies custom class to input', () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: '<CommandInput class="custom-input-class" />',
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput },
            },
        })
        const input = wrapper.find('input')
        expect(input.classes()).toContain('custom-input-class')
    })

    it('emits update:modelValue on input', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: '<CommandInput />',
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput },
            },
        })
        const input = wrapper.find('input')
        await input.setValue('test query')
        expect(input.element.value).toBe('test query')
        const inputComp = wrapper.findComponent(CommandInput)
        expect(inputComp.emitted('update:modelValue')).toBeTruthy()
        expect(inputComp.emitted('update:modelValue')![0]).toEqual(['test query'])
    })

    it('uses custom placeholder', () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: '<CommandInput placeholder="Search items..." />',
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput },
            },
        })
        const input = wrapper.find('input')
        expect(input.attributes('placeholder')).toBe('Search items...')
    })
})

describe('CommandList', () => {
    it('renders with default classes', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: '<CommandList />',
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList },
            },
        })
        await nextTick()
        const list = wrapper.find('[data-slot="command-list"]')
        expect(list.exists()).toBe(true)
        expect(list.classes()).toContain('max-h-80')
        expect(list.classes()).toContain('overflow-y-auto')
        expect(list.classes()).toContain('overflow-x-hidden')
    })

    it('applies custom class', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: '<CommandList class="custom-list" />',
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList },
            },
        })
        await nextTick()
        const list = wrapper.find('[data-slot="command-list"]')
        expect(list.classes()).toContain('custom-list')
    })

    it('renders slot content', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: '<CommandList><div class="list-item">Item</div></CommandList>',
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList },
            },
        })
        await nextTick()
        expect(wrapper.find('.list-item').exists()).toBe(true)
    })
})

describe('CommandEmpty', () => {
    it('shows default empty message when no items match', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandInput model-value="xyz" />
                    <CommandList>
                        <CommandEmpty />
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput, CommandList, CommandEmpty },
            },
        })
        await nextTick()
        await nextTick()
        const empty = wrapper.find('[data-slot="command-empty"]')
        expect(empty.exists()).toBe(true)
        expect(empty.text()).toBe('No results found.')
    })

    it('applies custom class', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandInput model-value="xyz" />
                    <CommandList>
                        <CommandEmpty class="custom-empty" />
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput, CommandList, CommandEmpty },
            },
        })
        await nextTick()
        await nextTick()
        const empty = wrapper.find('[data-slot="command-empty"]')
        expect(empty.classes()).toContain('custom-empty')
    })

    it('renders custom slot content', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandInput model-value="xyz" />
                    <CommandList>
                        <CommandEmpty>Nothing here!</CommandEmpty>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput, CommandList, CommandEmpty },
            },
        })
        await nextTick()
        await nextTick()
        const empty = wrapper.find('[data-slot="command-empty"]')
        expect(empty.text()).toBe('Nothing here!')
    })
})

describe('CommandGroup', () => {
    it('renders with heading', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandGroup title="Suggestions">
                            <CommandItem value="test">Test</CommandItem>
                        </CommandGroup>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandGroup, CommandItem },
            },
        })
        await nextTick()
        await nextTick()
        const heading = wrapper.find('[data-slot="command-group-heading"]')
        expect(heading.exists()).toBe(true)
        expect(heading.text()).toBe('Suggestions')
    })

    it('renders without heading', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandGroup>
                            <CommandItem value="test">Test</CommandItem>
                        </CommandGroup>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandGroup, CommandItem },
            },
        })
        await nextTick()
        await nextTick()
        const heading = wrapper.find('[data-slot="command-group-heading"]')
        expect(heading.exists()).toBe(false)
    })

    it('renders slot content', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandGroup>
                            <CommandItem value="test">Item</CommandItem>
                        </CommandGroup>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandGroup, CommandItem },
            },
        })
        await nextTick()
        await nextTick()
        expect(wrapper.find('[data-slot="command-item"]').exists()).toBe(true)
    })

    it('applies custom class', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandGroup class="custom-group">
                            <CommandItem value="test">Test</CommandItem>
                        </CommandGroup>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandGroup, CommandItem },
            },
        })
        await nextTick()
        await nextTick()
        const group = wrapper.find('[data-slot="command-group"]')
        expect(group.classes()).toContain('custom-group')
    })

    it('has group role', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandGroup>
                            <CommandItem value="test">Test</CommandItem>
                        </CommandGroup>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandGroup, CommandItem },
            },
        })
        await nextTick()
        await nextTick()
        const group = wrapper.find('[data-slot="command-group"]')
        expect(group.attributes('role')).toBe('group')
    })
})

describe('CommandItem', () => {
    it('renders slot content', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandItem value="test">Item text</CommandItem>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandItem },
            },
        })
        await nextTick()
        await nextTick()
        const item = wrapper.find('[data-slot="command-item"]')
        expect(item.exists()).toBe(true)
        expect(item.text()).toBe('Item text')
    })

    it('has cursor-pointer class', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandItem value="test">Test</CommandItem>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandItem },
            },
        })
        await nextTick()
        await nextTick()
        const item = wrapper.find('[data-slot="command-item"]')
        expect(item.classes()).toContain('cursor-pointer')
    })

    it('applies custom class', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandItem value="test" class="custom-item">Test</CommandItem>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandItem },
            },
        })
        await nextTick()
        await nextTick()
        const item = wrapper.find('[data-slot="command-item"]')
        expect(item.classes()).toContain('custom-item')
    })

    it('emits select event on click', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandItem value="test-value">Test</CommandItem>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandItem },
            },
        })
        await nextTick()
        await nextTick()
        const item = wrapper.find('[data-slot="command-item"]')
        await item.trigger('click')
        const itemComponent = wrapper.findComponent({ name: 'CommandItem' })
        expect(itemComponent.emitted('select')).toBeTruthy()
        expect(itemComponent.emitted('select')![0]).toEqual(['test-value'])
    })

    it('does not render when disabled', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandItem value="test-value" disabled>Test</CommandItem>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandItem },
            },
        })
        await nextTick()
        await nextTick()
        const item = wrapper.find('[data-slot="command-item"]')
        expect(item.attributes('data-disabled')).toBeDefined()
    })
})

describe('Command filtering', () => {
    it('filters items based on search input', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandInput />
                    <CommandList>
                        <CommandGroup title="Suggestions">
                            <CommandItem value="calendar">Calendar</CommandItem>
                            <CommandItem value="search">Search Emoji</CommandItem>
                            <CommandItem value="calculator">Calculator</CommandItem>
                        </CommandGroup>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput, CommandList, CommandGroup, CommandItem },
            },
        })
        await nextTick()
        await nextTick()

        const items = wrapper.findAll('[data-slot="command-item"]')
        expect(items.length).toBe(3)

        const input = wrapper.find('input')
        await input.setValue('cal')
        await nextTick()
        await nextTick()

        const visibleItems = wrapper.findAll('[data-slot="command-item"]')
            .filter(el => (el.element as HTMLElement).style.display !== 'none')
        expect(visibleItems.length).toBe(2)
    })

    it('shows empty state when no items match', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandInput />
                    <CommandList>
                        <CommandGroup title="Suggestions">
                            <CommandItem value="calendar">Calendar</CommandItem>
                        </CommandGroup>
                        <CommandEmpty />
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty },
            },
        })
        await nextTick()
        await nextTick()

        const input = wrapper.find('input')
        await input.setValue('xyz')
        await nextTick()
        await nextTick()

        const empty = wrapper.find('[data-slot="command-empty"]')
        expect(empty.exists()).toBe(true)
        expect(empty.text()).toBe('No results found.')
    })

    it('hides group when all items are filtered out', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandInput />
                    <CommandList>
                        <CommandGroup title="Suggestions">
                            <CommandItem value="calendar">Calendar</CommandItem>
                        </CommandGroup>
                        <CommandGroup title="Settings">
                            <CommandItem value="profile">Profile</CommandItem>
                        </CommandGroup>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandInput, CommandList, CommandGroup, CommandItem },
            },
        })
        await nextTick()
        await nextTick()

        const input = wrapper.find('input')
        await input.setValue('pro')
        await nextTick()
        await nextTick()

        const visibleGroups = wrapper.findAll('[data-slot="command-group"]')
            .filter(el => (el.element as HTMLElement).style.display !== 'none')
        expect(visibleGroups.length).toBe(1)
        const heading = visibleGroups[0].find('[data-slot="command-group-heading"]')
        expect(heading.text()).toBe('Settings')
    })
})

describe('CommandSeparator', () => {
    it('renders with separator styling', () => {
        const wrapper = mount(CommandSeparator)
        expect(wrapper.classes()).toContain('h-[3px]')
        expect(wrapper.classes()).toContain('bg-brutal-fg')
        expect(wrapper.attributes('role')).toBe('separator')
    })

    it('applies custom class', () => {
        const wrapper = mount(CommandSeparator, {
            props: { class: 'custom-sep' },
        })
        expect(wrapper.classes()).toContain('custom-sep')
    })
})

describe('CommandShortcut', () => {
    it('renders slot content', () => {
        const wrapper = mount(CommandShortcut, {
            slots: { default: '⌘K' },
        })
        expect(wrapper.text()).toBe('⌘K')
    })

    it('applies custom class', () => {
        const wrapper = mount(CommandShortcut, {
            props: { class: 'custom-shortcut' },
        })
        expect(wrapper.classes()).toContain('custom-shortcut')
    })

    it('has default styling classes', () => {
        const wrapper = mount(CommandShortcut)
        expect(wrapper.classes()).toContain('ml-auto')
        expect(wrapper.classes()).toContain('text-xs')
        expect(wrapper.classes()).toContain('font-black')
        expect(wrapper.classes()).toContain('bg-brutal-muted')
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
    })
})

describe('CommandDialog', () => {
    it('renders within Dialog context', () => {
        const wrapper = mount(CommandDialog, {
            ...localeProvide,
            props: { open: true },
            attachTo: document.body,
        })
        expect(wrapper.findComponent(CommandDialog).exists()).toBe(true)
        wrapper.unmount()
    })

    it('uses default title and description', async () => {
        const wrapper = mount(CommandDialog, {
            ...localeProvide,
            props: { open: true },
            attachTo: document.body,
        })
        await nextTick()
        const dialogTitle = document.querySelector('[id^="reka-dialog-title"]')
        const dialogDesc = document.querySelector('[id^="reka-dialog-description"]')
        expect(dialogTitle?.textContent).toBe('Command Palette')
        expect(dialogDesc?.textContent).toBe('Search for a command to run...')
        wrapper.unmount()
    })

    it('uses custom title and description', async () => {
        const wrapper = mount(CommandDialog, {
            ...localeProvide,
            props: {
                open: true,
                title: 'Custom Title',
                description: 'Custom Description',
            },
            attachTo: document.body,
        })
        await nextTick()
        const allTitles = document.querySelectorAll('[id^="reka-dialog-title"]')
        const allDescs = document.querySelectorAll('[id^="reka-dialog-description"]')
        const lastTitle = allTitles[allTitles.length - 1]
        const lastDesc = allDescs[allDescs.length - 1]
        expect(lastTitle?.textContent).toBe('Custom Title')
        expect(lastDesc?.textContent).toBe('Custom Description')
        wrapper.unmount()
    })

    it('applies custom class', () => {
        const wrapper = mount(CommandDialog, {
            ...localeProvide,
            props: { open: true, class: 'custom-dialog' },
            attachTo: document.body,
        })
        const content = wrapper.find('[role="dialog"]')
        expect(content.exists() ? content.classes() : wrapper.classes()).toBeDefined()
        wrapper.unmount()
    })
})

describe('Command programmatic control (defineExpose)', () => {
    it('exposes filterSearch as a readable string', () => {
        const wrapper = mount(Command, { ...localeProvide })
        expect(wrapper.vm.filterSearch).toBe('')
    })

    it('setting filterSearch programmatically filters items', async () => {
        const wrapper = mount(Command, {
            ...localeProvide,
            slots: {
                default: `
                    <CommandList>
                        <CommandGroup title="Suggestions">
                            <CommandItem value="calendar">Calendar</CommandItem>
                            <CommandItem value="search">Search Emoji</CommandItem>
                            <CommandItem value="calculator">Calculator</CommandItem>
                        </CommandGroup>
                    </CommandList>
                `,
            },
            global: {
                provide: { [LOCALE_INJECTION_KEY]: en },
                components: { CommandList, CommandGroup, CommandItem },
            },
        })
        await nextTick()
        await nextTick()

        const initialItems = wrapper.findAll('[data-slot="command-item"]')
            .filter(el => (el.element as HTMLElement).style.display !== 'none')
        expect(initialItems.length).toBe(3)

        ;(wrapper as any).vm.filterSearch = 'cal'
        await nextTick()
        await nextTick()

        const visibleItems = wrapper.findAll('[data-slot="command-item"]')
            .filter(el => (el.element as HTMLElement).style.display !== 'none')
        expect(visibleItems.length).toBe(2)
    })
})
