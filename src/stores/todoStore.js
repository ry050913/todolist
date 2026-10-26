import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { v4 as uuidv4 } from 'uuid'

export const useTaskStore = defineStore('tasks', () => {
    // 使用本地存储
    const tasks = useStorage('todo-tasks', [])

    // 状态
    const filter = ref('all') // all, active, completed
    const sortBy = ref('dueDate') // dueDate, priority, createdAt
    const searchQuery = ref('')
    const selectedCategory = ref('all')

    // 计算属性
    const filteredTasks = computed(() => {
        return tasks.value.filter(task => {
            const matchesFilter = filter.value === 'all' ||
                (filter.value === 'active' && !task.completed) ||
                (filter.value === 'completed' && task.completed)

            const matchesSearch = !searchQuery.value ||
                task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.value.toLowerCase())

            const matchesCategory = selectedCategory.value === 'all' ||
                task.category === selectedCategory.value

            return matchesFilter && matchesSearch && matchesCategory
        }).sort((a, b) => {
            switch(sortBy.value) {
                case 'dueDate': return new Date(a.dueDate) - new Date(b.dueDate)
                case 'priority': return getPriorityValue(b.priority) - getPriorityValue(a.priority)
                default: return new Date(b.createdAt) - new Date(a.createdAt)
            }
        })
    })

    const categories = computed(() => {
        const cats = new Set(tasks.value.map(t => t.category).filter(Boolean))
        return ['all', ...cats]
    })

    const statistics = computed(() => {
        const total = tasks.value.length
        const completed = tasks.value.filter(t => t.completed).length
        const overdue = tasks.value.filter(t =>
            !t.completed && new Date(t.dueDate) < new Date()
        ).length

        return {
            total,
            completed,
            overdue,
            completionRate: total ? Math.round((completed / total) * 100) : 0
        }
    })

    // 工具函数
    const getPriorityValue = (priority) => {
        const values = { high: 3, medium: 2, low: 1 }
        return values[priority] || 0
    }

    // Actions
    const addTask = (taskData) => {
        const newTask = {
            id: uuidv4(),
            title: taskData.title,
            description: taskData.description || '',
            category: taskData.category || 'general',
            priority: taskData.priority || 'medium',
            dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
            subtasks: taskData.subtasks || [],
            tags: taskData.tags || [],
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            estimatedTime: taskData.estimatedTime || 30,
            actualTime: 0,
            attachments: [],
            aiSuggestions: taskData.aiSuggestions || {}
        }

        tasks.value.unshift(newTask)
        return newTask
    }

    const updateTask = (id, updates) => {
        const index = tasks.value.findIndex(t => t.id === id)
        if (index !== -1) {
            tasks.value[index] = { ...tasks.value[index], ...updates }

            // 如果标记为完成，设置完成时间
            if (updates.completed && !tasks.value[index].completedAt) {
                tasks.value[index].completedAt = new Date().toISOString()
            }
        }
    }

    const deleteTask = (id) => {
        const index = tasks.value.findIndex(t => t.id === id)
        if (index !== -1) {
            tasks.value.splice(index, 1)
        }
    }

    const toggleTask = (id) => {
        const task = tasks.value.find(t => t.id === id)
        if (task) {
            task.completed = !task.completed
            task.completedAt = task.completed ? new Date().toISOString() : null
        }
    }

    const addSubtask = (taskId, subtaskTitle) => {
        const task = tasks.value.find(t => t.id === taskId)
        if (task) {
            if (!task.subtasks) task.subtasks = []
            task.subtasks.push({
                id: uuidv4(),
                title: subtaskTitle,
                completed: false
            })
        }
    }

    return {
        tasks,
        filter,
        sortBy,
        searchQuery,
        selectedCategory,
        filteredTasks,
        categories,
        statistics,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        addSubtask,
        getPriorityValue
    }
})