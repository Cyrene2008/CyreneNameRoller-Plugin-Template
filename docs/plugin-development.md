# CyreneNameRoller Plugin API 1.5

> **未启用 / migration-only**：本页记录 API 1.5 契约。当前仓库的启用路径是 API 1.4 + `manifest.yml` + `contributions.json`（见仓库 README）。API 1.5 材料仅供迁移参考，默认的 validate / build / test 不使用它们。

This repository is the API `1.5.0` plugin template. API 1.4 and older
installations remain visible to the host as migration metadata, but their code
is never activated and they cannot be published with the API 1.5 CLI.

For the exact backend RPC, permission, error, resource, and native-boundary
contract, see [API 1.5 Backend Contract](api-1.5-backend-contract.md).

## Quick start

```sh
cnrp create my-plugin --template api15
cd my-plugin
cnrp validate .
cnrp pack . --out dist/my-plugin.cnrp
```

The application bundles the `cnrp-runner`; plugin users do not need to install
Node, Bun, or Deno. The SDK is a thin JSON-RPC client. It does not expose
Tauri IPC, Pinia stores, host module imports, or arbitrary host JavaScript.

## Project layout

```text
my-plugin/
  manifest.json
  src/worker.js
  pages/main.html
  assets/
  README.md
```

## Manifest

API 1.5 uses an explicit API marker and exact declarations. Unknown fields are
rejected so a permission cannot be broadened accidentally.

```json
{
  "api": "1.5",
  "schemaVersion": 1,
  "id": "cn.example.my-plugin",
  "version": "1.0.0",
  "name": "My Plugin",
  "author": "Your Name",
  "description": "A short description.",
  "entry": {
    "runtime": "cnrp-runner",
    "script": "src/worker.js",
    "args": []
  },
  "platforms": ["web", "tauri"],
  "permissions": [
    { "id": "core:names:read", "required": false, "platforms": ["web", "tauri"] },
    { "id": "page:read", "required": true, "platforms": ["web", "tauri"] },
    { "id": "style:main", "required": false, "platforms": ["web", "tauri"] }
  ],
  "files": {
    "app": { "read": true, "write": false, "execute": false },
    "external": []
  },
  "network": { "internet": false },
  "windows": {
    "create": false,
    "main": { "control": false },
    "floating": { "control": false, "alwaysOnTop": false }
  },
  "pages": [
    {
      "id": "dashboard",
      "location": "main",
      "title": "Dashboard",
      "entry": "pages/main.html",
      "children": []
    }
  ],
  "hooks": [],
  "signature": null
}
```

`engine` is informational only in API 1.5. It is not an activation selector.
The `entry`, `platforms`, permission objects, file scopes, network declaration,
window declaration, pages, hooks, and signature metadata are the canonical
contract. A page must be declared in `pages`; runtime page registration is not
available.

## SDK and lifecycle

```js
import { definePlugin, groups, PluginEvents } from '@starcyrene/cyrene-name-roller/plugin-sdk'

definePlugin({
  async activate(context) {
    this.context = context
    const platform = await context.request('runtime.platform')
    this.names = await groups.core.names.read()
    await context.request('notifications.show', {
      message: `Running on ${platform.runtime}`,
      type: 'info'
    })
  },

  async onEvent(event, payload) {
    if (event === PluginEvents.AFTER_OPERATION) {
      console.log(payload.operationId, payload.committed)
    }
  },

  async deactivate() {
    this.context = null
  }
})
```

The logical lifecycle is `hello` -> `hello.accepted` -> `initialize` ->
`ready`. Activation must complete within ten seconds. Desktop plugins run in
the bundled runner through authenticated local JSON-RPC. Web plugins run in an
isolated Worker. The host owns processes, Workers, pages, windows, styles,
requests, and audit records.

## SDK groups

The SDK exports these explicit groups. Every method is a brokered RPC and
returns a structured result or throws a typed `PluginApiError`.

| Group | Examples | Boundary |
| --- | --- | --- |
| `page` | `read`, `write`, `writeSensitive` | Host field maps and confirmation |
| `window` | `create`, `close` | Opaque host-owned window IDs |
| `files` | `read`, `write` | Manifest scopes and bounded transfers |
| `net` | `request` | HTTP/HTTPS, DNS, size, timeout, concurrency |
| `state` | `read`, `write` | Alias for ordinary page state |
| `dom` | `query`, `read`, `write`, `insert` | Controlled host DOM operations |
| `core` | `names`, `records`, `statistics`, `balance` | Read-only fairness data |
| `core.hook` | `before`, `after` | Operation hook events and filters |

Example:

```js
const result = await groups.net.request({
  url: 'https://example.com/data.json',
  method: 'GET'
})
```

The SDK has no `dom.execute`. Do not use `eval`, function source, raw HTML,
script URLs, inline event handlers, or native handles.

## Permissions and platforms

Each permission has an `id`, `required` flag, and `platforms` list. A required
permission is checked only when its platform scope applies. An unavailable
required capability prevents activation. An unavailable optional capability
remains visible with `available: false` and returns `UNSUPPORTED_PLATFORM`.

Native-only examples include application file access, external file roots,
window control, and `system:execute`. Web network access is fail-closed when
the browser cannot bind a request atomically to the validated DNS address.

```js
const capabilities = await groups.runtime.capabilities()
const directory = capabilities['system:select-directory']
if (directory?.available) {
  await context.request('system.select-directory')
}
```

`system:execute` is an explicit system-level risk. It requires a manifest
operation with a fixed executable and fixed argument array. Shell strings,
pipelines, arbitrary directories, and runtime command construction are
rejected.

## Pages, state, windows, and styles

