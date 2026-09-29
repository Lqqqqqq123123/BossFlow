import assert from 'node:assert/strict'
import test from 'node:test'

import type { FormDataRange, FormSalaryRangeInput } from '../src/types/formData.ts'
import {
  matchSalaryRange,
  matchSalaryUnit,
  rangeMatch,
  rangeMatchFormat,
} from '../src/utils/salary.ts'

// 与 info.ts 中 defaultFormData.salaryRange 一致的默认配置
function createDefaultConf(): Pick<FormSalaryRangeInput, 'value' | 'advancedValue'> {
  return {
    value: [8, 13, false],
    advancedValue: {
      H: [0, 999999, false],
      D: [0, 999999, false],
      M: [0, 999999, false],
    },
  }
}

void test('识别实习岗按天计薪的常见薪资格式为日薪单位', () => {
  assert.equal(matchSalaryUnit('150-200/天')?.key, 'D')
  assert.equal(matchSalaryUnit('200元/天')?.key, 'D')
  assert.equal(matchSalaryUnit('150-200元/天')?.key, 'D')
  assert.equal(matchSalaryUnit('100-150/日')?.key, 'D')
})

void test('识别时薪、月薪和K单位', () => {
  assert.equal(matchSalaryUnit('30-50元/时')?.key, 'H')
  assert.equal(matchSalaryUnit('25/时')?.key, 'H')
  assert.equal(matchSalaryUnit('8000-13000元/月')?.key, 'M')
  assert.equal(matchSalaryUnit('15-25K')?.key, 'K')
  assert.equal(matchSalaryUnit('10-20K·15薪')?.key, 'K')
})

void test('无法识别薪资单位时返回空', () => {
  assert.equal(matchSalaryUnit('面议'), null)
  assert.equal(matchSalaryUnit(''), null)
})

void test('默认配置下日薪岗位放行', () => {
  const conf = createDefaultConf()
  assert.equal(matchSalaryRange('150-200/天', conf).matched, true)
  assert.equal(matchSalaryRange('200元/天', conf).matched, true)
  assert.equal(matchSalaryRange('300-500/天', conf).matched, true)
})

void test('默认配置下时薪和元/月岗位放行', () => {
  const conf = createDefaultConf()
  assert.equal(matchSalaryRange('30-50元/时', conf).matched, true)
  assert.equal(matchSalaryRange('8000-13000元/月', conf).matched, true)
})

void test('无法识别的薪资文本不做过滤', () => {
  const conf = createDefaultConf()
  assert.equal(matchSalaryRange('面议', conf).matched, true)
  assert.equal(matchSalaryRange('', conf).matched, true)
})

void test('配置日薪区间后按天计薪岗位被过滤', () => {
  const conf = createDefaultConf()
  conf.advancedValue.D = [200, 300, true]
  assert.equal(matchSalaryRange('150-200/天', conf).matched, false)
  assert.equal(matchSalaryRange('300-350/天', conf).matched, false)
  assert.equal(matchSalaryRange('250元/天', conf).matched, true)
  assert.equal(matchSalaryRange('180-220/天', conf).matched, false)
})

void test('配置日薪区间后宽松模式按重叠判断', () => {
  const conf = createDefaultConf()
  conf.advancedValue.D = [200, 300, false]
  assert.equal(matchSalaryRange('180-220/天', conf).matched, true)
  assert.equal(matchSalaryRange('100-150/天', conf).matched, false)
})

void test('不匹配时返回预期区间文案', () => {
  const conf = createDefaultConf()
  conf.advancedValue.D = [200, 300, true]
  const res = matchSalaryRange('150-200/天', conf)
  assert.equal(res.matched, false)
  assert.equal(res.expected, '200 - 300 元/天 严格')
})

void test('K单位使用主配置区间过滤', () => {
  const conf = createDefaultConf()
  assert.equal(matchSalaryRange('10-20K', conf).matched, true)
  assert.equal(matchSalaryRange('15-25K', conf).matched, false)
})

void test('rangeMatch 宽松模式按重叠判断', () => {
  assert.equal(rangeMatch('15-25K', [10, 20, false] as FormDataRange), true)
  assert.equal(rangeMatch('21-22K', [10, 20, false] as FormDataRange), false)
})

void test('rangeMatch 严格模式要求完全覆盖', () => {
  assert.equal(rangeMatch('10-15K', [10, 20, true] as FormDataRange), true)
  assert.equal(rangeMatch('15-20K', [10, 20, true] as FormDataRange), true)
  assert.equal(rangeMatch('15-21K', [10, 20, true] as FormDataRange), false)
})

void test('rangeMatch 支持倒序配置区间', () => {
  assert.equal(rangeMatch('10-12K', [13, 8, false] as FormDataRange), true)
})

void test('rangeMatch 对无数字文本返回不匹配', () => {
  assert.equal(rangeMatch('面议', [0, 999999, false] as FormDataRange), false)
})

void test('rangeMatchFormat 输出单位与匹配模式', () => {
  assert.equal(rangeMatchFormat([8, 13, false], 'K'), '8 - 13 K 宽松')
  assert.equal(rangeMatchFormat([200, 300, true], '元/天'), '200 - 300 元/天 严格')
})
