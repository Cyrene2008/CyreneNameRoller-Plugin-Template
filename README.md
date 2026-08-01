# CyreneNameRoller Plugin Template

CyreneNameRoller 官方插件模板。点击 GitHub 的 **Use this template** 创建仓库，即可开发能够运行于 Web 与 Tauri 的 `.cnrp` 插件。

- 原生 Fluent 设置页面，不需要自行实现 iframe UI。
- Worker 事件与权限化 RPC 示例。
- GitHub Actions 自动校验、打包 Release 和部署 Pages。
- Pages 提供 Fluent 组件画廊、事件、权限及全部 RPC 参考。

## 使用模板

1. 使用本仓库创建新仓库。
2. 修改 `manifest.json` 中的反向域名 ID、名称、开发者和版本。
3. 修改 `src/worker.js`，只申请实际需要的权限。
4. 安装 SDK 并校验：

```bash
npm install
npm run validate
npm run build
```

生成的插件位于 `dist/cyrene-plugin-template.cnrp`。本地调试时可在 CyreneNameRoller 的插件页面导入 `.cnrp`。

## SDK 版本

模板在 `vendor/` 中携带由主项目官方打包流程生成的 SDK `.tgz`，因此克隆后无需 registry Token 即可安装。升级 SDK 时，用新版官方包替换该文件并同步更新 `package.json`。

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

## 插件数据边界

插件可写入自己的 `storage` 命名空间。名单、抽取历史、统计数据和平衡参数仅提供只读快照，不存在对应写入 RPC。

完整参考请访问 [GitHub Pages：Fluent 组件画廊与 API 文档](https://cyrene2008.github.io/CyreneNameRoller-Plugin-Template/)。
