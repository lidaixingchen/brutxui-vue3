import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ComponentPreview from './components/ComponentPreview.vue'
import CopyButton from './components/CopyButton.vue'
import CodeBlock from './components/CodeBlock.vue'
import InstallationTabs from './components/InstallationTabs.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import Logo from './components/Logo.vue'
import AlertDemo from './components/demos/AlertDemo.vue'
import AlertDialogDemo from './components/demos/AlertDialogDemo.vue'
import AvatarDemo from './components/demos/AvatarDemo.vue'
import BadgeDemo from './components/demos/BadgeDemo.vue'
import ButtonDemo from './components/demos/ButtonDemo.vue'
import CalendarDemo from './components/demos/CalendarDemo.vue'
import CardDemo from './components/demos/CardDemo.vue'
import CheckboxDemo from './components/demos/CheckboxDemo.vue'
import ComboboxDemo from './components/demos/ComboboxDemo.vue'
import CommandDemo from './components/demos/CommandDemo.vue'
import DashboardStatsDemo from './components/demos/DashboardStatsDemo.vue'
import DialogDemo from './components/demos/DialogDemo.vue'
import DropdownMenuDemo from './components/demos/DropdownMenuDemo.vue'
import FormDemo from './components/demos/FormDemo.vue'
import InputDemo from './components/demos/InputDemo.vue'
import LabelDemo from './components/demos/LabelDemo.vue'
import PaginationDemo from './components/demos/PaginationDemo.vue'
import PopoverDemo from './components/demos/PopoverDemo.vue'
import ProgressDemo from './components/demos/ProgressDemo.vue'
import RadioGroupDemo from './components/demos/RadioGroupDemo.vue'
import SaaSPricingDemo from './components/demos/SaaSPricingDemo.vue'
import ScrollAreaDemo from './components/demos/ScrollAreaDemo.vue'
import SelectDemo from './components/demos/SelectDemo.vue'
import SeparatorDemo from './components/demos/SeparatorDemo.vue'
import SheetDemo from './components/demos/SheetDemo.vue'
import SkeletonDemo from './components/demos/SkeletonDemo.vue'
import SliderDemo from './components/demos/SliderDemo.vue'
import SpinnerDemo from './components/demos/SpinnerDemo.vue'
import SubmitButtonDemo from './components/demos/SubmitButtonDemo.vue'
import SwitchDemo from './components/demos/SwitchDemo.vue'
import TableDemo from './components/demos/TableDemo.vue'
import TabsDemo from './components/demos/TabsDemo.vue'
import TextareaDemo from './components/demos/TextareaDemo.vue'
import ToastDemo from './components/demos/ToastDemo.vue'
import ToggleDemo from './components/demos/ToggleDemo.vue'
import ToggleGroupDemo from './components/demos/ToggleGroupDemo.vue'
import TooltipDemo from './components/demos/TooltipDemo.vue'
import AccordionDemo from './components/demos/AccordionDemo.vue'
import TagsInputDemo from './components/demos/TagsInputDemo.vue'
import NumberInputDemo from './components/demos/NumberInputDemo.vue'
import CopyToClipboardDemo from './components/demos/CopyToClipboardDemo.vue'
import BreadcrumbDemo from './components/demos/BreadcrumbDemo.vue'
import MarqueeDemo from './components/demos/MarqueeDemo.vue'
import BeforeAfterDemo from './components/demos/BeforeAfterDemo.vue'
import CodeBlockDemo from './components/demos/CodeBlockDemo.vue'
import TimelineDemo from './components/demos/TimelineDemo.vue'
import CarouselDemo from './components/demos/CarouselDemo.vue'
import TreeViewDemo from './components/demos/TreeViewDemo.vue'
import KanbanBoardDemo from './components/demos/KanbanBoardDemo.vue'
import ChatBubbleDemo from './components/demos/ChatBubbleDemo.vue'
import KbdDemo from './components/demos/KbdDemo.vue'
import CounterDemo from './components/demos/CounterDemo.vue'
import StepperDemo from './components/demos/StepperDemo.vue'
import Card3DDemo from './components/demos/Card3DDemo.vue'
import GlitchTextDemo from './components/demos/GlitchTextDemo.vue'
import ScratchCardDemo from './components/demos/ScratchCardDemo.vue'
import SketchyChartDemo from './components/demos/SketchyChartDemo.vue'
import HardcoreInputDemo from './components/demos/HardcoreInputDemo.vue'
import './style.css'

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('ComponentPreview', ComponentPreview)
        app.component('CopyButton', CopyButton)
        app.component('CodeBlock', CodeBlock)
        app.component('InstallationTabs', InstallationTabs)
        app.component('ThemeToggle', ThemeToggle)
        app.component('Logo', Logo)
        app.component('AlertDemo', AlertDemo)
        app.component('AlertDialogDemo', AlertDialogDemo)
        app.component('AvatarDemo', AvatarDemo)
        app.component('BadgeDemo', BadgeDemo)
        app.component('ButtonDemo', ButtonDemo)
        app.component('CalendarDemo', CalendarDemo)
        app.component('CardDemo', CardDemo)
        app.component('CheckboxDemo', CheckboxDemo)
        app.component('ComboboxDemo', ComboboxDemo)
        app.component('CommandDemo', CommandDemo)
        app.component('DashboardStatsDemo', DashboardStatsDemo)
        app.component('DialogDemo', DialogDemo)
        app.component('DropdownMenuDemo', DropdownMenuDemo)
        app.component('FormDemo', FormDemo)
        app.component('InputDemo', InputDemo)
        app.component('LabelDemo', LabelDemo)
        app.component('PaginationDemo', PaginationDemo)
        app.component('PopoverDemo', PopoverDemo)
        app.component('ProgressDemo', ProgressDemo)
        app.component('RadioGroupDemo', RadioGroupDemo)
        app.component('SaaSPricingDemo', SaaSPricingDemo)
        app.component('ScrollAreaDemo', ScrollAreaDemo)
        app.component('SelectDemo', SelectDemo)
        app.component('SeparatorDemo', SeparatorDemo)
        app.component('SheetDemo', SheetDemo)
        app.component('SkeletonDemo', SkeletonDemo)
        app.component('SliderDemo', SliderDemo)
        app.component('SpinnerDemo', SpinnerDemo)
        app.component('SubmitButtonDemo', SubmitButtonDemo)
        app.component('SwitchDemo', SwitchDemo)
        app.component('TableDemo', TableDemo)
        app.component('TabsDemo', TabsDemo)
        app.component('TextareaDemo', TextareaDemo)
        app.component('ToastDemo', ToastDemo)
        app.component('ToggleDemo', ToggleDemo)
        app.component('ToggleGroupDemo', ToggleGroupDemo)
        app.component('TooltipDemo', TooltipDemo)
        app.component('AccordionDemo', AccordionDemo)
        app.component('TagsInputDemo', TagsInputDemo)
        app.component('NumberInputDemo', NumberInputDemo)
        app.component('CopyToClipboardDemo', CopyToClipboardDemo)
        app.component('BreadcrumbDemo', BreadcrumbDemo)
        app.component('MarqueeDemo', MarqueeDemo)
        app.component('BeforeAfterDemo', BeforeAfterDemo)
        app.component('CodeBlockDemo', CodeBlockDemo)
        app.component('TimelineDemo', TimelineDemo)
        app.component('CarouselDemo', CarouselDemo)
        app.component('TreeViewDemo', TreeViewDemo)
        app.component('KanbanBoardDemo', KanbanBoardDemo)
        app.component('ChatBubbleDemo', ChatBubbleDemo)
        app.component('KbdDemo', KbdDemo)
        app.component('CounterDemo', CounterDemo)
        app.component('StepperDemo', StepperDemo)
        app.component('Card3DDemo', Card3DDemo)
        app.component('GlitchTextDemo', GlitchTextDemo)
        app.component('ScratchCardDemo', ScratchCardDemo)
        app.component('SketchyChartDemo', SketchyChartDemo)
        app.component('HardcoreInputDemo', HardcoreInputDemo)
    },
} satisfies Theme
