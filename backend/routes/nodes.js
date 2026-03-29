const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');

// 获取项目的所有节点
router.get('/projects/:projectId/nodes', (req, res) => {
    try {
        const nodes = all('SELECT * FROM nodes WHERE project_id = ? ORDER BY start_date ASC', [req.params.projectId]);
        // 解析 members JSON
        const parsedNodes = nodes.map(n => ({
            ...n,
            start_date: n.start_date,
            end_date: n.end_date,
            members: JSON.parse(n.members || '[]')
        }));
        res.json({ code: 0, data: parsedNodes });
    } catch (err) {
        console.error('获取节点失败:', err);
        res.status(500).json({ code: 1, message: '服务器错误' });
    }
});

// 创建节点
router.post('/projects/:projectId/nodes', (req, res) => {
    try {
        const { id, name, color, startDate, endDate, dept, leader, members, note } = req.body;
        if (!id || !name || !startDate || !endDate) {
            return res.status(400).json({ code: 1, message: '缺少必填字段' });
        }
        const membersJson = JSON.stringify(members || []);
        run(
            'INSERT INTO nodes (id, project_id, name, color, start_date, end_date, dept, leader, members, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, req.params.projectId, name, color || 'blue', startDate, endDate, dept || '', leader || '', membersJson, note || '']
        );
        const node = get('SELECT * FROM nodes WHERE id = ?', [id]);
        res.json({ code: 0, data: { ...node, members: JSON.parse(node.members) } });
    } catch (err) {
        console.error('创建节点失败:', err);
        res.status(500).json({ code: 1, message: '服务器错误' });
    }
});

// 更新节点
router.put('/nodes/:id', (req, res) => {
    try {
        const { name, color, startDate, endDate, dept, leader, members, note } = req.body;
        const existing = get('SELECT * FROM nodes WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ code: 1, message: '节点不存在' });
        }
        const membersJson = JSON.stringify(members || []);
        run(
            'UPDATE nodes SET name = ?, color = ?, start_date = ?, end_date = ?, dept = ?, leader = ?, members = ?, note = ? WHERE id = ?',
            [name, color || 'blue', startDate, endDate, dept || '', leader || '', membersJson, note || '', req.params.id]
        );
        const node = get('SELECT * FROM nodes WHERE id = ?', [req.params.id]);
        res.json({ code: 0, data: { ...node, members: JSON.parse(node.members) } });
    } catch (err) {
        console.error('更新节点失败:', err);
        res.status(500).json({ code: 1, message: '服务器错误' });
    }
});

// 删除节点
router.delete('/nodes/:id', (req, res) => {
    try {
        const existing = get('SELECT * FROM nodes WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ code: 1, message: '节点不存在' });
        }
        run('DELETE FROM nodes WHERE id = ?', [req.params.id]);
        res.json({ code: 0, message: '删除成功' });
    } catch (err) {
        console.error('删除节点失败:', err);
        res.status(500).json({ code: 1, message: '服务器错误' });
    }
});

module.exports = router;