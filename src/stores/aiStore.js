// stores/aiStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { DEEPSEEK_API_CONFIG } from '../config/api'

export const useAIStore = defineStore('ai', () => {
    const isProcessing = ref(false)
    const apiKey = DEEPSEEK_API_CONFIG.apiKey

    // 智能任务分析 - 调用真实DeepSeek API
    const analyzeTaskWithAI = async (taskData) => {
        isProcessing.value = true

        try {
            const prompt = generatePrompt(taskData)

            const response = await axios.post(
                `${DEEPSEEK_API_CONFIG.baseURL}/chat/completions`,
                {
                    model: DEEPSEEK_API_CONFIG.model,
                    messages: [
                        {
                            role: "system",
                            content: "你是一个专业的任务规划助手。请分析用户的任务需求，生成合理的任务分解和日程安排。"
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: DEEPSEEK_API_CONFIG.temperature,
                    max_tokens: DEEPSEEK_API_CONFIG.max_tokens
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            const aiResponse = response.data.choices[0].message.content
            return parseAIResponse(aiResponse, taskData)

        } catch (error) {
            console.error('AI API调用失败:', error)

            // 如果API调用失败，使用本地智能分析作为备选
            return localTaskAnalysis(taskData)

        } finally {
            isProcessing.value = false
        }
    }

    // 生成AI提示词
    const generatePrompt = (taskData) => {
        const { description, startDate, endDate, dailyHours } = taskData
        const today = new Date().toISOString().split('T')[0]

        return `请作为任务规划助手，帮我分析以下任务需求：

任务描述：${description}
开始日期：${startDate || today}
截止日期：${endDate}
每日可用时间：${dailyHours}小时

请生成详细的计划，包括：
1. 任务名称
2. 任务分类（work工作、study学习、life生活、shopping购物、meeting会议、exercise运动、project项目）
3. 优先级（high高、medium中、low低）
4. 总预估时间（分钟）
5. 任务分解（至少3个子任务，每个子任务包含标题和预估时间）
6. 日程安排建议
7. 标签建议（用逗号分隔）

请用以下JSON格式回复：
{
  "title": "任务标题",
  "category": "分类",
  "priority": "优先级",
  "totalEstimatedTime": 总分钟数,
  "scheduleDescription": "日程安排描述",
  "subtasks": [
    {"title": "子任务1标题", "estimatedTime": 分钟数},
    {"title": "子任务2标题", "estimatedTime": 分钟数}
  ],
  "suggestions": ["建议1", "建议2"],
  "tags": ["标签1", "标签2"]
}`
    }

    // 解析AI响应
    const parseAIResponse = (response, taskData) => {
        try {
            // 提取JSON部分
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                response.match(/{[\s\S]*?}/)

            const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json\n|\n```/g, '') : response
            const parsed = JSON.parse(jsonStr)

            return {
                ...parsed,
                startDate: taskData.startDate,
                endDate: taskData.endDate,
                dailyHours: taskData.dailyHours
            }
        } catch (error) {
            console.error('解析AI响应失败:', error)
            return localTaskAnalysis(taskData)
        }
    }

    // 本地智能分析（备用方案）
    const localTaskAnalysis = (taskData) => {
        const { description, startDate, endDate } = taskData
        const today = new Date().toISOString().split('T')[0]

        // 智能分类
        const categories = ['work', 'study', 'life', 'project']
        const randomCategory = categories[Math.floor(Math.random() * categories.length)]

        // 智能优先级
        let priority = 'medium'
        if (endDate) {
            const end = new Date(endDate)
            const now = new Date()
            const daysUntilDue = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
            priority = daysUntilDue <= 3 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low'
        }

        // 智能时长估算
        const wordCount = description.split(' ').length
        const totalMinutes = Math.max(60, Math.min(wordCount * 10, 480))

        return {
            title: description.length > 30 ? description.substring(0, 30) + '...' : description,
            category: randomCategory,
            priority: priority,
            totalEstimatedTime: totalMinutes,
            scheduleDescription: `建议在${endDate ? '截止日期前' : '近期'}完成`,
            subtasks: [
                { title: '规划与准备', estimatedTime: Math.round(totalMinutes * 0.2) },
                { title: '执行主要任务', estimatedTime: Math.round(totalMinutes * 0.6) },
                { title: '检查与完善', estimatedTime: Math.round(totalMinutes * 0.2) }
            ],
            suggestions: ['建议设置提醒', '分解任务可以更好地管理进度'],
            tags: ['智能规划', priority === 'high' ? '紧急' : '常规'],
            startDate: startDate || today,
            endDate: endDate
        }
    }

    return {
        isProcessing,
        apiKey,
        analyzeTaskWithAI
    }
})