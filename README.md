# BossFlow

BossFlow 是一个面向求职流程的浏览器扩展，提供岗位筛选、自动投递、投递统计、AI 辅助和自定义招呼语等能力。

本项目是 [Ocyss/boss-helper](https://github.com/Ocyss/boss-helper) 的非官方社区维护 Fork，与 BOSS 直聘官方无关。

## 项目状态

- 当前社区版本：`1.0.0`
- 社区仓库：<https://github.com/Lqqqqqq123123/BossFlow>
- 问题反馈：<https://github.com/Lqqqqqq123123/BossFlow/issues>
- 上游项目：<https://github.com/Ocyss/boss-helper>
- 构建目标：Chrome、Edge、Firefox

> [!WARNING]
> 自动化操作可能触发平台风控，包括限制功能、降低账号权重或封禁账号。请合理设置投递频率和数量，使用者自行承担相关风险。

## 主要能力

- 按岗位名称、公司、薪资、活跃度、地址等条件筛选岗位。
- 自动投递并展示今日处理、成功、过滤和重复数据。
- 支持自定义文本、图片招呼语及 AI 辅助筛选和招呼语。
- 支持配置预设、JSON 导入与导出。
- 展示岗位执行状态、任务时间线，并支持失败岗位重试。
- 配置数据、API Key 等敏感信息默认保存在浏览器扩展本地存储中。

## 安装与构建

需要 Node.js 22 或更高版本，以及 pnpm。

```powershell
pnpm install
pnpm build
```

构建产物位于：

```text
.output/chrome-mv3
.output/edge-mv3
.output/firefox-mv2
```

开发和质量检查：

```powershell
pnpm dev
pnpm check
pnpm lint
pnpm test
```

## 使用说明

1. 在 BOSS 直聘岗位列表页加载扩展。
2. 在“配置”页设置筛选条件、投递上限和招呼语，并保存配置。
3. 回到“投递”页开始任务，观察岗位队列和执行状态。
4. 导入配置后需要手动点击“保存配置”。配置文件可能包含隐私信息，请勿公开分享未经检查的文件。

## 社区维护说明

- 社区版本保留上游完整 Git 历史、MIT License 和原作者版权声明。
- Fork 标识是 GitHub 正常展示上游关系的方式，不影响独立维护和发布。
- 上游作者不负责社区版本的功能、发布、支持或安全问题，请在社区仓库反馈。
- 独立商店身份完成前，仅以 GitHub Release 作为社区版发布入口。

## 许可与使用口径

代码仓库保留上游的 [MIT License](./LICENSE)，包括原作者版权声明。MIT License 允许复制、修改、分发和商业使用，但必须保留许可与版权声明。

上游 README 曾同时声明“禁止商业用途”，该表述与 MIT License 的商业使用授权存在冲突。社区版本当前按免费、非商业、学习交流用途维护；在完成正式法律口径确认前，不额外收窄或改写 MIT License 的授权内容。

## 贡献

1. 从社区仓库创建分支。
2. 完成修改并运行 `pnpm check`、`pnpm lint`、`pnpm test` 和 `pnpm build`。
3. Git 提交说明使用中文，可以保留 `fix:`、`feat:`、`docs:` 等类型前缀。
4. 向社区仓库提交 Pull Request。

## 致谢

感谢 [Ocyss/boss-helper](https://github.com/Ocyss/boss-helper) 原作者及所有历史贡献者。社区维护不会删除或替换原作者版权和贡献记录。
