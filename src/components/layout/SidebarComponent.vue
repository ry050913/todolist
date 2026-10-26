<template>
  <aside class="sidebar" :class="{ 'dark-mode': uiStore.theme === 'dark' }">
    <nav class="nav-menu">
      <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'active': $route.path === item.path }"
          active-class="active"
      >
        <span class="icon-wrapper">
          <span class="icon">{{ item.icon }}</span>
          <span class="hover-effect"></span>
        </span>
        <span class="text">{{ item.text }}</span>
        <span class="active-indicator"></span>
      </router-link>
    </nav>

    <div class="statistics">
      <div class="stat-header">
        <span class="stat-icon">📈</span>
        <span class="stat-title">统计概览</span>
      </div>

      <div class="stat-grid">
        <div class="stat-card" v-for="(stat, key) in formattedStats" :key="key">
          <div class="stat-card-content">
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-unit">{{ stat.unit }}</span>
          </div>
          <div class="stat-progress" v-if="key === 'completionRate'">
            <div class="progress-bar">
              <div
                  class="progress-fill"
                  :style="{ width: stats.completionRate + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useTaskStore } from '../../stores/taskStore'
import { useUIStore } from '../../stores/uiStore'
import { useRoute } from 'vue-router'

const taskStore = useTaskStore()
const uiStore = useUIStore()
const route = useRoute()

const menuItems = [
  { path: '/list', icon: '📋', text: '列表视图' },
  { path: '/kanban', icon: '📌', text: '看板视图' },
  { path: '/calendar', icon: '📅', text: '日历视图' },
  { path: '/statistics', icon: '📊', text: '统计' }
]

const stats = computed(() => {
  const total = taskStore.tasks.length
  const completed = taskStore.tasks.filter(t => t.completed).length
  const pending = taskStore.tasks.filter(t => !t.completed).length

  return {
    total,
    completed,
    pending,
    completionRate: total ? Math.round((completed / total) * 100) : 0
  }
})

const formattedStats = computed(() => ({
  total: {
    label: '总任务',
    value: stats.value.total,
    unit: '个',
    color: 'var(--info-color, #2196f3)'
  },
  completed: {
    label: '已完成',
    value: stats.value.completed,
    unit: '个',
    color: 'var(--success-color, #4caf50)'
  },
  pending: {
    label: '进行中',
    value: stats.value.pending,
    unit: '个',
    color: 'var(--warning-color, #ff9800)'
  },
  completionRate: {
    label: '完成率',
    value: stats.value.completionRate,
    unit: '%',
    color: 'var(--primary-color, #1976d2)'
  }
}))
</script>

