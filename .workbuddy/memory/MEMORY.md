# MEMORY.md - 长期记忆

## 身份
- 我叫**热浪工作助手** 🔥
- 务实、高效、有个性

## 用户公司需求
- 时间表 / 日程管理工具
- 报价单生成系统
- 其他公司业务软件

## 工作区
- 主工作区：/Users/seth/WorkBuddy/20260328221156
- 记忆文件：/Users/seth/WorkBuddy/20260328221156/.workbuddy/memory/

## 项目进度
- **Film Studio Tools** - 影视公司内部工具
- 已完成：时间线三视图（月历/时间线/甘特图）、拖拽、导出
- 已添加：飞书日历同步功能（后端API + 前端按钮）
- 已添加：总览日历视图（所有项目一览）
- 已修复：节点无法保存的严重Bug（API路径错误 + 缺少错误处理）
- 待完成：报价单生成器

## 总览日历视图 (2026-03-31)
**改进内容**：
1. 侧边栏总览入口改为醒目的渐变卡片设计（蓝色渐变 + 图标 + 箭头）
2. 总览视图布局优化：日历全宽显示，项目卡片移到侧边栏
3. 添加项目图例：日历下方显示各项目颜色标识
4. 项目卡片可点击快速进入项目详情

**CSS新增**：
- `.overview-entry` - 醒目总览入口卡片
- `.overview-projects` / `.overview-project-card` - 侧边栏项目卡片
- `.overview-legend` - 项目颜色图例

**排版Bug修复 (2026-03-31)**：
**问题**：总览日历星期标题垂直排列、格子错位
**根本原因**：
- 总览日历使用 `.cal-hdr` + `.cal-body` 结构
- 普通日历使用 `.cal-box` + `.cal-hdr` + `.cal-grid` 结构
- CSS选择器不匹配（如 `.side .cal-grid` 不匹配总览日历的 `.cal-body`）
**修复内容**：
- 修改 `renderOverviewCalendar` 中的 `renderMonth` 函数
- 使用与普通日历一致的 HTML 结构：`<div class="cal-box"><div class="cal-hdr"><div class="cal-grid">`
- 星期标题改用 `.wd` 类（与普通日历一致）
- 日期格子在 `.cal-grid` 中统一排列（7列grid布局）

## Bug修复记录 (2026-03-30)
### 节点无法保存问题
**问题根因**：
1. API路径错误：前端调用 `/api/projects/:id/nodes`，但后端实际路径是 `/api/nodes/projects/:id/nodes`
2. 缺少错误处理：保存失败时无任何提示，用户误以为保存成功
3. selectProject 不获取节点列表：保存后刷新页面节点不显示

**修复内容**：
- 前端：`/api/projects/` → `/api/nodes/projects/`
- 前端：添加 try-catch 错误处理和用户反馈
- 前端：selectProject 同时调用节点列表API
- 后端：增强详细错误日志

### 飞书版抽屉意外打开问题
**问题**：每次点开节点后都会进入选择项目（抽屉被意外打开）

**问题根因**：
- `selectProject()` 函数末尾无条件调用 `toggleProjectDrawer()`（toggle切换）
- 节点保存/删除/拖拽后调用 `selectProject()` 刷新，导致抽屉被意外打开

**修复内容**：
- 修改 `selectProject()` 函数：只在抽屉打开时才关闭
- 新增 `refreshProjectData()` 函数：仅刷新数据不操作抽屉
- 节点操作后（保存/删除/拖拽/同步）改用 `refreshProjectData()`

### 电脑端UI为移动端妥协
**问题**：电脑端页面布局不适合桌面端使用

**修复内容**：
- 添加 `@media (min-width: 1440px)` 大屏幕适配
- 添加 `@media (min-width: 1920px)` 超大屏幕适配
- 扩大侧边栏宽度、增加内容区内边距、优化日历三列布局

## 飞书集成
- 已配置飞书自建应用（App ID: cli_a94a7c7fab78dbd8）
- 使用飞书开放平台日历 API v4
- 支持节点同步到飞书日历，包含提醒设置
- 凭证已写入 .env 文件（FEISHU_APP_ID、FEISHU_APP_SECRET）
- **权限已全部开通并验证成功**：日历读写、创建日程、删除日程、提醒设置

## 双机协作开发环境
### M3 Ultra (Mac Studio M3 Ultra)
- IP: 192.168.1.123
- 用户: seth
- 密码: 7335
- **本地模型**: Qwen3.5-397B-A17B-4bit (oMLX)
  - 启动命令: `/Applications/oMLX.app/Contents/MacOS/python3 -m omlx.cli serve --base-path /Users/seth/.omlx --port 8001`
  - API端点: `http://localhost:8001/v1`
  - API Key: `123456`
  - 日志文件: `~/.omlx/omlx-8001.log`
  - 兼容OpenAI格式

### AI Max (Ubuntu 24.04)
- IP: 192.168.1.238
- 用户: seth
- 密码: Sjm744546
- **本地模型**: Qwen3-72B-Instruct-Q5_K_M (llama.cpp)
  - 启动命令: `~/llama-env/bin/python3 llm_server.py`
  - API端点: `http://localhost:8080/v1`
  - 日志文件: `/tmp/llm.log`
  - 兼容OpenAI格式

### SSH跳板连接
- Mac mini跳板机: 100.99.135.88 (用户: seth, 密码: 7335)
- 通过Mac mini连接内网机器:
  ```bash
  # 连接M3 Ultra
  sshpass -p "7335" ssh seth@100.99.135.88 "sshpass -p '7335' ssh seth@192.168.1.123 ..."
  # 连接AI Max
  sshpass -p "7335" ssh seth@100.99.135.88 "sshpass -p 'Sjm744546' ssh seth@192.168.1.238 ..."
  ```

### 腾讯云生产服务器
- IP: 129.204.27.64
- 用户: ubuntu
- 密码: Sjm744546
- 用途: 部署 Film Studio Tools 生产环境
- 服务端口: 3000
- 公网地址: http://129.204.27.64:3000

## UI品牌化
- 已应用SJM Films品牌设计风格
- 主色：深蓝 #1A1A2E + 亮蓝 #00A0E9
- Logo：SJM Films 品牌标识
- 官网：https://sjmfilms.com/

## 公司软路由 (iStoreOS)
### 网络结构
- 上级路由: 192.168.5.1
- 软路由 WAN: 192.168.5.2
- 软路由 LAN: 192.168.1.5 (公司内网网关)

### Tailscale 远程访问
- 软路由 Tailscale IP: `100.86.152.67`
- SSH 用户: root
- SSH 密钥: `~/.ssh/istoreos` (ED25519)
- 连接命令: `ssh -i ~/.ssh/istoreos root@192.168.1.5`

### 已安装软件
- Tailscale 1.80.3
- OpenSSH (openssh-server 9.9_p2)

### SSH 配置
- 密钥认证已配置 authorized_keys
- Dropbear SSH 已重启
- Tailscale 接口防火墙规则已添加