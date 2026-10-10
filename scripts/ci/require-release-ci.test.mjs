import assert from 'node:assert/strict'
import test from 'node:test'
import { selectSuccessfulMainRun } from './require-release-ci.mjs'

const sha = 'release-commit'
const success = { head_sha: sha, head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success' }

test('发布绑定 main push 的同一提交成功 CI', () => {
    assert.equal(selectSuccessfulMainRun([success], sha), success)
    for (const change of [{ head_sha: 'another-commit' }, { head_branch: 'feature' }, { event: 'pull_request' }, { status: 'in_progress' }, { conclusion: 'failure' }]) {
        assert.equal(selectSuccessfulMainRun([{ ...success, ...change }], sha), undefined)
    }
})
