import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ComponentPreview from './components/ComponentPreview.vue'
import CopyButton from './components/CopyButton.vue'
import CodeBlock from './components/CodeBlock.vue'
import InstallationTabs from './components/InstallationTabs.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import Logo from './components/Logo.vue'
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
    },
} satisfies Theme
