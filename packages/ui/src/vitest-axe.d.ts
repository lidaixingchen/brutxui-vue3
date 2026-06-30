import 'vitest-axe'
import 'vitest-axe/matchers'

declare module 'vitest-axe/matchers' {
    interface AxeMatchers {
        toHaveNoViolations(): void
    }
}

declare module 'vitest' {
    interface Assertion<T = any> {
        toHaveNoViolations(): void
    }
    interface AsymmetricMatchersContaining {
        toHaveNoViolations(): void
    }
}

// 扩展 Vitest 的 expect 类型
declare global {
    namespace Vi {
        interface Assertion<T = any> {
            toHaveNoViolations(): void
        }
        interface AsymmetricMatchersContaining {
            toHaveNoViolations(): void
        }
    }
}
