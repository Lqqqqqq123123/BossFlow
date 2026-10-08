import assert from 'node:assert/strict'
import test from 'node:test'

import { createJobContentKeywordPattern } from '../src/utils/jobContentKeyword.ts'

void test('c++ 作为普通关键词匹配，不再抛正则错误', () => {
  const pattern = createJobContentKeywordPattern('C++')
  assert.equal(pattern.test('熟悉c++开发'), true)
  assert.equal(pattern.test('熟悉c开发'), false)
  assert.equal(createJobContentKeywordPattern('c').test('熟悉c开发'), true)
})

void test('正则特殊字符均按字面匹配', () => {
  for (const keyword of [
    'c#',
    '.net',
    'a*b',
    'a?b',
    '(java)',
    '[c++]',
    'a|b',
    '$^',
    'a{2}',
    String.raw`c:\tools`,
  ]) {
    const pattern = createJobContentKeywordPattern(keyword)
    assert.equal(pattern.test(`需要${keyword}开发经验`), true, keyword)
  }
  assert.equal(createJobContentKeywordPattern('.net').test('anet'), false)
  assert.equal(createJobContentKeywordPattern('a|b').test('a'), false)
})

void test('保留原有否定词和系统软件工具服务后缀规则', () => {
  const pattern = createJobContentKeywordPattern('c++')
  for (const content of ['不要求c++', '无需c++', 'c++系统', 'c++软件', 'c++工具', 'c++服务']) {
    assert.equal(pattern.test(content), false, content)
  }
  assert.equal(pattern.test('不要求java，需要c++开发'), true)
})
