require('dotenv').config();
const express = require('express');
const path = require('path');
const { init } = require('./db/database');
const projectsRouter = require('./routes/projects');
const nodesRouter = require('./routes/nodes');
const feishuRouter = require('./routes/feishu');

// 初始化数据库
init();

// ============ 主站 (3000) ============
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API 路由
app.use('/api/nodes', nodesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/feishu', feishuRouter);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ code: 0, message: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 主站运行中: http://localhost:${PORT}`);
    console.log(`📅 Timeline: http://localhost:${PORT}/index.html`);
});

// ============ 飞书专用版 (3001) ============
const feishuApp = express();
const FEISHU_PORT = 3001;

feishuApp.use(express.json());
feishuApp.use(express.static(path.join(__dirname, '..', 'frontend')));

// 强制手机优化模式
feishuApp.use((req, res, next) => {
    req.headers['x-mobile-mode'] = 'true';
    next();
});

// API 路由（共享）
feishuApp.use('/api/nodes', nodesRouter);
feishuApp.use('/api/projects', projectsRouter);
feishuApp.use('/api/feishu', feishuRouter);

feishuApp.get('/api/health', (req, res) => {
    res.json({ code: 0, message: 'Feishu Version', timestamp: new Date().toISOString() });
});

feishuApp.listen(FEISHU_PORT, () => {
    console.log(`📱 飞书版运行中: http://localhost:${FEISHU_PORT}`);
    console.log(`🔗 飞书工作台地址: http://129.204.27.64:${FEISHU_PORT}/feishu.html`);
});