<style scoped>
/* 基础样式 */
.sidebar {
  width: 240px;
  background: var(--surface-color, #ffffff);
  border-right: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  position: relative;
  overflow: hidden;
}

.nav-menu {
  flex: 1;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 14px 24px;
  color: var(--text-secondary, #666666);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 12px;
  border-radius: var(--border-radius-md, 8px);
  overflow: hidden;
}

.nav-item:hover {
  background: var(--hover-color, #f5f5f5);
  color: var(--text-color, #333333);
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(
      135deg,
      rgba(25, 118, 210, 0.1) 0%,
      rgba(25, 118, 210, 0.2) 100%
  );
  color: var(--primary-color, #1976d2);
  font-weight: 500;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: var(--primary-color, #1976d2);
  border-radius: 0 var(--border-radius-sm, 4px) var(--border-radius-sm, 4px) 0;
  opacity: 0;
  transition: opacity 0.3s;
}

.nav-item.active .active-indicator {
  opacity: 1;
}

.icon-wrapper {
  position: relative;
  margin-right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  font-size: 1.3rem;
  transition: transform 0.3s;
  position: relative;
  z-index: 2;
}

.hover-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--primary-color, #1976d2);
  border-radius: var(--border-radius-md, 8px);
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s;
}

.nav-item:hover .hover-effect {
  opacity: 0.1;
  transform: scale(1);
}

.nav-item.active .icon {
  transform: scale(1.1);
}

.nav-item .text {
  font-size: 0.95rem;
  flex: 1;
  transition: color 0.3s;
}

/* 统计区域 */
.statistics {
  padding: 24px;
  border-top: 1px solid var(--border-color, #e0e0e0);
  background: rgba(0, 0, 0, 0.02);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  color: var(--text-color, #333333);
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-title {
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: var(--border-radius-md, 8px);
  padding: 16px;
  border: 1px solid var(--border-color, #e0e0e0);
  transition: all 0.3s;
  box-shadow: var(--card-shadow, 0 2px 4px rgba(0, 0, 0, 0.05));
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--elevation-1, 0 4px 8px rgba(0, 0, 0, 0.1));
}

.stat-card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary, #666666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color, #333333);
  line-height: 1;
}

.stat-unit {
  font-size: 0.75rem;
  color: var(--text-secondary, #666666);
  margin-top: 2px;
}

.stat-progress {
  margin-top: 12px;
}

.progress-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color, #1976d2);
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 深色模式样式 */
.sidebar.dark-mode {
  background: var(--surface-color, #1e1e1e);
  border-right-color: var(--border-color, #2d2d2d);
}

.sidebar.dark-mode .nav-item {
  color: var(--text-secondary, #b0b0b0);
}

.sidebar.dark-mode .nav-item:hover {
  background: var(--hover-color, #2a2a2a);
  color: var(--text-color, #ffffff);
}

.sidebar.dark-mode .nav-item.active {
  background: linear-gradient(
      135deg,
      rgba(144, 202, 249, 0.1) 0%,
      rgba(144, 202, 249, 0.2) 100%
  );
  color: var(--primary-color, #90caf9);
  box-shadow: 0 2px 8px rgba(144, 202, 249, 0.1);
}

.sidebar.dark-mode .nav-item.active .active-indicator {
  background: var(--primary-color, #90caf9);
  box-shadow: 0 0 8px rgba(144, 202, 249, 0.5);
}

.sidebar.dark-mode .statistics {
  background: var(--secondary-color, #1e1e1e);
  border-top-color: var(--border-color, #2d2d2d);
}

.sidebar.dark-mode .stat-header {
  color: var(--text-color, #ffffff);
}

.sidebar.dark-mode .stat-card {
  background: var(--surface-color, #1e1e1e);
  border-color: var(--border-color, #2d2d2d);
  box-shadow: var(--elevation-1, 0 2px 4px rgba(0, 0, 0, 0.3));
}

.sidebar.dark-mode .stat-card:hover {
  background: var(--hover-color, #2a2a2a);
  box-shadow: var(--elevation-2, 0 4px 8px rgba(0, 0, 0, 0.4));
}

.sidebar.dark-mode .stat-label {
  color: var(--text-secondary, #b0b0b0);
}

.sidebar.dark-mode .stat-value {
  color: var(--text-color, #ffffff);
}

.sidebar.dark-mode .progress-bar {
  background: var(--secondary-color, #1e1e1e);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }

  .nav-item {
    padding: 12px 20px;
    margin: 0 8px;
  }

  .statistics {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 180px;
  }

  .nav-item {
    padding: 10px 16px;
    margin: 0 4px;
  }

  .icon-wrapper {
    margin-right: 12px;
    width: 28px;
    height: 28px;
  }

  .icon {
    font-size: 1.2rem;
  }

  .nav-item .text {
    font-size: 0.9rem;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 14px;
  }

  .stat-value {
    font-size: 1.3rem;
  }
}

@media (max-width: 640px) {
  .sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }

  .nav-menu {
    flex-direction: row;
    padding: 16px 0;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .nav-item {
    flex-direction: column;
    padding: 12px;
    min-width: 80px;
    text-align: center;
    margin: 0;
  }

  .icon-wrapper {
    margin-right: 0;
    margin-bottom: 8px;
  }

  .active-indicator {
    left: 50%;
    top: auto;
    bottom: 0;
    transform: translateX(-50%);
    width: 24px;
    height: 4px;
    border-radius: var(--border-radius-sm, 4px) var(--border-radius-sm, 4px) 0 0;
  }

  .statistics {
    display: none;
  }
}

/* 滚动条样式 */
.sidebar.dark-mode .nav-menu::-webkit-scrollbar {
  height: 6px;
}

.sidebar.dark-mode .nav-menu::-webkit-scrollbar-track {
  background: var(--scrollbar-track, #1a1a1a);
}

.sidebar.dark-mode .nav-menu::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, #424242);
}

/* 减少动效 */
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .nav-item,
  .stat-card,
  .progress-fill {
    transition: none !important;
  }

  .nav-item:hover {
    transform: none !important;
  }

  .stat-card:hover {
    transform: none !important;
  }
}
</style>