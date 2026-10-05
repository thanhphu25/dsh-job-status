/** Keyless tests through the real Cordis tool registry and execution pipeline. */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import * as plugin from '../index.js'

async function setup(t) {
  const ctx = new Context()
  t.after(() => ctx.fiber.dispose())
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  return ctx
}

function query(ctx, args) {
  return ctx.tools.execute({
    name: 'get_job_status', callId: ToolCallId('job-status-test'), arguments: args,
    signal: new AbortController().signal,
  })
}

test('exposes the declared job parameter and returns the fixed failed job', async t => {
  const ctx = await setup(t)
  await ctx.plugin(plugin)
  const assembly = await ctx.systemPrompt.assemble()
  const schema = assembly.tools.find(tool => tool.name === 'get_job_status')
  assert.ok(schema)
  assert.deepEqual(schema.parameters.required, ['job_id'])
  const result = await query(ctx, { job_id: 'JOB001' })
  assert.equal(result.isError, false)
  assert.deepEqual(result.content, [{
    type: 'text',
    text: JSON.stringify({
      job_id: 'JOB001', status: 'failed', step: 'resize', reason: 'Ảnh đầu vào bị hỏng',
    }),
  }])
})

test('rejects unknown jobs instead of inventing a status', async t => {
  const ctx = await setup(t)
  await ctx.plugin(plugin)
  const result = await query(ctx, { job_id: 'JOB999' })
  assert.equal(result.isError, true)
  assert.ok(result.content.some(block => block.type === 'text' && block.text.includes('JOB999')))
})

test('rejects missing and non-string job ids', async t => {
  const ctx = await setup(t)
  await ctx.plugin(plugin)
  for (const args of [{}, { job_id: 123 }, { job_id: null }]) {
    assert.equal((await query(ctx, args)).isError, true)
  }
})

test('mounting adds the tool and unloading removes it in the same runtime', async t => {
  const ctx = await setup(t)
  assert.equal((await query(ctx, { job_id: 'JOB001' })).isError, true)
  const fiber = ctx.plugin(plugin)
  await fiber
  assert.equal((await query(ctx, { job_id: 'JOB001' })).isError, false)
  await fiber.dispose()
  assert.equal(ctx.tools.get('get_job_status'), undefined)
  assert.equal((await ctx.systemPrompt.assemble()).tools.some(tool => tool.name === 'get_job_status'), false)
  assert.equal((await query(ctx, { job_id: 'JOB001' })).isError, true)
  const remounted = ctx.plugin(plugin)
  await remounted
  assert.equal((await query(ctx, { job_id: 'JOB001' })).isError, false)
  await remounted.dispose()
})
