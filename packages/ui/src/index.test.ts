import { describe, expect, it } from 'vitest'
import {
    Calendar,
    Carousel,
    CarouselEnhanced,
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
    GallerySection,
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
            CarouselEnhanced,
            CarouselItem,
            GallerySection,
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
