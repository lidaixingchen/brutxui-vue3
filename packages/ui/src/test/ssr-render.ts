import { renderToString } from '@vue/server-renderer'
import type { App } from 'vue'

export type SsrDiagnosticSource = 'vue' | 'console.warn' | 'console.error'

export interface SsrDiagnostic {
    source: SsrDiagnosticSource
    message: string
}

export interface SsrDiagnosticsOptions {
    allow?: (diagnostic: SsrDiagnostic) => boolean
}

function formatDiagnosticPart(value: unknown): string {
    if (value instanceof Error) return `${value.name}: ${value.message}`
    if (typeof value === 'string') return value
    try {
        return JSON.stringify(value) ?? String(value)
    } catch {
        return String(value)
    }
}

function formatDiagnosticParts(values: readonly unknown[]): string {
    return values.map(formatDiagnosticPart).join(' ')
}

function createDiagnosticError(diagnostics: readonly SsrDiagnostic[]): Error {
    const details = diagnostics
        .map(({ source, message }) => `${source}: ${message}`)
        .join('\n')
    return new Error(`Unexpected SSR diagnostic(s):\n${details}`)
}

export async function withSsrDiagnostics<T>(
    apps: readonly App[],
    render: () => Promise<T>,
    options: SsrDiagnosticsOptions = {},
): Promise<T> {
    const diagnostics: SsrDiagnostic[] = []
    const originalWarn = console.warn
    const originalError = console.error
    const previousWarnHandlers = apps.map((app) => app.config.warnHandler)

    console.warn = (...values: unknown[]) => {
        diagnostics.push({
            source: 'console.warn',
            message: formatDiagnosticParts(values),
        })
    }
    console.error = (...values: unknown[]) => {
        diagnostics.push({
            source: 'console.error',
            message: formatDiagnosticParts(values),
        })
    }

    apps.forEach((app) => {
        app.config.warnHandler = (message, _instance, trace) => {
            diagnostics.push({
                source: 'vue',
                message: trace ? `${message}\n${trace}` : message,
            })
        }
    })

    try {
        const result = await render()
        const unexpected = diagnostics.filter((diagnostic) => !options.allow?.(diagnostic))
        if (unexpected.length > 0) {
            throw createDiagnosticError(unexpected)
        }
        return result
    } finally {
        console.warn = originalWarn
        console.error = originalError
        apps.forEach((app, index) => {
            app.config.warnHandler = previousWarnHandlers[index]
        })
    }
}

export function renderToStringChecked(
    app: App,
    options?: SsrDiagnosticsOptions,
): Promise<string> {
    return withSsrDiagnostics([app], () => renderToString(app), options)
}
