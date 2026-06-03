<script setup lang="ts">
import { CodeBlock } from 'brutx-ui-vue'

const jsCode = `const greeting = "Hello Brutalist Design!";
console.log(greeting);

function sum(a, b) {
    return a + b;
}`
</script>

<template>
    <div class="flex flex-col gap-8 w-full max-w-[500px]">
        <div>
            <p class="text-sm font-bold mb-2">显示行号 (showLineNumbers=true)</p>
            <CodeBlock
                :code="jsCode"
                language="javascript"
                filename="app.js"
                show-line-numbers
            />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">隐藏行号 (showLineNumbers=false)</p>
            <CodeBlock
                :code="jsCode"
                language="javascript"
                filename="app.js"
            />
        </div>
    </div>
</template>
