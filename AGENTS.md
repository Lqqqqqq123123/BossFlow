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

## 发布流程（GitHub Release）

- 版本号唯一来源是根目录 `package.json` 的 `version` 字段，`pnpm build` 时由 WXT 自动写入扩展 manifest。GitHub Release 的 tag（`vX.Y.Z`）、zip 文件名中的版本号与 package.json 三者无自动校验，发布前必须逐一核对一致。
- 版本号遵循语义化版本：只修 bug 递增修定位（1.0.0 → 1.0.1），新增功能递增次定位（→ 1.1.0），破坏性变更递增主定位（→ 2.0.0）。可用 `npm version minor`（或 `patch`/`major`）一步完成改版本、提交与打 tag。
- 发布顺序：先改 `package.json` 版本号 → 再 `pnpm build`（构建时才读取版本号写入 manifest）→ 再打包 → 最后创建 Release。改了版本号忘记重新构建是最常见的翻车点。

发版步骤：

1. 完成开发并通过验证基线（`pnpm test`、`pnpm check`、`pnpm lint`、`pnpm build` 三端）。
2. 更新版本号、提交并推送代码；`vX.Y.Z` tag 应落在包含本次改动的提交上。
3. 打包 zip（PowerShell，注意 `-Path .../*` 打的是目录内容，保证 `manifest.json` 位于 zip 根）：

   ```powershell
   powershell -NoProfile -Command "Compress-Archive -Path '.output/chrome-mv3/*' -DestinationPath '.output/BossFlow-<版本>-chrome-mv3.zip' -Force; Compress-Archive -Path '.output/edge-mv3/*' -DestinationPath '.output/BossFlow-<版本>-edge-mv3.zip' -Force; Compress-Archive -Path '.output/firefox-mv2/*' -DestinationPath '.output/BossFlow-<版本>-firefox-mv2.zip' -Force"
   ```

4. 更新 `.output/RELEASE_NOTES.md`（放在 `.output` 下不进仓库），内容含本版本修复/新增清单、安装方式，以及下方“发布注意事项”要求的声明。
5. 创建 Release（本仓库为 Fork，存在 origin/upstream 双 remote，gh 需显式指定仓库）：

   ```powershell
   gh release create vX.Y.Z -R Lqqqqqq123123/BossFlow --title "BossFlow vX.Y.Z" --notes-file .output/RELEASE_NOTES.md .output/BossFlow-<版本>-chrome-mv3.zip .output/BossFlow-<版本>-edge-mv3.zip .output/BossFlow-<版本>-firefox-mv2.zip
   ```

   也可先执行一次 `gh repo set-default Lqqqqqq123123/BossFlow`，之后可省略 `-R`。

发布注意事项：

- Release 只应发布到 `origin`（BossFlow 社区仓库），不得发到 `upstream`。
- Release 说明必须包含：源自 `Ocyss/boss-helper`、MIT License、非官方社区维护、与 BOSS 直聘官方无关（同“版权与许可”口径）。
- 在待办 2（更换 Chrome 扩展 `key`、Firefox 扩展 ID）完成前，Release 说明中必须提醒：本扩展与上游 boss-helper 原版使用相同扩展身份，不可同时安装，后装者会覆盖先装者。
- edge 产物不含 options 页面及其 chunk（WXT 配置有意排除），打包为 15 个文件属预期，不是构建缺陷。
- Firefox 产物为 MV2 无签名扩展，仅能通过 `about:debugging` 临时载入，重启浏览器后失效；长期支持需完成扩展 ID 更换并走 AMO 签名分发。

## 当前维护待办

1. 修复 GitHub Actions：移除不存在的 `build:noTsc`，将 `dist` 产物路径改为 WXT 的 `.output`，并建立可复现的包管理器/锁文件策略。
2. 独立发布前更换 Chrome 扩展 `key`、Firefox 扩展 ID 及商店身份；完成替换前不得发布到浏览器商店。
3. 继续收敛现有 lint 警告，并为失败重试和任务时间线补充更完整的工作流集成测试。

## 变更原则

- 优先做范围清晰、可验证的小改动；不要把无关重构混入修复。
- 依赖升级必须说明原因并检查扩展三端构建、类型检查和 lint 的变化。
- 生成文件或构建产物只有在仓库既有约定要求时才提交。
- 遇到法律口径、发布身份、商店凭据、扩展 ID 或历史改写相关决策时停止并请求维护者确认。
