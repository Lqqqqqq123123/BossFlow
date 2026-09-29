import type { FormDataRange, FormSalaryRangeInput } from '@/types/formData'

export function rangeMatchFormat(v: FormDataRange, unit: string): string {
  return `${v[0]} - ${v[1]} ${unit} ${v[2] ? '严格' : '宽松'}`
}

// 匹配范围
export function rangeMatch(rangeStr: string, form: FormDataRange): boolean {
  if (!rangeStr) return false
  let [start, end, mode] = form // mode: true=严格(包含)，false=宽松(重叠)
  if (start > end) {
    ;[start, end] = [end, start]
  }
  const re = /(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/
  const m = String(rangeStr).match(re)
  if (!m) return false

  let inputStart = Number.parseFloat(m[1])
  let inputEnd = Number.parseFloat(m[2] != null ? m[2] : m[1])
  if (!Number.isFinite(inputStart) || !Number.isFinite(inputEnd)) return false

  if (inputStart > inputEnd) {
    ;[inputStart, inputEnd] = [inputEnd, inputStart]
  }
  if (mode) {
    // 严格：职位范围(input) 完全覆盖 目标范围(form)
    return start <= inputStart && inputEnd <= end
  } else {
    // 宽松：任意重叠（闭区间）
    return Math.max(inputStart, start) <= Math.min(inputEnd, end)
  }
}

/**
 * 薪资单位识别规则，按顺序取第一个命中的单位。
 * 兼容 "元/天" 与实习岗常见的无 "元" 写法（"150-200/天"、"100/日"）。
 */
const UNIT_RULES = [
  { key: 'H', unit: '元/时', re: /\/时/ },
  { key: 'D', unit: '元/天', re: /\/天|\/日/ },
  { key: 'M', unit: '元/月', re: /\/月/ },
  { key: 'K', unit: 'K', re: /K/ },
] as const

export type SalaryUnitKey = (typeof UNIT_RULES)[number]['key']

export function matchSalaryUnit(text: string): { key: SalaryUnitKey; unit: string } | null {
  for (const rule of UNIT_RULES) {
    if (rule.re.test(text)) {
      return { key: rule.key, unit: rule.unit }
    }
  }
  return null
}

/**
 * 薪资过滤完整决策：识别薪资文本单位后与对应配置区间比较。
 * 单位无法识别（如"面议"）时不做过滤，区间为全区间 [0, 999999] 时等同于放行。
 */
export function matchSalaryRange(
  text: string,
  conf: Pick<FormSalaryRangeInput, 'value' | 'advancedValue'>,
): { matched: boolean; expected?: string } {
  const m = matchSalaryUnit(text)
  if (!m) {
    return { matched: true }
  }
  const range = m.key === 'K' ? conf.value : conf.advancedValue[m.key]
  const matched = rangeMatch(text, range)
  return {
    matched,
    expected: matched ? undefined : rangeMatchFormat(range, m.unit),
  }
}
