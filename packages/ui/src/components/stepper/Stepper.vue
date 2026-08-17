<script setup lang="ts">
import { computed } from 'vue';
import { Check } from '@lucide/vue';
import { cn } from '@/lib/utils';
import {
    stepperDotVariants,
    stepperConnectorVariants,
    stepperStepLabelVariants,
    type StepperStepStatus,
    type StepperDotVariantProps,
} from './stepper-variants';
import { useLocale } from '@/composables/useLocale';
import type { StepperStep } from './types';

export type { StepperStep };

const MIN_VERTICAL_CONNECTOR_HEIGHT = '2rem'

interface StepperProps {
    steps: StepperStep[];
    modelValue: number; // 0-indexed current step
    orientation?: 'horizontal' | 'vertical';
    size?: NonNullable<StepperDotVariantProps['size']>;
    variant?: NonNullable<StepperDotVariantProps['variant']>;
    clickable?: boolean;
    class?: string;
}

const props = withDefaults(defineProps<StepperProps>(), {
    orientation: 'horizontal',
    size: 'default',
    variant: 'default',
    clickable: true,
    class: undefined,
});

const { t } = useLocale();

const emit = defineEmits<{
    'update:modelValue': [step: number];
    'step-click': [index: number];
}>();

const totalSteps = computed(() => props.steps.length)
// 激活步骤索引：对 modelValue 做越界钳制，避免 steps 动态变化（如缩减）后索引越界，
// 状态判定与导航均基于钳制后的值，防止全部判为 completed 或 emit 越界值
const currentStep = computed(() => {
    if (totalSteps.value === 0) return -1
    return Math.min(Math.max(props.modelValue, 0), totalSteps.value - 1)
})
// 空 steps 时（totalSteps===0）currentStep 为 -1，须显式加 totalSteps>0 守卫，
// 使 isFirstStep/isLastStep 对称地均为 false（空步无首末之分），修复原先 isLastStep 为 true、
// isFirstStep 为 false 的不对称判定。真正拦截空 steps 导航由 nextStep/previousStep 内的
// totalSteps===0 守卫承担——否则两侧 flag 均为 false 时，!isFirstStep/!isLastStep 反而判真，
// 会让 previousStep/nextStep 绕过拦截 emit 越界值
const isFirstStep = computed(() => totalSteps.value > 0 && currentStep.value === 0)
const isLastStep = computed(() => totalSteps.value > 0 && currentStep.value === totalSteps.value - 1)

// --stepper-dot-size 语义为圆点边长（直径）：sm w-6=1.5rem、default w-8=2rem、lg w-10=2.5rem，
// 连接线 calc 中 var(--stepper-dot-size)/2 即取半径作圆心偏移
const dotSizeCss = computed(() => {
    switch (props.size) {
        case 'sm': return '1.5rem'
        case 'lg': return '2.5rem'
        default: return '2rem'
    }
})

function goToStep(index: number) {
    if (index >= 0 && index < totalSteps.value) {
        emit('update:modelValue', index)
    }
}

function nextStep() {
    // 空 steps 时 currentStep 为 -1，直接 emit(+1) 会发出 0 越界值，需先按总步数拦截
    if (totalSteps.value === 0) return
    if (!isLastStep.value) {
        emit('update:modelValue', currentStep.value + 1)
    }
}

function previousStep() {
    // 空 steps 时 currentStep 为 -1，直接 emit(-1) 会发出 -2 越界值，需先按总步数拦截
    if (totalSteps.value === 0) return
    if (!isFirstStep.value) {
        emit('update:modelValue', currentStep.value - 1)
    }
}

defineExpose({
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    previousStep,
    isFirstStep,
    isLastStep,
})

function getState(index: number): StepperStepStatus {
    if (index < currentStep.value) return 'completed';
    if (index === currentStep.value) return 'active';
    return 'upcoming';
}

function clickStep(index: number) {
    if (!props.clickable) return;
    emit('update:modelValue', index);
    emit('step-click', index);
}

function handleStepKeydown(event: KeyboardEvent) {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.tagName !== 'BUTTON') return

    const container = target.closest('[role="list"]')
    if (!container) return

    const buttons = Array.from(container.querySelectorAll<HTMLElement>('[data-step-button]'))
    const currentIndex = buttons.indexOf(target)
    if (currentIndex === -1) return

    let nextIndex: number | null = null
    switch (event.key) {
        case 'ArrowRight':
            if (props.orientation === 'horizontal') {
                nextIndex = currentIndex + 1
            }
            break
        case 'ArrowDown':
            if (props.orientation === 'vertical') {
                nextIndex = currentIndex + 1
            }
            break
        case 'ArrowLeft':
            if (props.orientation === 'horizontal') {
                nextIndex = currentIndex - 1
            }
            break
        case 'ArrowUp':
            if (props.orientation === 'vertical') {
                nextIndex = currentIndex - 1
            }
            break
        case 'Home':
            nextIndex = 0
            break
        case 'End':
            nextIndex = buttons.length - 1
            break
    }

    if (nextIndex !== null && nextIndex >= 0 && nextIndex < buttons.length) {
        event.preventDefault()
        buttons[nextIndex].focus()
    }
}

