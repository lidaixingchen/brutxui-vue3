import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DOCS_SITE_ARTIFACT_NAME = 'docs-site'

const GITHUB_API_PAGE_SIZE = 100

export function isEligibleDocsWorkflowRun({
    repository,
    eventRepository,
    workflowRun,
    currentMainSha,
}) {
    return Boolean(
        workflowRun
        && eventRepository === repository
        && workflowRun.head_repository?.full_name === repository
        && workflowRun.event === 'push'
        && workflowRun.conclusion === 'success'
        && workflowRun.head_branch === 'main'
        && workflowRun.head_sha === currentMainSha,
    )
}

export function hasDocsSiteArtifact(artifacts) {
    if (!Array.isArray(artifacts)) throw new TypeError('产物清单必须是数组')
    return artifacts.some(artifact => artifact?.name === DOCS_SITE_ARTIFACT_NAME && !artifact.expired)
}

export function resolveDocsWorkflowRun({
    repository,
    eventRepository,
    workflowRun,
    currentMainSha,
    artifacts,
}) {
    if (!isEligibleDocsWorkflowRun({ repository, eventRepository, workflowRun, currentMainSha })) {
        return { deploy: false, reason: 'ineligible-workflow-run' }
    }
    if (!hasDocsSiteArtifact(artifacts)) {
        return { deploy: false, reason: 'docs-site-artifact-missing' }
    }
    return { deploy: true, reason: 'eligible', artifactName: DOCS_SITE_ARTIFACT_NAME }
}

function requireValue(value, label) {
    if (!value) throw new Error(`缺少 ${label}`)
    return value
}

export async function prepareDocsWorkflowRun({
    repository,
    eventRepository,
    workflowRun,
    token,
    runCommand = execFileSync,
}) {
    const basicEligibility = Boolean(
        workflowRun
        && eventRepository === repository
        && workflowRun.head_repository?.full_name === repository
        && workflowRun.event === 'push'
        && workflowRun.conclusion === 'success'
        && workflowRun.head_branch === 'main'
        && workflowRun.head_sha,
    )
    if (!basicEligibility) return { deploy: false, reason: 'ineligible-workflow-run' }

    const options = { encoding: 'utf8', env: { ...process.env, GH_TOKEN: token } }
    const repo = requireValue(repository, 'GITHUB_REPOSITORY')
    const currentMain = JSON.parse(runCommand('gh', ['api', `repos/${repo}/commits/main`], options))
    const currentMainSha = requireValue(currentMain.sha, 'main 分支当前提交 SHA')

    if (workflowRun.head_sha !== currentMainSha) {
        return { deploy: false, reason: 'workflow-run-is-not-current-main' }
    }

    const runId = requireValue(workflowRun.id, 'workflow_run.id')
    const pages = JSON.parse(runCommand('gh', [
        'api',
        `repos/${repo}/actions/runs/${runId}/artifacts?per_page=${GITHUB_API_PAGE_SIZE}`,
        '--paginate',
        '--slurp',
    ], options))
    const artifacts = pages.flatMap(page => page.artifacts)
    return resolveDocsWorkflowRun({
        repository: repo,
        eventRepository,
        workflowRun,
        currentMainSha,
        artifacts,
    })
}

function requireEnvironment(env, name) {
    return requireValue(env[name], name)
}

export async function runFromEnvironment(env = process.env, runCommand = execFileSync) {
    const event = JSON.parse(readFileSync(requireEnvironment(env, 'GITHUB_EVENT_PATH'), 'utf8'))
    const result = await prepareDocsWorkflowRun({
        repository: requireEnvironment(env, 'GITHUB_REPOSITORY'),
        eventRepository: event.repository?.full_name,
        workflowRun: event.workflow_run,
        token: requireEnvironment(env, 'GITHUB_TOKEN'),
        runCommand,
    })

    const output = requireEnvironment(env, 'GITHUB_OUTPUT')
    appendFileSync(output, `deploy=${result.deploy}\n`)
    appendFileSync(output, `artifact_name=${result.artifactName ?? ''}\n`)
    appendFileSync(output, `reason=${result.reason}\n`)
    console.log(`文档部署准备结果：${result.deploy ? 'deploy' : 'skip'}（${result.reason}）`)
    return result
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    runFromEnvironment().catch(error => {
        console.error(error)
        process.exitCode = 1
    })
}
