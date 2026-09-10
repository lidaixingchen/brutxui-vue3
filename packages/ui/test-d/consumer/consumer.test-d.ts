import { describe, it, expectTypeOf } from 'vitest'
import {
    Button,
    buttonVariants,
    Badge,
    DataTable,
    dataTableRootVariants,
    Form,
    FormField,
    Select,
    selectTriggerVariants,
    useDialog,
    useToast,
    useMessage,
    useLocale,
    zhCN,
    en,
    cn,
} from 'brutx-ui-vue'
import type {
    DataTableColumn,
    DataTableProps,
    SelectOption,
    SelectProps,
} from 'brutx-ui-vue'

// Subpath imports verification
import { Button as SubButton, buttonVariants as subButtonVariants } from 'brutx-ui-vue/button'
import { DataTable as SubDataTable, dataTableRootVariants as subDataTableVariants } from 'brutx-ui-vue/data-table'
import { Form as SubForm } from 'brutx-ui-vue/form'
import { Select as SubSelect } from 'brutx-ui-vue/select'
import { useLocale as subUseLocale } from 'brutx-ui-vue/useLocale'

interface TestItem {
    id: string
    title: string
    count: number
}

describe('isolated consumer contract - root exports', () => {
    it('components are not any', () => {
        expectTypeOf(Button).not.toBeAny()
        expectTypeOf(Badge).not.toBeAny()
        expectTypeOf(DataTable).not.toBeAny()
        expectTypeOf(Form).not.toBeAny()
        expectTypeOf(FormField).not.toBeAny()
        expectTypeOf(Select).not.toBeAny()
    })

    it('variants are functions and not any', () => {
        expectTypeOf(buttonVariants).toBeFunction()
        expectTypeOf(buttonVariants).not.toBeAny()
        expectTypeOf(dataTableRootVariants).toBeFunction()
        expectTypeOf(selectTriggerVariants).toBeFunction()
    })

    it('composables and utilities are not any', () => {
        expectTypeOf(useDialog).toBeFunction()
        expectTypeOf(useToast).toBeFunction()
        expectTypeOf(useMessage).toBeFunction()
        expectTypeOf(useLocale).toBeFunction()
        expectTypeOf(cn).toBeFunction()
        expectTypeOf(zhCN).not.toBeAny()
        expectTypeOf(en).not.toBeAny()
    })

    it('exported types are strictly typed', () => {
        const col: DataTableColumn<TestItem> = {
            id: 'title',
            header: 'Title',
            accessorKey: 'title',
        }
        expectTypeOf(col.id).toEqualTypeOf<string>()

        const props: DataTableProps<TestItem> = {
            data: [{ id: '1', title: 'A', count: 10 }],
            columns: [col],
            rowKey: 'id',
        }
        expectTypeOf(props.data).toEqualTypeOf<TestItem[]>()

        const opt: SelectOption = {
            label: 'Option 1',
            value: 'opt1',
        }
        expectTypeOf(opt.value).toEqualTypeOf<string>()

        const selectProps: SelectProps = {
            options: [opt],
            size: 'sm',
        }
        expectTypeOf(selectProps.size).toEqualTypeOf<'sm' | 'default' | 'lg' | undefined>()
    })

    it('prevents any degradation with ts-expect-error', () => {
        // @ts-expect-error - invalid variant name should be rejected by TypeScript
        buttonVariants({ variant: 'completely-nonexistent-variant' })

        // @ts-expect-error - invalid size should be rejected
        buttonVariants({ size: 'huge-size' })
    })
})

describe('isolated consumer contract - subpath exports', () => {
    it('subpath component exports are not any', () => {
        expectTypeOf(SubButton).not.toBeAny()
        expectTypeOf(subButtonVariants).toBeFunction()
        expectTypeOf(SubDataTable).not.toBeAny()
        expectTypeOf(subDataTableVariants).toBeFunction()
        expectTypeOf(SubForm).not.toBeAny()
        expectTypeOf(SubSelect).not.toBeAny()
        expectTypeOf(subUseLocale).toBeFunction()
    })
})
