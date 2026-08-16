# CyreneNameRoller Plugin Template

CyreneNameRoller Plugin API 1.4 官方模板。点击 GitHub 的 **Use this template** 创建仓库，即可开发同时适配 Web 与 Tauri 的 `.cnrp` 插件。

本模板覆盖：

- 宿主原生 Fluent 设置页与 Dock 一级页面。
- API 1.4 组件样式、覆盖包、二元覆盖和权威结果布局选择器。
- 通过宿主权威事务完成点名、统计和记录提交。
- 覆盖导航、点名、卡牌、抽奖和统计目标的受限组件样式。
- `roller.filters` 等 optional 组件的隐藏、压缩和占位布局。
- 三个固定插槽的声明式原生视图。
- 由宿主绑定 `DrawReceipt` 的四种权威结果布局。
- 插件 Worker、命令、动画包和隔离的 Canvas/WebGL 视觉层。
- GitHub Actions 自动校验、打包 Release 和部署开发文档。

## 使用模板

1. 使用本仓库创建新仓库。
2. 修改 `manifest.json` 中的反向域名 ID、名称、开发者和版本。
3. 删除不需要的贡献项与权限，只保留实际使用的能力。
4. 安装 SDK、校验并打包：

```bash
pnpm install
pnpm run validate
pnpm run build
```

生成的插件位于 `dist/cyrene-plugin-template.cnrp`，可在 CyreneNameRoller 的插件页面导入。

## API 1.4 示例地图

| 目标 | 示例文件 | 关键能力 |
| --- | --- | --- |
| 宿主原生配置 | `manifest.json` | `native.settings`、动画与 API 1.4 UI 贡献选择器 |
| Dock 大型页面 | `pages/draw-studio.*` | `location: "dock"`、`window.CyrenePlugin.request()` |
| 权威抽签事务 | `pages/draw-studio.js` | `draw.execute`，宿主生成并提交结果 |
| 稳定组件样式 | `manifest.json` | 3 个 `componentStylePacks`、11 个目标、宿主字体别名 |
| 可选组件覆盖 | `manifest.json` | `collapse`、`compact`、`reserve` 三种布局语义 |
| 点名侧栏 | `views/roller-stats.json` | 统计绑定、进度条、宿主权威点名命令 |
| 结果下方 | `views/below-result.json` | 宿主主题绑定、能力发现命令 |
| 记录工具栏 | `views/records-toolbar.json` | 语义图标、只读统计命令 |
| 权威结果呈现 | `manifest.json` | `single`、`list`、`grid`、`spotlight` |
| 事件与后台逻辑 | `src/worker.js` | 生命周期、存储、资源查询、能力发现和权威事务 |
| 动画与视觉层 | `animations/`、`src/visual.js` | 受限动画、OffscreenCanvas |

HTML 页面运行在受控 iframe 中，不能访问宿主 DOM。API 1.4 页面仍使用稳定的 `window.CyrenePlugin.request(method, args)`；宿主在内部用绑定当前页面 Principal 的 `MessageChannel` 传输 RPC。API 1.2 页面保留旧的 `window.message + event.source` 兼容路径，无需重新打包。

## 受限 UI 定制

样式只能指向宿主公布的稳定组件 ID。模板中的 `focused`、`compact-navigation` 和 `cards-and-statistics` 示例覆盖导航、当前名单、筛选器、主要操作、权威结果、卡牌、抽奖和统计，只使用允许的大小、颜色、字号、字重、间距、圆角和宿主字体别名。完全锁定的 `navigation.settings-entry` 没有样式示例。任意 CSS 选择器、CSS 文件、`url()`、`var()`、`display`、定位、`z-index` 和 `pointer-events` 都会被拒绝。

`focus-mode`、`compact-filters` 和 `minimal-statistics` 分别展示 optional 组件的 `collapse`、`compact` 和 `reserve` 布局语义。`roller.filters` 隐藏后宿主仍沿用当前或默认点名范围。权威结果、名单身份、错误、完整性状态和恢复入口不能隐藏；失败的覆盖包会整体拒绝，不会部分生效。

