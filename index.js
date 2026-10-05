/** Registers a fixed image-processing job status tool with DeepSeek Harness. */
import { defineTool } from '@deepseek-ai/dsh-tools'

/** Cordis plugin display name. */
export const name = 'job-status'

/** Required service for tool registration. */
export const inject = ['tools']

/**
 * Register get_job_status for this plugin's lifetime; unloading removes it.
 * @param {import('@deepseek-ai/cordis').Context} ctx - Cordis context with the tool registry.
 * @returns {void}
 */
export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'get_job_status',
    description: 'Tra cứu trạng thái tác vụ xử lý ảnh bằng dữ liệu giả lập. Chỉ có dữ liệu cho JOB001.',
    parameters: {
      job_id: { type: 'string', required: true, description: 'Mã tác vụ cần truy vấn, ví dụ JOB001.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          job_id: { type: 'string', required: true },
          status: { type: 'string', required: true, enum: ['failed'] },
          step: { type: 'string', required: true, enum: ['resize'] },
          reason: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute({ job_id }) {
      if (job_id !== 'JOB001') throw new Error(`Không có dữ liệu giả lập cho tác vụ ${job_id}`)
      return {
        job_id: 'JOB001',
        status: 'failed',
        step: 'resize',
        reason: 'Ảnh đầu vào bị hỏng',
      }
    },
    presentCall: args => ({ card: 'generic', title: 'get_job_status', kind: 'read', rawInput: args.job_id }),
  }))
}
