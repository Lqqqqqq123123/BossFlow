import assert from 'node:assert/strict'
import test from 'node:test'

import { createClientMidFactory, normalizeGreetingMessages } from '../src/utils/messageSequence.ts'

void test('字符串招呼语转换为单条文本消息', () => {
  assert.deepEqual(normalizeGreetingMessages('你好'), [{ type: 'text', content: '你好' }])
})

void test('文本和图片保持原有发送顺序', () => {
  const messages = [
    { type: 'text' as const, content: '第一条' },
    { type: 'image' as const, image: 'image-key' },
    { type: 'text' as const, content: '第三条' },
  ]
  assert.deepEqual(normalizeGreetingMessages(messages), messages)
})

void test('相同时钟值仍生成唯一且递增的 clientMid', () => {
  const nextClientMid = createClientMidFactory(() => 1000)
  assert.deepEqual([nextClientMid(), nextClientMid(), nextClientMid()], [1000, 1001, 1002])
})
