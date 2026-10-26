import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// 导入stores
import { useTaskStore } from './stores/taskStore'
import { useAIStore } from './stores/aiStore'
import { useUIStore } from './stores/uiStore'

// 导入视图组件
import ListView from './views/ListView.vue'
import KanbanView from './views/KanbanView.vue'
import CalendarView from './views/CalendarView.vue'
import StatisticsView from './views/StatisticsView.vue'

// 创建路由
const routes = [
    { path: '/', redirect: '/list' },
    { path: '/list', component: ListView },
    { path: '/kanban', component: KanbanView },
    { path: '/calendar', component: CalendarView },
    { path: '/statistics', component: StatisticsView }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 创建应用
const app = createApp(App)
const pinia = createPinia()

// 使用pinia和router
app.use(pinia)
app.use(router)

// 在组件外使用store（可选）
const taskStore = useTaskStore()
const aiStore = useAIStore()
const uiStore = useUIStore()

// 将stores暴露给全局（开发调试用）
if (import.meta.env.DEV) {
    window.taskStore = taskStore
    window.aiStore = aiStore
    window.uiStore = uiStore
}

app.mount('#app')

console.log('✅ 应用启动成功！')
console.log('📱 任务数量：', taskStore.tasks.length)

