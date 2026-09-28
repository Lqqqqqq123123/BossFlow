# BossFlow 维护约定

## 项目定位

- 本仓库是 `Ocyss/boss-helper` 的非官方社区维护 Fork，与 BOSS 直聘官方无关。
- 社区仓库地址应为 `https://github.com/Lqqqqqq123123/BossFlow.git`。
- 上游仓库地址应为 `https://github.com/Ocyss/boss-helper.git`。
- 对外名称统一为 `BossFlow`，包名为 `bossflow`；同步检查扩展展示名、文档、链接、构建产物和发布配置。

## 版权与许可

- 必须保留上游完整 Git 历史，不得重新执行 `git init`，不得删除 `.git`，不得压平、覆盖或重写现有历史。
- 必须保留根目录 `LICENSE`、MIT License 全文及原作者版权声明：`Copyright (c) 2024 Ocyss(git@ocyss.icu)`。
- 可以追加社区维护者版权声明，但不得替换、删除或弱化原作者署名。
- README 中“禁止用于商业用途”与 MIT License 的商业使用授权存在冲突。未经维护者明确决定，不得擅自改写许可条款；当前发布和宣传口径按免费、非商业、社区维护版本处理，并在涉及许可的变更中明确提示这一冲突。
- README、扩展内关于页面及发布说明必须明确：本项目源自 `Ocyss/boss-helper`，采用 MIT License，是非官方社区维护版本，与 BOSS 直聘官方无关。

## Git 安全规则

- 开始工作前检查 `git status --short --branch`、当前分支、近期提交、`git remote -v`，并确认工作区内已有改动的归属。
- 预期 `origin` 指向社区 Fork，`upstream` 指向原项目。发现缺失或不一致时先报告；未经明确要求不要修改 remote。
- 不得删除、覆盖或回退用户已有改动。不要使用 `git reset --hard`、`git clean -fd`、强制推送或其他会丢失历史/文件的命令。
- 不得未经确认提交、推送、合并、关闭 PR、创建 Release 或发布扩展。
- 后续 Git 提交标题和说明统一使用中文；可以保留 `fix:`、`feat:`、`docs:` 等 Conventional Commits 类型前缀，但冒号后的描述必须使用中文。
- 与上游同步时保留可审计的提交关系；执行 rebase、历史重写或处理复杂冲突前必须先获得确认。

## 当前已完成且应防止回归的修复

- 修复 TypeScript 类型被错误当作运行时导出的问题。
- 修复嵌套 `@keyframes` 导致 LightningCSS 构建失败的问题。
- 移除 Chrome Manifest V3 不支持的 `chrome_style`。
- 修复 options manifest 的 `include`/`exclude` 冲突。
- 修复自定义招呼语“文本 + 图片”只能发送第一条的问题：每条消息必须使用独立 `clientMid`。
- 自定义招呼语的文本和图片连续发送已经过实际验证；修改消息发送链路时必须保留该行为并补充自动化测试。
- 修复自动投递统计不显示/不正确的问题：所有界面必须读取 `HelperContext.statistics` 的同一状态实例；每个实际处理的岗位累计一次 `total`，只有“岗位投递”任务成功才累计 `success`。
- 配置页必须保留 JSON 导入和导出入口；导入后由用户确认并手动保存。
- 岗位队列支持成功、失败、过滤状态筛选；失败重试应从最近失败任务继续，避免重复执行已经成功的岗位投递任务。
- 工作流任务状态应同步记录到岗位执行时间线。

## 验证基线

- 修改前先确认分支相对 `main` 和必要时相对 `upstream/main` 的提交关系。
- 常规验证命令为 `pnpm build`、`pnpm check`、`pnpm lint`；记录命令版本、失败原因和全部剩余警告，不得只报告退出码。
- 构建产物位于 `.output`，不是 `dist`。Chrome、Firefox、Edge 三种目标都应验证。
- 检查 CI 时同时核对工作流定义、当前提交的 checks/status 和 PR 状态；没有运行记录时明确写“未运行”，不要写成“通过”。
- 涉及消息发送时，至少覆盖单条文本、单张图片、文本后图片、多条消息的唯一 `clientMid` 与发送顺序。

### 构建与检查命令

```powershell
# 安装依赖
pnpm install

# 同时构建 Chrome、Firefox 和 Edge
pnpm build

# 按浏览器单独构建
pnpm build:chrome
pnpm build:firefox
pnpm build:edge

# 类型检查、lint 和测试
pnpm check
pnpm lint
pnpm test
```

- 构建输出目录为 `.output/<browser>-mv<manifest-version>`。
- pnpm 11 仅允许 `vue-demi` 执行依赖构建脚本；不得改成全局允许。
- `vue-tsc` 当前使用 TypeScript 5.9 系列，升级 TypeScript 前必须先验证兼容性。

## 当前维护待办

1. 修复 GitHub Actions：移除不存在的 `build:noTsc`，将 `dist` 产物路径改为 WXT 的 `.output`，并建立可复现的包管理器/锁文件策略。
2. 独立发布前更换 Chrome 扩展 `key`、Firefox 扩展 ID 及商店身份；完成替换前不得发布到浏览器商店。
3. 继续收敛现有 lint 警告，并为失败重试和任务时间线补充更完整的工作流集成测试。

## 变更原则

- 优先做范围清晰、可验证的小改动；不要把无关重构混入修复。
- 依赖升级必须说明原因并检查扩展三端构建、类型检查和 lint 的变化。
- 生成文件或构建产物只有在仓库既有约定要求时才提交。
- 遇到法律口径、发布身份、商店凭据、扩展 ID 或历史改写相关决策时停止并请求维护者确认。
