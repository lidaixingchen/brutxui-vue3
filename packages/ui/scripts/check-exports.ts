/**
 * CI verification: ensure package.json exports is in sync with exports-manifest.json.
 *
 * Delegates to generate-exports.ts with `--check` flag (diff-only, no write).
 * Exits with code 1 if package.json exports is stale — CI gate forces
 * `pnpm prebuild:exports` to be run before commit.
 *
 * Usage: tsx scripts/check-exports.ts
 */
import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Resolve tsx binary from node_modules (works in pnpm workspace)
const tsxBin = resolve(__dirname, '..', 'node_modules', '.bin', 'tsx')

const result = spawnSync(
    tsxBin,
    [resolve(__dirname, 'generate-exports.ts'), '--check'],
    {
        stdio: 'inherit',
        shell: process.platform === 'win32',
    },
)

process.exit(result.status ?? 1)
