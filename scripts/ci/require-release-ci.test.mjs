import assert from 'node:assert/strict'
import test from 'node:test'
import { requireReleaseCi, selectSuccessfulMainRun } from './require-release-ci.mjs'

const sha = 'release-commit'
const success = { head_sha: sha, head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success' }

test('发布绑定 main push 的同一提交成功 CI', () => {
    assert.equal(selectSuccessfulMainRun([success], sha), success)
    for (const change of [{ head_sha: 'another-commit' }, { head_branch: 'feature' }, { event: 'pull_request' }, { status: 'in_progress' }, { conclusion: 'failure' }]) {
        assert.equal(selectSuccessfulMainRun([{ ...success, ...change }], sha), undefined)
    }
})

test('发布等待同提交的 main CI 完成后绑定成功记录', () => {
    const pending = { ...success, id: 71, status: 'in_progress', conclusion: null }
    const completed = { ...success, id: 71, html_url: 'https://github.com/example/repo/actions/runs/71' }
    const calls = []
    let apiReads = 0
    const run = requireReleaseCi({ repository: 'example/repo', sha }, (program, args) => {
        calls.push([program, ...args])
        if (program === 'gh' && args[0] === 'api') return JSON.stringify({ workflow_runs: [++apiReads === 1 ? pending : completed] })
        return ''
    })
    assert.deepEqual(run, completed)
    assert.equal(apiReads, 2)
    assert.ok(calls.some(call => call.join(' ') === 'gh run watch 71 --repo example/repo --exit-status'))
})
