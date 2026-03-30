/**
 * 飞书日历 API 服务
 * 基于飞书开放平台日历 API v4
 * 
 * 文档：https://open.feishu.cn/document/server-docs/calendar-v4/overview
 */

const axios = require('axios');

// 飞书开放平台配置
const FEISHU_CONFIG = {
    baseUrl: 'https://open.feishu.cn',
    appId: process.env.FEISHU_APP_ID || '',
    appSecret: process.env.FEISHU_APP_SECRET || '',
    // 日历ID：primary 表示主日历，也可以指定其他日历ID
    primaryCalendar: 'primary'
};

class FeishuCalendarService {
    constructor() {
        this.tenantAccessToken = null;
        this.tokenExpireTime = 0;
    }

    /**
     * 获取 Tenant Access Token
     * 有效期2小时，需要缓存复用
     */
    async getTenantAccessToken() {
        // 如果token还有效，直接返回
        if (this.tenantAccessToken && Date.now() < this.tokenExpireTime) {
            return this.tenantAccessToken;
        }

        try {
            const response = await axios.post(
                `${FEISHU_CONFIG.baseUrl}/auth/v3/tenant_access_token/internal`,
                {
                    app_id: FEISHU_CONFIG.appId,
                    app_secret: FEISHU_CONFIG.appSecret
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.code === 0) {
                this.tenantAccessToken = response.data.tenant_access_token;
                // 提前5分钟过期
                this.tokenExpireTime = Date.now() + (response.data.expire * 1000) - 300000;
                console.log('✅ 飞书 Token 获取成功');
                return this.tenantAccessToken;
            } else {
                throw new Error(`获取Token失败: ${response.data.msg}`);
            }
        } catch (error) {
            console.error('❌ 飞书 Token 获取失败:', error.message);
            throw error;
        }
    }

    /**
     * 发送API请求（自动添加Token）
     */
    async request(method, path, data = null) {
        const token = await this.getTenantAccessToken();
        
        const config = {
            method,
            url: `${FEISHU_CONFIG.baseUrl}${path}`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    }

    /**
     * 获取日历列表
     */
    async getCalendars() {
        return this.request('GET', '/calendar/v4/calendars');
    }

    /**
     * 获取主日历的日程列表
     * @param {string} startTime - 开始时间 (Unix timestamp, 秒)
     * @param {string} endTime - 结束时间 (Unix timestamp, 秒)
     * @param {number} pageSize - 每页数量
     * @param {string} pageToken - 分页token
     */
    async getEvents(startTime, endTime, pageSize = 500, pageToken = null) {
        const params = new URLSearchParams({
            start_time: startTime,
            end_time: endTime,
            page_size: pageSize.toString()
        });
        if (pageToken) {
            params.append('page_token', pageToken);
        }
        return this.request('GET', `/calendar/v4/calendars/${FEISHU_CONFIG.primaryCalendar}/events?${params}`);
    }

    /**
     * 创建日程
     * @param {Object} eventData - 日程数据
     */
    async createEvent(eventData) {
        // 转换节点数据为飞书日程格式
        const feishuEvent = this.convertToFeishuEvent(eventData);
        
        return this.request(
            'POST',
            `/calendar/v4/calendars/${FEISHU_CONFIG.primaryCalendar}/events`,
            feishuEvent
        );
    }

    /**
     * 更新日程
     * @param {string} eventId - 日程ID
     * @param {Object} eventData - 日程数据
     */
    async updateEvent(eventId, eventData) {
        const feishuEvent = this.convertToFeishuEvent(eventData);
        
        return this.request(
            'PATCH',
            `/calendar/v4/calendars/${FEISHU_CONFIG.primaryCalendar}/events/${eventId}`,
            feishuEvent
        );
    }

    /**
     * 删除日程
     * @param {string} eventId - 日程ID
     */
    async deleteEvent(eventId) {
        return this.request(
            'DELETE',
            `/calendar/v4/calendars/${FEISHU_CONFIG.primaryCalendar}/events/${eventId}`
        );
    }

    /**
     * 将项目节点转换为飞书日程格式
     * @param {Object} node - 项目节点数据
     */
    convertToFeishuEvent(node) {
        // 将日期转换为时间戳 (秒)
        const startDate = new Date(node.start_date);
        const endDate = new Date(node.end_date);
        
        // 结束日期需要加一天，因为飞书的 end_time 不包含当天
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);

        const event = {
            summary: `[${node.project_name || '项目'}] ${node.name}`,
            description: this.buildDescription(node),
            start_time: {
                timestamp: Math.floor(startDate.getTime() / 1000).toString(),
                timezone: 'Asia/Shanghai'
            },
            end_time: {
                timestamp: Math.floor(endDateTime.getTime() / 1000).toString(),
                timezone: 'Asia/Shanghai'
            },
            reminders: [
                { minutes: 1440 },  // 1天前提醒
                { minutes: 60 }     // 1小时前提醒
            ],
            color: this.getColorId(node.color),
            location: {
                name: node.location || ''
            }
        };

        // 添加参与者
        if (node.leader || (node.members && JSON.parse(node.members || '[]').length > 0)) {
            event.attendees = {
                need_notification: true
            };
        }

        return event;
    }

    /**
     * 构建日程描述
     */
    buildDescription(node) {
        const parts = [];
        
        if (node.dept) {
            parts.push(`负责部门：${node.dept}`);
        }
        if (node.leader) {
            parts.push(`负责人：${node.leader}`);
        }
        if (node.members) {
            const memberList = JSON.parse(node.members || '[]');
            if (memberList.length > 0) {
                parts.push(`执行人员：${memberList.join('、')}`);
            }
        }
        if (node.note) {
            parts.push(`备注：${node.note}`);
        }
        
        parts.push(`\n---\n由 Film Studio Tools 自动同步`);
        
        return parts.join('\n');
    }

    /**
     * 获取颜色ID
     * 飞书日历颜色ID: 0-10
     */
    getColorId(color) {
        const colorMap = {
            'blue': 1,    // 蓝色
            'green': 2,   // 绿色
            'orange': 3,  // 橙色
            'red': 4,     // 红色
            'purple': 5,  // 紫色
            'pink': 6,    // 粉色
            'teal': 7     // 青色
        };
        return colorMap[color] || 0;
    }

    /**
     * 检查飞书配置是否完整
     */
    isConfigured() {
        return FEISHU_CONFIG.appId && FEISHU_CONFIG.appSecret;
    }
}

// 导出单例
module.exports = new FeishuCalendarService();
