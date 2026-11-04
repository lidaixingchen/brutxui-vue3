import assert from 'node:assert/strict'
import test from 'node:test'
import {
    DOCS_SITE_ARTIFACT_NAME,
    hasDocsSiteArtifact,
    isEligibleDocsWorkflowRun,
    prepareDocsWorkflowRun,
    resolveDocsWorkflowRun,
} from './docs-deployment.mjs'

const repository = 'example-org/brutxui-vue3'
const mainSha = 'a'.repeat(40)
const successfulMainPush = {
    id: 4815,
    event: 'push',
    conclusion: 'success',
    head_branch: 'main',
    head_sha: mainSha,
    head_repository: { full_name: repository },
}

test('allows only a successful current main push from the same repository', () => {
    assert.equal(isEligibleDocsWorkflowRun({
        repository,
        eventRepository: repository,
        workflowRun: successfulMainPush,
        currentMainSha: mainSha,
    }), true)

    const ineligibleRuns = [
        { ...successfulMainPush, conclusion: 'failure' },
        { ...successfulMainPush, event: 'pull_request' },
        { ...successfulMainPush, head_sha: 'b'.repeat(40) },
        { ...successfulMainPush, head_repository: { full_name: 'fork/brutxui-vue3' } },
        { ...successfulMainPush, head_branch: 'feature/docs' },
    ]

    for (const workflowRun of ineligibleRuns) {
        assert.equal(isEligibleDocsWorkflowRun({
            repository,
            eventRepository: repository,
            workflowRun,
            currentMainSha: mainSha,
        }), false)
    }
    assert.equal(isEligibleDocsWorkflowRun({
        repository,
        eventRepository: 'fork/brutxui-vue3',
        workflowRun: successfulMainPush,
        currentMainSha: mainSha,
    }), false)
})

test('skips successful current main runs when the docs artifact is absent or expired', () => {
    assert.equal(hasDocsSiteArtifact([]), false)
    assert.equal(hasDocsSiteArtifact([{ name: DOCS_SITE_ARTIFACT_NAME, expired: true }]), false)

    assert.deepEqual(resolveDocsWorkflowRun({
        repository,
        eventRepository: repository,
        workflowRun: successfulMainPush,
        currentMainSha: mainSha,
        artifacts: [{ name: 'other-artifact', expired: false }],
    }), { deploy: false, reason: 'docs-site-artifact-missing' })
})

test('binds artifact discovery to the completed CI workflow run ID', async () => {
    const requests = []
    const result = await prepareDocsWorkflowRun({
        repository,
        eventRepository: repository,
        workflowRun: successfulMainPush,
        token: 'token',
        runCommand: (program, args, options) => {
            requests.push({ program, args, options })
            if (args[1].endsWith('/commits/main')) return JSON.stringify({ sha: mainSha })
            return JSON.stringify([
                { artifacts: [{ name: 'coverage', expired: false }] },
                { artifacts: [{ name: DOCS_SITE_ARTIFACT_NAME, expired: false }] },
            ])
        },
    })

    assert.deepEqual(result, { deploy: true, reason: 'eligible', artifactName: DOCS_SITE_ARTIFACT_NAME })
    assert.equal(requests.length, 2)
    assert.equal(requests[1].program, 'gh')
    assert.match(requests[1].args[1], new RegExp(`/actions/runs/${successfulMainPush.id}/artifacts\\?`))
    assert.ok(requests[1].args.includes('--paginate'))
    assert.equal(requests[1].options.env.GH_TOKEN, 'token')
})

test('skips failed and pull request workflow runs before querying artifacts', async () => {
    for (const workflowRun of [
        { ...successfulMainPush, conclusion: 'failure' },
        { ...successfulMainPush, event: 'pull_request' },
    ]) {
        let requestCount = 0
        const result = await prepareDocsWorkflowRun({
            repository,
            eventRepository: repository,
            workflowRun,
            runCommand: () => {
                requestCount += 1
                throw new Error('请求不应发生')
            },
        })
        assert.equal(result.deploy, false)
        assert.equal(requestCount, 0)
    }
})

test('skips an older successful main run after main advances', async () => {
    let artifactRequestCount = 0
    const result = await prepareDocsWorkflowRun({
        repository,
        eventRepository: repository,
        workflowRun: successfulMainPush,
        token: 'token',
        runCommand: (_program, args) => {
            if (args[1].endsWith('/commits/main')) return JSON.stringify({ sha: 'c'.repeat(40) })
            artifactRequestCount += 1
            throw new Error('旧提交不应查询产物')
        },
    })

    assert.deepEqual(result, { deploy: false, reason: 'workflow-run-is-not-current-main' })
    assert.equal(artifactRequestCount, 0)
})
