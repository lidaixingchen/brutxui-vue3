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
    </div>
</template>