const rootClass = computed(() =>
    cn(
        props.orientation === 'horizontal'
            ? 'flex flex-row items-start w-full'
            : 'flex flex-col gap-0',
        props.class
    )
);

const stepWrapClasses = computed(() =>
    cn(
        props.orientation === 'horizontal'
            ? 'flex flex-col items-center flex-1 min-w-0'
            : 'flex flex-row items-start gap-3'
    )
)

const stepStates = computed(() =>
    props.steps.map((_, i) => getState(i))
)

function getDotClasses(state: StepperStepStatus) {
    const variant = state === 'active' ? props.variant : undefined
    return cn(
        stepperDotVariants({ state, size: props.size, variant }),
        props.clickable ? 'cursor-pointer' : 'pointer-events-none'
    )
}

const connectorCompletedClasses = computed(() =>
    cn(stepperConnectorVariants({ orientation: props.orientation, completed: true }))
)

const connectorIncompleteClasses = computed(() =>
    cn(stepperConnectorVariants({ orientation: props.orientation, completed: false }))
)

const labelStateClasses = computed(() =>
    stepStates.value.map((state) => stepperStepLabelVariants({ state }))
)

const dotClasses = computed(() =>
    stepStates.value.map((state) => getDotClasses(state))
)

const connectorClasses = computed(() =>
    stepStates.value.map((state) =>
        state === 'completed' ? connectorCompletedClasses.value : connectorIncompleteClasses.value
    )
)
</script>

<template>
    <div :class="rootClass" role="list" :aria-label="t('stepper.progressSteps')" :aria-orientation="orientation" @keydown="handleStepKeydown">
        <template v-for="(step, index) in steps" :key="step.id">
            <!-- Step Item -->
            <div
                :class="stepWrapClasses"
                role="listitem"
                :aria-current="index === currentStep ? 'step' : undefined"
            >
                <!-- Horizontal: dot row with connectors -->
                <div
                    v-if="orientation === 'horizontal'"
                    class="flex items-center w-full"
                >
                    <!-- Dot -->
                    <button
                        :class="dotClasses[index]"
                        type="button"
                        data-step-button
                        :disabled="!clickable"
                        :aria-label="t('stepper.step', { index: index + 1, title: step.title })"
                        @click="clickStep(index)"
                    >
                        <Check v-if="stepStates[index] === 'completed'" class="w-4 h-4" />
                        <span v-else>{{ index + 1 }}</span>
                    </button>

                    <!-- Right connector (not for last) -->
                    <div
                        v-if="index < steps.length - 1"
                        :class="connectorClasses[index]"
                    />
                </div>

                <!-- Horizontal: label below dot -->
                <div
                    v-if="orientation === 'horizontal'"
                    class="mt-2 text-center px-1"
                    :class="labelStateClasses[index]"
                >
                    <p class="text-xs font-black tracking-wide truncate">
{{ step.title }}
</p>
                    <p v-if="step.description" class="text-xs font-medium opacity-60 mt-0.5 truncate">
                        {{ step.description }}
                    </p>
                </div>

                <!-- Vertical layout -->
                <template v-if="orientation === 'vertical'">
                    <!-- --stepper-dot-size 设在圆点与连接线的共同祖先上，连接线（兄弟节点）才能读取该 CSS 变量 -->
                    <div class="flex flex-col items-center" :style="{ '--stepper-dot-size': dotSizeCss }">
                        <!-- Dot -->
                        <button
                            :class="dotClasses[index]"
                            type="button"
                            data-step-button
                            :disabled="!clickable"
                            :aria-label="t('stepper.step', { index: index + 1, title: step.title })"
                            @click="clickStep(index)"
                        >
                            <Check v-if="stepStates[index] === 'completed'" class="w-4 h-4" />
                            <span v-else>{{ index + 1 }}</span>
                        </button>
                        <!-- Vertical connector below dot -->
                        <div
                            v-if="index < steps.length - 1"
                            :class="connectorClasses[index]"
                            :style="{ minHeight: MIN_VERTICAL_CONNECTOR_HEIGHT }"
                        />
                    </div>

                    <!-- Label right of dot -->
                    <div
                        class="pb-6 min-w-0 flex-1"
                        :class="labelStateClasses[index]"
                    >
                        <p class="text-sm font-black tracking-wide">
{{ step.title }}
</p>
                        <p v-if="step.description" class="text-xs font-medium opacity-60 mt-0.5">
                            {{ step.description }}
                        </p>
                        <!-- Content slot for active vertical step -->
                        <div v-if="index === currentStep" class="mt-3">
                            <slot :name="`step-${step.id}`" />
                        </div>
                    </div>
                </template>
            </div>
        </template>
    </div>
</template>
