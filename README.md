# CyreneNameRoller Plugin Template

CyreneNameRoller Plugin API 1.1 官方模板。点击 GitHub 的 **Use this template** 创建仓库，即可开发同时适配 Web 与 Tauri 的 `.cnrp` 插件。

本模板不只是一个“设置页插件”：

- `manifest.json` 声明宿主原生 Fluent 设置页、Dock 一级页面、动画包和背景视觉层。
- `pages/draw-studio.*` 展示页面级大型功能，并通过 `draw.execute` 使用宿主 CAF、统计与记录事务。
- `src/worker.js` 展示插件生命周期、只读事件、插件私有存储、音频和页面内通知。
- `animations/template-motion.json` 覆盖页面切换、点名、发牌、翻牌、抽奖与全局动画目标。
- `src/visual.js` 展示独立 OffscreenCanvas Worker、主题/尺寸生命周期和结果粒子反馈。
- GitHub Actions 自动校验、打包 Release 和部署 Pages API/Fluent 图鉴。

## 使用模板

1. 使用本仓库创建新仓库。
2. 修改 `manifest.json` 中的反向域名 ID、名称、开发者和版本。
3. 删除不需要的贡献项与权限，只保留实际使用的能力。
4. 安装 SDK 并校验：

```bash
npm install
npm run validate
npm run build
```

生成的插件位于 `dist/cyrene-plugin-template.cnrp`。本地调试时可在 CyreneNameRoller 的插件页面导入 `.cnrp`。

## API 1.1 示例地图

| 目标 | 示例文件 | 关键能力 |
| --- | --- | --- |
| 宿主原生配置 | `manifest.json` | `native.settings`、`animation-select` |
| Dock 大型页面 | `pages/draw-studio.*` | `location: "dock"`、`window.CyrenePlugin.request()` |
| 新点名玩法 | `pages/draw-studio.js` | `draw.execute`，宿主生成并提交结果 |
| 事件与轻量后台逻辑 | `src/worker.js` | `events:draw`、`events:lifecycle` |
| 动画扩展 | `animations/template-motion.json` | 受校验的 WAAPI 关键帧 |
| Canvas/WebGL 表现层 | `src/visual.js` | `defineVisualSurface()`、OffscreenCanvas |

HTML 页面适合大型交互，但它运行在受控页面环境中，不能直接访问宿主 DOM。普通设置优先使用宿主原生 schema，能够自动继承桃粉、Fluent、自定义主题以及深浅模式。

## SDK 版本

模板在 `vendor/` 中携带官方 `@cyrene2008/cyrene-name-roller@1.1.0` SDK `.tgz`，因此克隆后无需 registry Token 即可安装。升级 SDK 时，用新版官方包替换该文件，并同步更新 `package.json`、锁文件与 `manifest.json` 的 `engine`。

## 发布插件

推送 `v1.2.3` 格式的 tag，Release 工作流会生成 `.cnrp` 并上传。插件目录只需登记仓库和资源匹配规则：

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

宿主会通过 GitHub API 自动获得最新正式版、下载地址和 Release asset SHA-256。

## 公平与安全边界

插件的创作自由主要存在于页面、交互、动画、音频、Canvas/WebGL 表现和新玩法流程；核心抽取结果仍由宿主掌握。

- 插件可以读取名单、既有记录、统计和公开平衡状态的快照（需相应权限）。
- 插件可以调用 `draw.execute` 提交名单、目标、性别、数量和是否允许重复等筛选条件。
- 宿主使用 CAF/核心算法生成结果，并在同一事务中增加统计、追加带 `pluginId`/`operationId` 的记录。
- 插件不能指定赢家、候选权重或记录正文，也不能修改/删除既有记录、统计与 CAF 参数。
- `storage.write` 只写插件自己的命名空间，不是宿主核心数据写入口。

这条边界允许开发者制作完整的新页面与点名玩法，同时避免插件破坏公平或伪造历史。

## Web 与 Tauri

先读取 `context.platform` / `context.capabilities`，再决定使用宿主桥接还是 Web fallback。不可用的可选系统能力会返回结构化 `UNSUPPORTED_PLATFORM`，插件应安全跳过或显示平台专属 UI，不应直接调用 PowerShell、CMD、Tauri API 或宿主内部模块。

完整参考请访问 [GitHub Pages：API 1.1、Fluent 组件画廊与扩展点文档](https://cyrene2008.github.io/CyreneNameRoller-Plugin-Template/)。
