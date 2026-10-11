import { createUiVitestConfig } from './vitest.config'

const config = createUiVitestConfig(['src/**/*.{test,spec}.{ts,tsx}'])

export default {
    ...config,
    test: {
        ...config.test,
        coverage: {
            ...config.test?.coverage,
            // 分片产生覆盖记录，汇总任务执行完整阈值。
            thresholds: undefined,
            reporter: [],
        },
    },
}
