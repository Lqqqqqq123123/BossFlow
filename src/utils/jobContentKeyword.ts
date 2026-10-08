export function createJobContentKeywordPattern(keyword: string): RegExp {
  const literal = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<!(不|无).{0,5})${literal}(?!系统|软件|工具|服务)`)
}
