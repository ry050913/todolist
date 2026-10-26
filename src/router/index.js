import { createRouter, createWebHistory } from 'vue-router'
import ListView from '../views/ListView.vue'
import KanbanView from '../views/KanbanView.vue'
import CalendarView from '../views/CalendarView.vue'
import StatisticsView from '../views/StatisticsView.vue'

const routes = [
    {
        path: '/',
        redirect: '/list'
    },
    {
        path: '/list',
        name: 'List',
        component: ListView
    },
    {
        path: '/kanban',
        name: 'Kanban',
        component: KanbanView
    },
    {
        path: '/calendar',
        name: 'Calendar',
        component: CalendarView
    },
    {
        path: '/statistics',
        name: 'Statistics',
        component: StatisticsView
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router