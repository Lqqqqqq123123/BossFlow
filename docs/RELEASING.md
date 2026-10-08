# BossFlow 发版：一步一步操作

发版就是：**把新代码做成三个安装包，再上传到 GitHub，让别人下载。**

下面以发布 **1.2.0** 为例。它只是示例：1.1.0 已经发布过了，现在不用重新发布。以后只修 bug 可以发 1.1.1，新增功能可以发 1.2.0。换版本时，把下文所有 `1.2.0` 都换成你的版本号。

先把功能修改提交到 main，然后在项目文件夹打开 PowerShell。**下面的命令一块一块执行，出现错误就停下来，不要接着往下跑。**

## ① 改版本号

打开项目根目录的 `package.json`，找到 version，改成：

```json
"version": "1.2.0"
```

保存文件。这个数字决定扩展里显示的版本。

## ② 检查代码，生成扩展文件

一条一条执行：

```powershell
pnpm test
pnpm check
pnpm lint
pnpm build
```

前三条检查代码，最后一条生成 Chrome、Edge、Firefox 三份扩展文件，放在 `.output` 文件夹。

**一定先改版本，再执行 build。** 否则安装包里可能还是旧版本。检查出现警告时，把警告保留到更新说明中；检查失败则先解决。

## ③ 压缩成三个安装包

复制执行：

```powershell
Compress-Archive -Path '.output/chrome-mv3/*' -DestinationPath '.output/BossFlow-1.2.0-chrome-mv3.zip' -Force
Compress-Archive -Path '.output/edge-mv3/*' -DestinationPath '.output/BossFlow-1.2.0-edge-mv3.zip' -Force
Compress-Archive -Path '.output/firefox-mv2/*' -DestinationPath '.output/BossFlow-1.2.0-firefox-mv2.zip' -Force
```

现在 `.output` 里应该多出三个 zip，它们就是别人要下载的安装包。

打开每个 zip，确认第一层就能看到 `manifest.json`，而且里面的 version 是 `1.2.0`。不用改这三个 manifest；版本不对就重新 build、重新压缩。

## ④ 写这次更新了什么

在 `.output` 文件夹新建或打开 `RELEASE_NOTES.md`，复制下面的模板。把“这里填写”替换成这次实际情况：

```markdown
# BossFlow v1.2.0

## 更新内容
- 这里填写本次新增功能。
- 这里填写本次修复的问题。

## 安装方式
- Chrome / Edge：下载对应 zip 并解压，在扩展管理页开启开发者模式，选择“加载已解压的扩展程序”，选中包含 manifest.json 的文件夹。更新后刷新 BOSS 页面。
- Firefox：解压对应 zip，在 about:debugging → 此 Firefox → 临时载入附加组件中选择 manifest.json。此扩展未签名，重启浏览器后失效。

## 验证情况
- 这里填写测试、类型检查、lint、三端构建的结果，以及剩余警告。
- 没有实际用浏览器验证，就写“未真机验证”。
- GitHub CI 没有运行，就写“未运行”。

## 项目声明
本项目源自 Ocyss/boss-helper，采用 MIT License，是非官方社区维护版本，与 BOSS 直聘官方无关。
保留原作者版权声明 Copyright (c) 2024 Ocyss(git@ocyss.icu)。
当前按免费、非商业社区版本宣传；README 非商业表述与 MIT 商业使用授权存在冲突，本次未修改许可条款。
当前与上游 boss-helper 使用相同扩展身份，不可同时安装，后装者会覆盖先装者。
```

项目声明和安装提醒要保留。这个说明文件和三个 zip 放在 `.output`，不用提交到 Git。

## ⑤ 上传代码，给版本贴个标签

先执行：

```powershell
 git status --short --branch
```

确认当前在 main，本次功能修改已经提交。接下来一条一条执行：

```powershell
 git add package.json
 git commit -m "chore: 发布版本号更新至 1.2.0"
 git tag v1.2.0
 git push origin main
 git push origin v1.2.0
```

**tag 就是给这份代码贴上“1.2.0 版本”的标签。** 如果提示同名 tag 已存在，停下来核对，不要强制覆盖。

## ⑥ 创建 GitHub 下载页面

执行这条命令（整条一起复制）：

```powershell
 gh release create v1.2.0 -R Lqqqqqq123123/BossFlow --verify-tag --title "BossFlow v1.2.0" --notes-file .output/RELEASE_NOTES.md .output/BossFlow-1.2.0-chrome-mv3.zip .output/BossFlow-1.2.0-edge-mv3.zip .output/BossFlow-1.2.0-firefox-mv2.zip
```

如果提示 gh 未登录，先执行 `gh auth login`，登录后再试。

成功后会返回 GitHub 链接。打开它，确认更新说明正确，并且有 Chrome、Edge、Firefox 三个 zip 下载附件。**到这里就发布完成了。**

这里发布的是社区 GitHub 仓库；扩展身份还没独立替换，暂时不要发布到浏览器商店。

---

不想自己操作时，直接对 Codex 说：**“帮我发布 v1.2.0，功能修改已经提交到 main。”**
