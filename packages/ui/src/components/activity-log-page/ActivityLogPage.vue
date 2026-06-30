<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { cn } from '@/lib/utils'
import Table from '../table/Table.vue'
import TableHeader from '../table/TableHeader.vue'
import TableBody from '../table/TableBody.vue'
import TableRow from '../table/TableRow.vue'
import TableHead from '../table/TableHead.vue'
import TableCell from '../table/TableCell.vue'
import Badge from '../badge/Badge.vue'
import Pagination from '../pagination/Pagination.vue'
import type { ActivityEntry } from './types'

export type { ActivityEntry };

interface ActivityLogPageProps {
    title?: string
    activities?: ActivityEntry[]
    class?: string
}

const props = withDefaults(defineProps<ActivityLogPageProps>(), {
    title: undefined,
    activities: () => [],
    class: undefined,
})

const emit = defineEmits<{
    'entry-click': [id: string]
}>()

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('activityLogPage.defaultTitle'))
const resolvedAction = computed(() => t('activityLogPage.action'))
const resolvedUser = computed(() => t('activityLogPage.user'))
const resolvedTimestamp = computed(() => t('activityLogPage.timestamp'))
const resolvedDetails = computed(() => t('activityLogPage.details'))
const resolvedNoActivityFound = computed(() => t('activityLogPage.noActivityFound'))

const PAGE_SIZE = 10

const currentPage = ref(1)
watch(() => props.activities, () => {
    currentPage.value = 1
})
const totalPages = computed(() => Math.max(1, Math.ceil(props.activities.length / PAGE_SIZE)))

const paginatedActivities = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return props.activities.slice(start, start + PAGE_SIZE)
})

const typeVariantMap: Record<string, 'default' | 'accent' | 'danger' | 'success'> = {
    info: 'default',
    warning: 'accent',
    error: 'danger',
    success: 'success',
}

function getTypeBadgeVariant(type?: string): 'default' | 'accent' | 'danger' | 'success' {
    return typeVariantMap[type ?? 'info'] ?? 'default'
}

function handleEntryClick(id: string) {
    emit('entry-click', id)
}

function handlePageChange(page: number) {
    currentPage.value = page
}

const rootClasses = computed(() =>
    cn('min-h-screen bg-brutal-bg p-4 sm:p-8', props.class)
)
</script>

<template>
    <div :class="rootClasses">
        <div class="w-full max-w-4xl mx-auto">
            <slot name="header">
                <div class="mb-8">
                    <h1 class="text-3xl font-black tracking-tight">
                        {{ resolvedTitle }}
                    </h1>
                </div>
            </slot>

            <slot>
                <Table v-if="activities.length > 0">
                    <TableHeader>
                        <TableRow>
                            <TableHead>{{ resolvedAction }}</TableHead>
                            <TableHead>{{ resolvedUser }}</TableHead>
                            <TableHead>{{ resolvedTimestamp }}</TableHead>
                            <TableHead>{{ resolvedDetails }}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow
                            v-for="entry in paginatedActivities"
                            :key="entry.id"
                            tabindex="0"
                            class="cursor-pointer active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all"
                            @click="handleEntryClick(entry.id)"
                            @keydown.enter="handleEntryClick(entry.id)"
                        >
                            <TableCell>
                                <div class="flex items-center gap-2">
                                    <Badge :variant="getTypeBadgeVariant(entry.type)" size="sm">
                                        {{ entry.type ?? 'info' }}
                                    </Badge>
                                    <span class="font-bold">{{ entry.action }}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span class="font-medium">{{ entry.user }}</span>
                            </TableCell>
                            <TableCell>
                                <span class="font-medium">{{ entry.timestamp }}</span>
                            </TableCell>
                            <TableCell>
                                <span v-if="entry.details" class="font-medium">{{ entry.details }}</span>
                                <span v-else class="text-brutal-fg">—</span>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <div v-else class="text-center py-12">
                    <p class="text-lg font-bold text-brutal-fg">
                        {{ resolvedNoActivityFound }}
                    </p>
                </div>

                <div v-if="totalPages > 1" class="mt-8 flex justify-center">
                    <Pagination
                        :model-value="currentPage"
                        :total-pages="totalPages"
                        @update:model-value="handlePageChange"
                    />
                </div>
            </slot>

            <slot name="footer" />
        </div>
    </div>
</template>
