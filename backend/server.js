const express = require('express');
const path = require('path');
const { init } = require('./db/database');
const projectsRouter = require('./routes/projects');
const nodesRouter = require('./routes/nodes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API 路由
app.use('/api', nodesRouter);        // 节点路由（包含 /projects/:id/nodes）
app.use('/api/projects', projectsRouter); // 项目路由

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ code: 0, message: 'OK', timestamp: new Date().toISOString() });
});

// 初始化数据库
init();

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Film Studio Tools 运行中: http://localhost:${PORT}`);
    console.log(`📅 Timeline Manager: http://localhost:${PORT}/index.html`);
});