# AutumnHunt 🌾

一个为 2026 届秋招准备的个人管理工具网站（Phase 1：项目骨架 + UI 框架）。

## 项目介绍

AutumnHunt 用于统一管理秋招信息：
- 浏览每日校招公司列表
- 跟踪投递状态与岗位
- 记录面试流程与复盘
- 沉淀公司调研笔记

> 当前版本：v0.1（仅骨架与视觉系统，不含业务逻辑持久化）

## 技术栈

- React 18 + Vite + TypeScript
- Tailwind CSS（自定义莫兰迪奶油系主题）
- React Router v6
- Zustand（store 占位）
- shadcn/ui 风格基础组件（Button、Card、Dialog、Input、Badge、Tabs）
- Lucide React 图标
- GitHub Pages 部署

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址：`http://localhost:5173`

## 构建

```bash
npm run build
```

## 部署到 GitHub Pages

本项目已配置：
- `vite.config.ts` 中 `base: '/autumnhunt/'`
- `package.json` 中 `deploy` 脚本：`gh-pages -d dist`

部署步骤：

```bash
npm run build
npm run deploy
```

> 首次部署前请确保：
> 1. 仓库名为 `autumnhunt`（或同步修改 `base`）
> 2. GitHub 仓库已推送并有权限创建 `gh-pages` 分支

## 当前阶段已完成功能（Phase 1）

- ✅ 左侧固定侧边栏 + 顶部 Header + 内容区整体布局
- ✅ 全局莫兰迪奶油系设计 token、圆角与阴影系统
- ✅ 路由骨架：
  - `/`
  - `/companies`
  - `/companies/:id`
  - `/applications`
  - `/applications/:id`
  - `/interviews`
  - `/settings`
- ✅ 页面占位 UI：
  - Dashboard 统计卡片 + 今日新增 + 面试日程
  - 公司库搜索区 + Tabs + 卡片网格
  - 投递追踪 Kanban 五列看板
  - 面试记录时间线
  - 详情页/设置页 Coming soon 占位
- ✅ mock 数据与类型定义（Company / Application / Interview）
- ✅ Zustand store 占位文件

## 下一阶段计划（Phase 2）

- [ ] 接入 localStorage 持久化
- [ ] 实现公司/投递/面试的增删改查
- [ ] 详情页真实数据联动
- [ ] 过滤、搜索、排序与统计联动
- [ ] GitHub 私有仓库同步能力（后续）

