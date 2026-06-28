<script setup lang="ts">
import { CodeBlock } from 'brutx-ui-vue'

const jsCode = `const greeting = "Hello Brutalist Design!";
console.log(greeting);

function sum(a, b) {
    return a + b;
}`

const tsCode = `interface User {
    id: number
    name: string
    email: string
}

async function fetchUser(id: number): Promise<User> {
    const response = await fetch(\`/api/users/\${id}\`)
    return response.json()
}`

const pythonCode = `def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]

    sequence = [0, 1]
    for _ in range(2, n):
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

# Print first 10 Fibonacci numbers
print(fibonacci(10))`

const longCode = `function quickSort(arr) {
    if (arr.length <= 1) return arr
    const pivot = arr[0]
    const left = arr.slice(1).filter(x => x < pivot)
    const right = arr.slice(1).filter(x => x >= pivot)
    return [...quickSort(left), pivot, ...quickSort(right)]
}

const sorted = quickSort([3, 1, 4, 1, 5, 9, 2, 6])
console.log(sorted)`
</script>

<template>
    <div class="flex flex-col gap-8 w-full max-w-[560px]">
        <div>
            <p class="text-sm font-bold mb-2">JavaScript + 行号</p>
            <CodeBlock
                :code="jsCode"
                language="javascript"
                filename="app.js"
                show-line-numbers
            />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">TypeScript</p>
            <CodeBlock
                :code="tsCode"
                language="typescript"
                filename="user.ts"
            />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">Python + 行号</p>
            <CodeBlock
                :code="pythonCode"
                language="python"
                filename="fibonacci.py"
                show-line-numbers
            />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">折叠与展开（maxLines）</p>
            <CodeBlock
                :code="longCode"
                language="javascript"
                filename="quicksort.js"
                :max-lines="6"
                show-line-numbers
            />
        </div>
    </div>
</template>