API 1.4 的原生设置页可用 `component-style-select`、`component-override-select`、`component-override-toggle` 和 `result-presentation-select` 让用户切换声明式贡献。宿主还公布 `roller.filter.english-mode`、`roller.filter.draw-target`、`roller.filter.gender`、`roller.filter.draw-count`、`roller.filter.duplicates` 和 `roller.filter.count` 六个细粒度、仅允许 `collapse` 的筛选器目标。

原生视图只能使用固定 Schema、宿主语义图标和以下插槽：

- `slot:roller.side-panel`
- `slot:roller.below-result`
- `slot:records.toolbar`

未知插槽报告 `available: false`。通用原生视图会显示不可移除的插件来源标识，不能伪装成宿主结果、错误或完整性状态。

`VerifiedResult` 不是通用视图节点。插件只能声明结果布局，姓名、结果数组和当前 `DrawReceipt` 由宿主在结果上下文中注入；保存失败时宿主不会显示已成功提交的权威状态。

`src/worker.js` 还提供四个命令示例：`refresh` 读取插件私有设置，`draw-one` 通过 `executeDraw()` 发起宿主权威事务，`show-statistics` 通过 `queryResource()` 读取只读快照，`describe-host` 发现当前宿主资源和事务。原生视图按钮只会调用这些已声明命令，不会获得 Core Worker、内部请求 ID 或宿主对象。

## 公平与安全边界

插件可以提交 `listId`、目标、性别、数量和是否允许重复等筛选条件，但不能指定赢家、结果数组、候选权重、统计增量、记录正文或算法参数。

- Web 由 Core Worker 持有算法、事务队列、统计/记录提交和 Receipt 生成。
- Tauri 由 Rust 权威事务校验输入、执行抽签并保护完整核心状态。
- 插件存储只能写插件自己的命名空间，不能写核心名单、统计、记录或权威结果。
- Worker、页面、视觉层、命令和原生视图拥有独立 Principal；禁用、崩溃或卸载后立即撤销。
- 插件不会获得 Core Worker、内部请求 ID、Tauri grantToken 或宿主对象引用。

安全模式只能通过宿主的 `safemode.json` 配置生效：Tauri 修改后重启，Web 修改部署文件后重新加载。安全模式不加载任何插件包、Worker、iframe、命令、字体、动画、视觉层、UI 贡献或在线目录，但核心点名、记录、统计和导出仍可使用。插件不能自行关闭或绕过安全模式。

## Web 与 Tauri

先读取 `context.platform` / `context.capabilities`，再决定使用宿主桥接还是 Web fallback。不可用的可选系统能力返回结构化 `UNSUPPORTED_PLATFORM`，插件应安全跳过或显示平台专属 UI，不应直接调用 PowerShell、CMD、Tauri API 或宿主内部模块。

视觉表面必须在 `perfAnimations === false` 或 `reducedMotion === true` 时停止计时器/动画帧并清空非必要动态画布，恢复后只启动一个渲染循环。`src/visual.js` 展示了完整生命周期。

## SDK 版本

模板在 `vendor/` 中携带已验证的 `@starcyrene/cyrene-name-roller@1.4.0` SDK 包，因此克隆后无需 registry Token 即可安装。升级 SDK 时，应同步替换 vendor 包并更新 `package.json`、`pnpm-lock.yaml` 与 `manifest.json` 的 `engine`。

## 发布插件

推送 `v1.2.3` 格式的 tag，Release 工作流会用 pnpm 校验、生成 `.cnrp` 并上传。插件目录只需登记仓库和资源匹配规则：

```json
{
  "repository": "owner/repository",
  "release": {
    "provider": "github",
    "channel": "latest",
    "assetPattern": "your-plugin-*.cnrp"
  }
}
```

宿主会通过 GitHub API 获取最新正式版、下载地址和 Release asset SHA-256。完整参考见 [GitHub Pages：API 1.4、Fluent 组件画廊与安全边界](http://cnrp-template.cyrene.hk)。
