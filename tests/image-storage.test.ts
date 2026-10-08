import assert from 'node:assert/strict'
import test from 'node:test'

import { calculateFileMD5 } from '../src/utils/file.ts'

void test('后台无 FileReader 时仍可计算图片存储键', async () => {
  assert.equal(typeof globalThis.FileReader, 'undefined')
  const file = new File(['hello'], 'resume.png', { type: 'image/png' })
  assert.equal(await calculateFileMD5(file), '5d41402abc4b2a76b9719d911017c592')
  assert.equal(await calculateFileMD5(file), await calculateFileMD5(file))
})

void test('图片读取失败向调用方报告错误', async () => {
  const file = new File([], 'resume.png')
  file.arrayBuffer = async () => {
    throw new Error('读取失败')
  }
  await assert.rejects(calculateFileMD5(file), /读取失败/)
})
