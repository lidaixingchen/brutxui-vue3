import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import type { Component } from 'vue';
import Layout from './Layout.vue';
import ComponentPreview from './components/ComponentPreview.vue';
import ComponentCatalog from './components/ComponentCatalog.vue';
import CopyButton from './components/CopyButton.vue';
import HomeCodePreview from './components/HomeCodePreview.vue';
import HomeComponentShowcase from './components/HomeComponentShowcase.vue';
import HomeStats from './components/HomeStats.vue';
import InstallationTabs from './components/InstallationTabs.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import ThemePlayground from './components/ThemePlayground.vue';
import Logo from './components/Logo.vue';
import TranslationBanner from './components/TranslationBanner.vue';
import 'v-calendar/style.css';
import './style.css';

// 批量动态扫描注册全部 demo 组件（Vite 静态分析，支持 SSR 构建与开发态）
const demoModules = import.meta.glob<{ default: Component }>(
    './components/demos/*.vue',
    { eager: true }
);

const GLOBAL_COMPONENTS: Record<string, Component> = {
    ComponentPreview,
    ComponentCatalog,
    CopyButton,
    HomeCodePreview,
    HomeComponentShowcase,
    HomeStats,
    InstallationTabs,
    ThemeToggle,
    ThemePlayground,
    Logo,
    TranslationBanner,
};

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }) {
        // 注册全局框架组件
        for (const [name, component] of Object.entries(GLOBAL_COMPONENTS)) {
            app.component(name, component);
        }

        // 自动注册全部 Demo 组件（按文件名作为组件名，如 AlertDemo.vue -> AlertDemo）
        for (const [filePath, mod] of Object.entries(demoModules)) {
            const componentName = filePath.split('/').pop()?.replace(/\.vue$/, '');
            if (!componentName || !mod.default) continue;
            if (!componentName.endsWith('Demo') || GLOBAL_COMPONENTS[componentName]) {
                console.warn(`[theme] 跳过非 Demo 命名或与框架组件重名的文件: ${filePath}`);
                continue;
            }
            app.component(componentName, mod.default);
        }
    },
} satisfies Theme;
