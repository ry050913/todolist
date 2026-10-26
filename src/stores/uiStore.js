// stores/uiStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

export const useUIStore = defineStore('ui', () => {
    // 主题设置
    const theme = useStorage('todo-theme', 'light')
    const viewMode = useStorage('todo-view-mode', 'list')

    // UI 状态
    const showStatistics = ref(false)
    const showAIPanel = ref(false)
    const showTaskDetail = ref(false)
    const selectedTask = ref(null)

    // 添加 filter 属性（如果报错提到 .filter）
    const filter = ref('all') // 添加这行

    // Actions
    const toggleTheme = () => {
        theme.value = theme.value === 'light' ? 'dark' : 'light'
    }

    const toggleViewMode = () => {
        const modes = ['list', 'kanban', 'calendar']
        const currentIndex = modes.indexOf(viewMode.value)
        const nextIndex = (currentIndex + 1) % modes.length
        viewMode.value = modes[nextIndex]
    }

    const selectTask = (task) => {
        selectedTask.value = task
        showTaskDetail.value = true
    }

    return {
        theme,
        viewMode,
        showStatistics,
        showAIPanel,
        showTaskDetail,
        selectedTask,
        filter, // 添加这行
        toggleTheme,
        toggleViewMode,
        selectTask
    }
})
