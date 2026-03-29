const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');

// 获取所有项目
router.get('/', (req, res) => {
    try {
        const projects = all('SELECT * FROM projects ORDER BY start_date DESC');
        res.json({ code: 0, data: projects });
    } catch (err) {
        console.error('获取项目失败:', err);
        res.status(500).json({ code: 1, message: '服务器错误' });
    }
});

// 获取单个项目
router.get('/:id', (req, res) => {
    try {
        const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (!project) {
            return res.status(404).json({ code: 1, message: '项目不存在' });
        }
        res.json({ code: 0, data: project });
    } catch (err) {
        console.error('获取项目失败:', err);
        res.status(500).json({ code: 1, message: '服务器错误' });
    }
});

// 创建项目
router.post('/', (req, res) => {
    try {
        const { id, name, producer, description, startDate, endDate } = req.body;
        if (!id || !name || !startDate || !endDate) {
            return res.status(400).json({ code: 1, message: '缺少必填字段' });
        }
        run(
            'INSERT INTO projects (id, name, producer, description, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, producer || '', description || '', startDate, endDate]
        );
        const project = get('SELECT * FROM projects WHERE id = ?', [id]);
        res.json({ code: 0, data: project });
    } catch (err) {
        console.error('创建项目失败:', err);
        res.status(500).json({ code: 1, message: '服务器错误' });
    }
});

// 更新项目
router.put('/:id', (req, res) => {
    try {
        const { name, producer, description, startDate, endDate } = req.body;
        const existing = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ code: 1, message: '项目不存在' });
        }
        run(
            'UPDATE projects SET name = ?, producer = ?, description = ?, start_date = ?, end_date = ? WHERE id = ?',
            [name, producer || '', description || '', startDate, endDate, req.params.id]
        );
        const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        res.json({ code: 0, data: project });
    } catch (err) {
        console.error('更新项目失败:', err);
        res.status(500).json({ code: 1, message: '服务器错误' });
    }
});

// 删除项目（级联删除节点）
router.delete('/:id', (req, res) => {
    try {
        const existing = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ code: 1, message: '项目不存在' });
        }
        run('DELETE FROM nodes WHERE project_id = ?', [req.params.id]);
        run('DELETE FROM projects WHERE id = ?', [req.params.id]);
        res.json({ code: 0, message: '删除成功' });
    } catch (err) {
        console.error('删除项目失败:', err);
        res.status(500).json({ code: 1, message: '服务器错误' });
    }
});

module.exports = router;