Pages are manifest-only contributions. Native host routes come first; plugin
pages then follow plugin load order and manifest declaration order. Use
`location: "main"` or `location: "settings"`, and declare nested `children`
when needed.

Page and window methods return opaque IDs. IDs are scoped to the creating
plugin and are invalid after disable, crash, unload, or safe mode. Initial
limits include four windows, sixteen pages, and thirty-two injected style
handles per plugin.

Ordinary writable state is limited to:

- `language`
- `theme`
- `animation`
- `display`
- `roller.filters.listId`
- `roller.filters.target`
- `roller.filters.count`
- `roller.filters.gender`
- `roller.filters.allowDuplicates`

Sensitive state such as permissions, plugin enablement, list contents,
fairness settings, import/export, record clearing, and window security needs
`page:write-sensitive` plus a host confirmation bound to the exact patch.

`style:main` and `style:settings` allow unrestricted CSS selectors within
bounded style handles. CSS is intentionally powerful enough to affect host
presentation, so style access is shown in installation risk confirmation and
all handles are removed during cleanup.

## Controlled DOM

DOM permissions expose snapshots and structured operations only:

```js
const nodes = await groups.dom.query({
  surface: 'main',
  selector: '[data-plugin-slot]'
})
await groups.dom.write({
  nodeId: nodes[0].nodeId,
  fields: { textContent: 'Updated by the plugin' }
})
await groups.dom.insert({
  nodeId: nodes[0].nodeId,
  node: { type: 'element', tag: 'span', text: 'Status' }
})
```

The host issues opaque node IDs. Snapshots contain bounded tag, text,
attributes, and child-count data. Inserted nodes are created by the host from
allowlisted structured data. Raw HTML, script URLs, inline handlers,
function values, host object references, Tauri globals, and Core Worker ports
are rejected.

## Core operations and fairness

Plugins can request host-owned operations but cannot provide algorithm state,
random values, candidates, results, records, statistics, or next-state data.
Only operation filters are mutable:

```js
const receipt = await groups.core.operations.execute('draw', {
  listId: 'default',
  target: 'people',
  count: 1,
  gender: 'all',
  allowDuplicates: false
})
```

Before hooks execute serially in plugin load order. Later plugins overwrite
earlier values for the four allowed filter fields. A hook can return `allow`
or `abort`; invalid responses, exceptions, disconnects, and timeouts abort the
operation. The host records original, per-plugin, and final filters.

The per-operation hook deadline is three seconds and the cumulative budget is
five seconds. Three hook failures in ten minutes or five explicit aborts in ten
minutes automatically disables the plugin. After hooks are events and are
delivered only after the host commits successfully.

Name draws, card operations, lottery draws, and prize assignment are committed
by the Web Core Worker or Rust core. The core verifies protected state before
each operation, uses host-owned randomness, and returns a durable receipt. An
integrity failure returns recovery-required status and commits nothing.

## File, network, and audit rules

File paths are canonicalized under the declared app or external root. Traversal,
protected core roots, Windows UNC/drive-relative/reparse paths, POSIX symlink
escapes, and undeclared executables are rejected. Binary values use bounded
base64 chunks; raw `Uint8Array` values are not placed in JSON.

Network requests are HTTP/HTTPS only. Redirects cannot change protocol and the
current native/Web brokers deny redirects unless the target can be revalidated.
Loopback, link-local, metadata, private, alternate IPv4, IPv4-mapped IPv6,
and unresolved destinations are denied. Requests have bounded body size,
timeout, and concurrency.

The host keeps append-only audit records with time, plugin ID, instance ID,
method, resource, decision, result code, bytes, duration, and correlation ID.
Network resources are reduced to hostnames; plugin code cannot read audit
storage. Records are bounded by count and storage size.

## Events

Lifecycle events include `app:ready`, `app:route-changed`,
`app:theme-changed`, `app:resize`, and `plugin:storage-changed`. Operation
events include before/after operation notifications and the existing draw,
card, lottery, and prize result events. Payloads are cloned snapshots.

After-operation payloads contain the operation ID, receipt, filter diff, hook
audit, and committed status. They must not be used to replace host-selected
results.

## Signing, publishing, and migration

The CLI validates the exact manifest before packing. A package may include
Ed25519 publisher signature metadata; installation confirmation shows whether
the package is signed and summarizes network, system execution, readable core
categories, DOM/CSS access, and external roots.

The catalog uses GitHub Release metadata rather than pinned download URLs. A
release must contain one matching `.cnrp` asset, use a version-matching tag,
and never include private signing material.

When migrating API 1.4 or older:

1. Keep the installed metadata so the host can display the plugin identity and
   version.
2. Add `api: "1.5"` and convert the string entry and permission list to the
   canonical declarations.
3. Move UI contributions into manifest pages, typed page APIs, styles, or
   controlled DOM operations.
4. Replace result-writing or fairness-changing code with host core operations.
5. Validate and repack with `cnrp validate` and `cnrp pack`.

Safe mode is a clean baseline. It skips plugin initialization, revokes
sessions, stops runner processes, cancels requests, removes styles, unregisters
routes/hooks, disposes session DOM, and reloads affected views as needed. It
does not automatically reset protected core data.

## Limits and errors

Important structured errors include:

- `UNSUPPORTED_PLATFORM`
- `PERMISSION_DENIED`
- `PENDING_CONFIRMATION`
- `RESOURCE_LIMIT`
- `PLUGIN_INSTANCE_REVOKED`
- `CORE_INTEGRITY_FAILURE`

The host enforces limits for RPC frames, binary operations, windows, pages,
styles, DOM insertions, concurrent RPC/network/file operations, and process
lifetime. Treat limit errors as terminal for the current request and release
local resources in `deactivate`.
