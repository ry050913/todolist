import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { v4 as uuidv4 } from 'uuid'

export const useTaskStore = defineStore('tasks', () => {
    // 使用本地存储
    const tasks = useStorage('todo-tasks', [
        {
            id: '1',
            title: '示例任务',
            description: '这是一个示例任务',
            category: 'work',
            priority: 'medium',
            dueDate: new Date().toISOString().split('T')[0],
            completed: false,
            createdAt: new Date().toISOString(),
            tags: ['示例']
        }
    ])

    // 状态
    const filter = ref('all')
    const sortBy = ref('dueDate')
    const searchQuery = ref('')
    const selectedCategory = ref('all')

    // 计算属性
    const filteredTasks = computed(() => {
        return tasks.value.filter(task => {
            const matchesFilter = filter.value === 'all' ||
                (filter.value === 'active' && !task.completed) ||
                (filter.value === 'completed' && task.completed)

            const matchesSearch = !searchQuery.value ||
                task.title.toLowerCase().includes(searchQuery.value.toLowerCase())

            const matchesCategory = selectedCategory.value === 'all' ||
                task.category === selectedCategory.value

            return matchesFilter && matchesSearch && matchesCategory
        })
    })

    const categories = computed(() => {
        const cats = new Set(tasks.value.map(t => t.category).filter(Boolean))
        return ['all', ...cats]
    })

    // Actions
    // taskStore.js 中的 addTask 函数保持不变（应该已经是响应式的）
    // 更新 addTask 函数
    const addTask = (taskData) => {
        const newTask = {
            id: uuidv4(),
            title: taskData.title,
            description: taskData.description || '',
            category: taskData.category || 'general',
            priority: taskData.priority || 'medium',
            // 保留原有字段用于兼容
            dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
            completed: false,
            createdAt: new Date().toISOString(),
            tags: taskData.tags || [],
            // 新增字段
            startDate: taskData.startDate || taskData.dueDate || new Date().toISOString().split('T')[0],
            endDate: taskData.endDate || taskData.dueDate || new Date().toISOString().split('T')[0],
            startTime: taskData.startTime || '全天',
            endTime: taskData.endTime || '全天',
            taskType: taskData.taskType || 'allDay',
            estimatedTime: taskData.estimatedTime || 60
        }

        tasks.value.unshift(newTask) // 这里已经响应式更新
        return newTask
    }

    const updateTask = (id, updates) => {
        const index = tasks.value.findIndex(t => t.id === id)
        if (index !== -1) {
            // 使用 Object.assign 来合并更新，确保不丢失原有字段
            tasks.value[index] = Object.assign({}, tasks.value[index], updates)
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
        addTask,
        updateTask,
        deleteTask,
        toggleTask
    }
})