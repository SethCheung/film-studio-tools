# 飞书日历集成配置指南

本项目支持将项目节点同步到飞书日历，实现团队日程统一管理。

## 1. 创建飞书自建应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 登录后进入「开发者后台」
3. 点击「创建企业自建应用」
4. 填写应用名称（如：Film Studio Tools）和描述
5. 创建后，在「凭证与基础信息」中获取：
   - `App ID`（格式：`cli_xxxxxxxxxxxx`）
   - `App Secret`

## 2. 配置应用权限

1. 进入应用 → 「权限管理」
2. 开通以下日历相关权限：

| 权限名称 | 权限标识 | 说明 |
|---------|---------|------|
| 获取日历列表 | calendar:calendar:read | 读取日历信息 |
| 获取日程 | calendar:calendar.event:read | 读取日程详情 |
| 创建日程 | calendar:calendar.event:create | 创建新日程 |
| 更新日程 | calendar:calendar.event:update | 修改已有日程 |
| 删除日程 | calendar:calendar.event:delete | 删除日程 |

3. 提交版本并等待管理员审核发布

## 3. 配置后端环境变量

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```bash
# 飞书应用配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxx

# 服务端口（可选）
PORT=3000
```

或者在启动时设置环境变量：

```bash
FEISHU_APP_ID=cli_xxxxxxxxxxxx FEISHU_APP_SECRET=xxxxxxxxxxxx node backend/server.js
```

## 4. 功能说明

### 同步方式

1. **项目级别同步**：点击「同步到飞书」按钮，将项目的所有节点一次性同步
2. **节点级别同步**：在时间线视图中，点击单个节点的「飞书」按钮

### 同步内容

每个节点会创建为一个飞书日程，包含：
- 日程标题：`[项目名] 节点名称`
- 日程时间：节点的开始/结束日期
- 日程描述：部门、负责人、执行人员、备注
- 颜色标记：与节点颜色一致
- 提醒设置：提前1天和1小时提醒

### 双向同步

当前版本支持：
- ✅ 从本系统同步到飞书
- ⏳ 从飞书同步回本系统（计划中）

## 5. 常见问题

### Q: 同步失败，显示权限不足？

确保已在飞书开放平台开通所有必需的日历权限，并发布应用版本。

### Q: 如何切换日历？

当前版本默认同步到主日历（primary），如需指定其他日历，可修改 `backend/services/feishu.js` 中的 `primaryCalendar` 配置。

### Q: Token 有效期是多久？

Tenant Access Token 有效期为 2 小时，系统会自动刷新。

## 6. API 参考

飞书日历 API 文档：https://open.feishu.cn/document/server-docs/calendar-v4/overview
