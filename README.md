# AutumnHunt 🌾

AutumnHunt 是一个面向秋招同学的个人全流程管理工具。当前版本：**v0.3.0 (Phase 3)**。

## ✨ 在线体验

- https://你的用户名.github.io/autumnhunt

## v0.3.0 核心能力

- GitHub Device Flow 登录（无需后端 / 无需 Client Secret）
- 自动创建个人私有仓库 `autumnhunt-data`
- 云端持久化：`companies.json / applications.json / interviews.json / events.json / meta.json`
- 多设备同步（登录同一 GitHub 账号即可拉取）
- 离线可编辑（localStorage 继续缓存，联网后自动同步）
- Header 全局同步状态指示器
- 设置页新增账号、同步、备份、分享、关于

## 技术栈

- React 18 + Vite + TypeScript
- Zustand + persist（本地缓存）
- Octokit（GitHub REST API）
- Tailwind CSS + shadcn 风格组件
- react-hook-form + zod
- qrcode.react + JSZip

## 快速开始

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## GitHub Device Flow 配置

配置文件：`src/config/github.ts`

```ts
export const GITHUB_CLIENT_ID = 'Ov23lihTe124binImx3m'
export const GITHUB_SCOPES = 'repo'
export const DEFAULT_DATA_REPO = 'autumnhunt-data'
export const CORS_PROXY = 'https://cors.isomorphic-git.org'
```

> 说明：
> - Device Flow 的 `device_code` 和 `access_token` 端点走 CORS 代理。
> - `api.github.com` 数据读写直接调用，无需代理。

## 数据模型（云端 JSON）

每个文件采用统一 Envelope：

```json
{
  "schemaVersion": 1,
  "updatedAt": "ISO",
  "deviceId": "uuid",
  "data": []
}
```

## 分享给朋友（零门槛）

1. 把网站链接发给朋友。
2. 朋友首次打开后点击「用 GitHub 登录」。
3. AutumnHunt 会在朋友自己的 GitHub 下创建独立私有仓库 `autumnhunt-data`。
4. 每个人的数据互不干扰，完全归属本人账号。

## 本地部署到 GitHub Pages

已配置：
- `vite.config.ts`：`base: '/autumnhunt/'`
- `package.json`：`deploy: gh-pages -d dist`

```bash
npm run build
npm run deploy
```

## 安全说明

- 不使用 Client Secret
- token 本地加密存储（Web Crypto AES-GCM）
- token 不写入日志
- 仅申请 `repo` scope

## 反馈

- Issues: https://github.com/ZHANG-Shuyue/autumnhunt/issues
