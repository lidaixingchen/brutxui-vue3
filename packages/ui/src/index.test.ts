import { describe, expect, it } from 'vitest'
import {
    Calendar,
    Carousel,
    CarouselItem,
    CodeBlock,
    DatePicker,
    DatePickerRange,
    DateTimePicker,
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormWizard,
    MonthPicker,
    TimePicker,
    WeekPicker,
    YearPicker,
} from './index'

describe('main entry exports', () => {
    it('exports components that are also available from subpath entries', () => {
        expect([
            Calendar,
            DatePicker,
            DatePickerRange,
            DateTimePicker,
            TimePicker,
            WeekPicker,
            MonthPicker,
            YearPicker,
            Carousel,
            CarouselItem,
            CodeBlock,
            Form,
            FormField,
            FormItem,
            FormLabel,
            FormControl,
            FormDescription,
            FormMessage,
            FormWizard,
        ].every(Boolean)).toBe(true)
    })
})
