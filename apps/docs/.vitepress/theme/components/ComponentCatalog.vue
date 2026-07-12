<script setup lang="ts">
import { computed } from 'vue'
import { getComponentCatalog, type CatalogLocale } from '../lib/component-catalog'
import { useI18n } from '../lib/i18n'

const props = defineProps<{
    locale?: CatalogLocale
}>()

const { isEn, t } = useI18n()
const effectiveLocale = computed<CatalogLocale>(() => props.locale ?? (isEn.value ? 'en' : 'zh'))
const sections = computed(() => getComponentCatalog(effectiveLocale.value))

function getStatusText(status: string | undefined, replacement: string | undefined): string {
    if (!status || status === 'stable') return ''
    return replacement ? `${status} -> ${replacement}` : status
}
</script>

<template>
    <div class="component-catalog vp-raw">
        <section
            v-for="section in sections"
            :key="section.key"
            class="component-catalog__section"
        >
            <h2>{{ section.title }}</h2>
            <table>
                <thead>
                    <tr>
                        <th>{{ t('catalogComponent') }}</th>
                        <th>{{ t('catalogDescription') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in section.items" :key="item.name">
                        <td>
                            <a :href="item.href">{{ item.title }}</a>
                            <span v-if="getStatusText(item.status, item.replacement)" class="component-catalog__status">
                                {{ getStatusText(item.status, item.replacement) }}
                            </span>
                        </td>
                        <td>{{ item.description }}</td>
                    </tr>
                </tbody>
            </table>
        </section>
    </div>
</template>

<style scoped>
.component-catalog__section {
    margin-top: 2rem;
}

.component-catalog__status {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.05rem 0.35rem;
    border: 2px solid var(--brutal-border-color, #000);
    background: var(--brutal-muted, #f4f4f5);
    color: var(--brutal-muted-foreground, #52525b);
    font-size: 0.72rem;
    font-weight: 800;
    vertical-align: middle;
}
</style>
