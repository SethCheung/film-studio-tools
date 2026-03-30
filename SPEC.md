# Film Studio Tools - 技术规格说明书

## 1. 项目概述

**项目名称：** Film Studio Tools
**项目类型：** 影视制作公司内部工具套件
**核心功能：** 项目时间线管理、报价单生成
**目标用户：** 影视制作公司内部团队

## 2. 产品功能

### 2.1 项目时间线管理（Timeline Manager）

#### 核心功能
- **项目管理**：创建、编辑、删除项目（名称、制片、描述、周期）
- **节点管理**：为项目添加/编辑/删除时间节点
- **三视图展示**：月历视图、时间线视图、甘特图视图
- **数据导出**：Markdown / CSV / Excel / PDF / JSON / 时间表文本

#### 节点类型（影视工作流）
| 节点名称 | 默认部门 | 颜色 |
|----------|----------|------|
| 创意A / 创意B / 创意定稿 | 导演创意组 | 蓝 |
| 分镜A / 分镜B / 分镜定稿 | 导演创意组 | 绿 |
| 美术方案 | 美术设计组 | 橙 |
| PPM / F-PPM | 机动 | 紫 |
| 拍摄日 | 机动 | 红 |
| A-CO / B-CO / C-CO / 交付 | 后期组 | 粉/青 |

#### 部门与成员
- **后期组**：黄灏（负责人）、潘晓然、顾达发、姜枫、余鑫水、于坤阳、冯瀚霖、张凯楠、周冰聪
- **导演创意组**：张弨（负责人）、张听雨、付诗琴、肖扬、柳西航
- **美术设计组**：李梦玲（负责人）、冉依林、王唯森
- **摄影组**：张裕浓（负责人）、聂建航、卢佳捷、张勇、吕德轩

#### 制片人员
董雨奇、王丹阳、欧羑泓、罗林、张梓航、潘晓然、冯瀚霖、黄灏

#### 节日历
内置中国2025-2026年法定节假日及调休上班日，自动高亮显示。

### 2.2 报价单生成（Quote Generator）
- [ ] 报价单模板管理
- [ ] 客户信息管理
- [ ] 服务项目明细
- [ ] 导出 PDF/Excel

### 2.3 飞书连动（Feishu Integration）
- [x] 项目节点同步到飞书日历
- [x] 单节点同步到飞书
- [x] 批量项目同步到飞书
- [x] 飞书日程创建、更新、删除
- [ ] 飞书机器人消息推送
- [ ] 项目节点到期提醒
- [ ] 飞书审批流程对接

### 2.4 AI 助手（后续）
- [ ] 本地 LLM 推理（AMD AImax 395+）
- [ ] 智能节点建议
- [ ] 剧本分析自动排期

## 3. 技术架构

### 3.1 整体架构
```
Browser (PWA)
    │
    ▼
Backend API (Express.js) ──── SQLite Database
    │
    ▼
Cloudflare Tunnel → 公共访问
```

### 3.2 后端技术栈
- **运行时**：Node.js 20+
- **框架**：Express.js
- **数据库**：SQLite 3（文件：`data/film-studio.db`）
- **ORM**：better-sqlite3
- **API 风格**：RESTful JSON API
- **部署**：M3 Ultra Mac（物理机）/ Cloudflare Tunnel

### 3.3 前端技术栈
- **技术**：原生 HTML5 + CSS3 + JavaScript（ES6+）
- **无框架依赖**：保持轻量
- **渐进式 Web 应用（PWA）**：支持离线缓存、移动端安装
- **动画**：CSS transitions（60fps 流畅动画）
- **响应式**：移动端优先设计

### 3.4 目录结构
```
film-studio-tools/
├── SPEC.md
├── README.md
├── package.json
├── .gitignore
├── backend/
│   ├── server.js           # Express 入口
│   ├── routes/
│   │   ├── projects.js     # 项目 CRUD
│   │   └── nodes.js        # 节点 CRUD
│   ├── db/
│   │   ├── schema.sql      # 数据库表结构
│   │   └── database.js     # SQLite 连接
│   └── data/               # SQLite 数据库文件目录
├── frontend/
│   ├── index.html          # 时间线管理
│   ├── quote.html          # 报价单
│   ├── manifest.json       # PWA 配置
│   ├── sw.js               # Service Worker
│   └── css/
│       └── style.css
└── docs/
    └── DEPLOY.md           # 部署文档
```

## 4. 数据库设计

### 4.1 项目表（projects）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | UUID |
| name | TEXT NOT NULL | 项目名称 |
| producer | TEXT | 制片 |
| description | TEXT | 描述 |
| start_date | TEXT | 开始日期（YYYY-MM-DD）|
| end_date | TEXT | 结束日期（YYYY-MM-DD）|
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### 4.2 节点表（nodes）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | UUID |
| project_id | TEXT NOT NULL | 所属项目（外键）|
| name | TEXT NOT NULL | 节点名称 |
| color | TEXT | 颜色标签 |
| start_date | TEXT NOT NULL | 开始日期 |
| end_date | TEXT NOT NULL | 结束日期 |
| dept | TEXT | 负责部门 |
| leader | TEXT | 负责人 |
| members | TEXT | 执行人员（JSON 数组）|
| note | TEXT | 备注 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

## 5. API 接口

### 5.1 项目接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/projects | 获取所有项目 |
| GET | /api/projects/:id | 获取单个项目 |
| POST | /api/projects | 创建项目 |
| PUT | /api/projects/:id | 更新项目 |
| DELETE | /api/projects/:id | 删除项目 |

### 5.2 节点接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/projects/:id/nodes | 获取项目所有节点 |
| POST | /api/projects/:id/nodes | 创建节点 |
| PUT | /api/nodes/:id | 更新节点 |
| DELETE | /api/nodes/:id | 删除节点 |

## 6. 访问控制

**无账号体系** — 通过共享访问密码保护。

- 用户首次访问时输入团队密码
- 密码正确后进入主界面
- 密码存储在后端配置文件（`.env`）

## 7. 移动端支持

- **PWA**：支持「添加到主屏幕」
- **Service Worker**：离线缓存，60fps 流畅动画
- **响应式布局**：sidebar 折叠、触摸友好的大按钮
- **手势支持**：节点拖拽调整日期

## 8. 开发计划

### Phase 1 - MVP（本次迭代）
- [x] SPEC.md
- [ ] GitHub 仓库初始化
- [ ] 后端骨架（Express + SQLite）
- [ ] 前端适配
- [ ] PWA 配置
- [ ] 部署文档
- [ ] Cloudflare Tunnel 部署

### Phase 2 - 完善
- [ ] 报价单工具
- [ ] 移动端优化

### Phase 3 - 连动
- [ ] 飞书机器人
- [ ] 飞书消息推送

### Phase 4 - AI
- [ ] AMD AImax LLM 推理
- [ ] AI 智能建议