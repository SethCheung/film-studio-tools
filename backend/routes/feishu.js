/**
 * 飞书日历路由
 * 提供节点与飞书日历的同步功能
 */

const express = require('express');
const router = express.Router();
const feishu = require('../services/feishu');
const db = require('../db/database');

/**
 * 飞书配置状态
 */
router.get('/status', (req, res) => {
    res.json({
        code: 0,
        data: {
            configured: feishu.isConfigured(),
            message: feishu.isConfigured() 
                ? '飞书日历已配置' 
                : '请配置 FEISHU_APP_ID 和 FEISHU_APP_SECRET'
        }
    });
});

/**
 * 同步单个节点到飞书日历
 * POST /api/feishu/sync-node
 */
router.post('/sync-node', async (req, res) => {
    try {
        if (!feishu.isConfigured()) {
            return res.status(400).json({
                code: 1,
                message: '飞书未配置，请在环境变量中设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET'
            });
        }

        const { nodeId, projectName } = req.body;
        
        if (!nodeId) {
            return res.status(400).json({
                code: 1,
                message: '缺少 nodeId 参数'
            });
        }

        // 从数据库获取节点信息
        const node = db.prepare(`
            SELECT n.*, p.name as project_name 
            FROM nodes n 
            LEFT JOIN projects p ON n.project_id = p.id 
            WHERE n.id = ?
        `).get(nodeId);

        if (!node) {
            return res.status(404).json({
                code: 1,
                message: '节点不存在'
            });
        }

        // 检查是否已有飞书日程ID
        const existingEventId = node.feishu_event_id;

        let result;
        if (existingEventId) {
            // 更新现有日程
            result = await feishu.updateEvent(existingEventId, {
                ...node,
                project_name: projectName || node.project_name
            });
            
            if (result.code !== 0) {
                return res.status(400).json({
                    code: 1,
                    message: `更新飞书日程失败: ${result.msg}`
                });
            }
        } else {
            // 创建新日程
            result = await feishu.createEvent({
                ...node,
                project_name: projectName || node.project_name
            });
            
            if (result.code !== 0) {
                return res.status(400).json({
                    code: 1,
                    message: `创建飞书日程失败: ${result.msg}`
                });
            }

            // 保存飞书日程ID到数据库
            db.prepare(`
                UPDATE nodes SET feishu_event_id = ? WHERE id = ?
            `).run(result.data.id, nodeId);
        }

        res.json({
            code: 0,
            message: existingEventId ? '已更新到飞书日历' : '已同步到飞书日历',
            data: {
                eventId: result.data.id,
                eventUrl: result.data.html_link || `https://feishu.cn/calendar`
            }
        });

    } catch (error) {
        console.error('飞书同步失败:', error);
        res.status(500).json({
            code: 1,
            message: `同步失败: ${error.message}`
        });
    }
});

/**
 * 从飞书日历删除日程
 * DELETE /api/feishu/delete-event/:eventId
 */
router.delete('/delete-event/:eventId', async (req, res) => {
    try {
        if (!feishu.isConfigured()) {
            return res.status(400).json({
                code: 1,
                message: '飞书未配置'
            });
        }

        const { eventId } = req.params;
        
        const result = await feishu.deleteEvent(eventId);
        
        if (result.code !== 0) {
            return res.status(400).json({
                code: 1,
                message: `删除失败: ${result.msg}`
            });
        }

        res.json({
            code: 0,
            message: '已从飞书日历删除'
        });

    } catch (error) {
        console.error('删除飞书日程失败:', error);
        res.status(500).json({
            code: 1,
            message: `删除失败: ${error.message}`
        });
    }
});

/**
 * 同步项目的所有节点到飞书
 * POST /api/feishu/sync-project
 */
router.post('/sync-project', async (req, res) => {
    try {
        if (!feishu.isConfigured()) {
            return res.status(400).json({
                code: 1,
                message: '飞书未配置'
            });
        }

        const { projectId } = req.body;
        
        if (!projectId) {
            return res.status(400).json({
                code: 1,
                message: '缺少 projectId 参数'
            });
        }

        // 获取项目信息
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
        if (!project) {
            return res.status(404).json({
                code: 1,
                message: '项目不存在'
            });
        }

        // 获取所有节点
        const nodes = db.prepare('SELECT * FROM nodes WHERE project_id = ?').all(projectId);
        
        const results = {
            success: [],
            failed: []
        };

        for (const node of nodes) {
            try {
                const syncResult = await feishu.createEvent({
                    ...node,
                    project_name: project.name
                });
                
                if (syncResult.code === 0) {
                    // 保存飞书日程ID
                    db.prepare('UPDATE nodes SET feishu_event_id = ? WHERE id = ?')
                        .run(syncResult.data.id, node.id);
                    results.success.push({
                        nodeId: node.id,
                        nodeName: node.name,
                        eventId: syncResult.data.id
                    });
                } else {
                    results.failed.push({
                        nodeId: node.id,
                        nodeName: node.name,
                        error: syncResult.msg
                    });
                }
            } catch (err) {
                results.failed.push({
                    nodeId: node.id,
                    nodeName: node.name,
                    error: err.message
                });
            }
        }

        res.json({
            code: 0,
            message: `同步完成：成功 ${results.success.length} 个，失败 ${results.failed.length} 个`,
            data: results
        });

    } catch (error) {
        console.error('批量同步失败:', error);
        res.status(500).json({
            code: 1,
            message: `同步失败: ${error.message}`
        });
    }
});

module.exports = router;
